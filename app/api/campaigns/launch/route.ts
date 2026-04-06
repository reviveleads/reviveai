import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateFirstTouchSMS, generateFollowUpEmail } from '@/lib/ai/conversation'
import { sendSMS } from '@/lib/twilio/sms'
import { sendEmail } from '@/lib/resend/email'
import { Lead } from '@/types'
import { addSMSFooter } from '@/lib/compliance/optOut'
import { isWithinSendingHours, nextSendWindowISO } from '@/lib/compliance/quietHours'
import { buildAIContext } from '@/lib/intel/vehicleSearch'
import { classifyIntent } from '@/lib/intel/intentClassifier'
import { estimateCurrentMileage, checkMilestoneCrossed } from '@/lib/intel/seasonalContext'
import { classifyTier } from '@/lib/sequences/tierClassifier'
import { buildSequence } from '@/lib/sequences/scheduleBuilder'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'
const TCPA_MAX_MONTHS = 18

export async function POST(_request: NextRequest) {
  const supabase = createAdminClient()

  const { data: leads, error: fetchError } = await supabase
    .from('leads').select('*')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .in('status', ['pending', 'abandoned'])
    .eq('opted_out', false)

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!leads?.length) return NextResponse.json({ message: 'No pending or abandoned leads to contact', total: 0, succeeded: 0, failed: 0, held: 0, skipped_fresh: 0 })

  if (!isWithinSendingHours()) {
    return NextResponse.json({
      message: 'Outside quiet hours (9am–8pm ET). Messages held.',
      total: leads.length, succeeded: 0, failed: 0, held: leads.length, skipped_fresh: 0,
      send_at: nextSendWindowISO(),
    })
  }

  const { data: settings } = await supabase
    .from('dealership_settings').select('salesperson_name, dealership_name, sending_email')
    .eq('dealership_id', DEMO_DEALERSHIP_ID).single()

  const salespersonName = settings?.salesperson_name || 'Jake'
  const dealershipName = settings?.dealership_name || 'the dealership'

  const results: { id: string; success: boolean; tier?: string; skipped?: string; error?: string }[] = []
  let skippedFresh = 0
  let skippedTcpa = 0
  const launchAt = new Date()

  for (const lead of leads as Lead[]) {
    // TCPA 18-month limit
    const ageMonths = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    if (ageMonths > TCPA_MAX_MONTHS) {
      skippedTcpa++
      results.push({ id: lead.id, success: false, skipped: 'tcpa_age' })
      continue
    }

    // Classify tier — skip if too fresh (< 30 days)
    const tier = classifyTier(lead.last_contact_date, lead.created_at)
    if (!tier) {
      skippedFresh++
      results.push({ id: lead.id, success: false, skipped: 'too_fresh' })
      continue
    }

    try {
      const vehicle = lead.vehicle_interest ?? 'the vehicle you were interested in'

      // Classify intent
      const intent = lead.lead_intent ?? classifyIntent(vehicle)
      if (!lead.lead_intent) {
        await supabase.from('leads').update({ lead_intent: intent }).eq('id', lead.id)
      }

      // Mileage milestone
      if (lead.trade_in_mileage && lead.created_at && !lead.mileage_milestone_triggered) {
        const estimated = estimateCurrentMileage(lead.trade_in_mileage, lead.created_at)
        if (checkMilestoneCrossed(lead.trade_in_mileage, estimated)) {
          await supabase.from('leads').update({ mileage_milestone_triggered: true }).eq('id', lead.id)
        }
      }

      // Persist tier
      await supabase.from('leads').update({ lead_tier: tier }).eq('id', lead.id)

      // Generate sequence records and upsert (skip existing)
      const sequenceRecords = buildSequence(lead.id, DEMO_DEALERSHIP_ID, tier, launchAt)
      await supabase.from('campaign_sequences').upsert(sequenceRecords, {
        onConflict: 'lead_id,touch_number',
        ignoreDuplicates: true,
      })

      // Cold leads: skip immediate send — cron handles touch 1 (email)
      if (tier === 'cold') {
        await supabase.from('leads').update({ status: 'contacted' }).eq('id', lead.id)
        results.push({ id: lead.id, success: true, tier })
        continue
      }

      // Hot/warm: send touch 1 SMS immediately
      const aiContext = await buildAIContext(
        supabase, { ...lead, lead_intent: intent }, DEMO_DEALERSHIP_ID, salespersonName
      )

      const leadContext = {
        trade_in_make: lead.trade_in_make ?? null,
        trade_in_model: lead.trade_in_model ?? null,
        trade_in_year: lead.trade_in_year ?? null,
        trade_in_mileage: lead.trade_in_mileage ?? null,
        budget_notes: lead.budget_notes ?? null,
        created_at: lead.created_at,
      }

      const aiMessage = await generateFirstTouchSMS(
        lead.first_name, vehicle, salespersonName, null, leadContext, aiContext
      )

      await supabase.from('conversations').insert({
        lead_id: lead.id, channel: 'sms', direction: 'outbound', message: aiMessage,
      })
      await supabase.from('leads').update({ status: 'contacted' }).eq('id', lead.id)

      try {
        await sendSMS(lead.phone, addSMSFooter(aiMessage))
      } catch (smsErr: any) {
        console.error(`[campaign] SMS failed for lead ${lead.id}:`, smsErr.message)
      }

      results.push({ id: lead.id, success: true, tier })
    } catch (err: any) {
      console.error(`[campaign] Failed for lead ${lead.id}:`, err.message)
      results.push({ id: lead.id, success: false, error: err.message })
    }
  }

  // Count sequences_active after this launch
  const { data: activeSeqLeads } = await supabase
    .from('campaign_sequences')
    .select('lead_id')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .eq('status', 'pending')
  const sequencesActive = new Set(activeSeqLeads?.map((s: { lead_id: string }) => s.lead_id) ?? []).size

  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success && !r.skipped).length

  return NextResponse.json({
    total: leads.length,
    succeeded,
    failed,
    held: 0,
    skipped_fresh: skippedFresh,
    skipped_tcpa: skippedTcpa,
    sequences_active: sequencesActive,
    results,
  })
}
