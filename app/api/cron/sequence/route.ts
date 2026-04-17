import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateFirstTouchSMS, generateFollowUpEmail } from '@/lib/ai/conversation'
import { sendSMS } from '@/lib/twilio/sms'
import { sendEmail } from '@/lib/resend/email'
import { addSMSFooter } from '@/lib/compliance/optOut'
import { isWithinSendingHours } from '@/lib/compliance/quietHours'
import { buildAIContext } from '@/lib/intel/vehicleSearch'
import { AIMessageContext } from '@/lib/intel/vehicleSearch'
import { isDoNotContact } from '@/lib/compliance/doNotContact'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'
const TCPA_MAX_MONTHS = 18
const BATCH_SIZE = 50

export async function GET() {
  const supabase = createAdminClient()

  const [{ count: totalPending }, { count: dueNow }] = await Promise.all([
    supabase
      .from('campaign_sequences')
      .select('*', { count: 'exact', head: true })
      .eq('dealership_id', DEMO_DEALERSHIP_ID)
      .eq('status', 'pending'),
    supabase
      .from('campaign_sequences')
      .select('*', { count: 'exact', head: true })
      .eq('dealership_id', DEMO_DEALERSHIP_ID)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString()),
  ])

  return NextResponse.json({
    pending_total: totalPending ?? 0,
    due_now: dueNow ?? 0,
    within_quiet_hours: isWithinSendingHours(),
  })
}

export async function POST(request: NextRequest) {
  // Validate cron secret
  const secret = request.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isWithinSendingHours()) {
    return NextResponse.json({ message: 'Outside quiet hours — no touches sent', processed: 0, skipped: 0, failed: 0 })
  }

  const supabase = createAdminClient()

  const { data: dueSequences, error } = await supabase
    .from('campaign_sequences')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!dueSequences?.length) return NextResponse.json({ processed: 0, skipped: 0, failed: 0, message: 'No due touches' })

  const { data: settings } = await supabase
    .from('dealership_settings')
    .select('salesperson_name, dealership_name, sending_email')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .single()

  const salespersonName = settings?.salesperson_name || 'Jake'
  const dealershipName = settings?.dealership_name || 'the dealership'

  let processed = 0, skipped = 0, failed = 0

  for (const touch of dueSequences) {
    try {
      const { data: lead } = await supabase
        .from('leads').select('*').eq('id', touch.lead_id).single()

      if (!lead) {
        await skipTouch(supabase, touch.id, 'Lead not found')
        skipped++
        continue
      }

      // Opted out — cancel all remaining
      if (lead.opted_out) {
        await cancelRemaining(supabase, lead.id, 'Lead opted out')
        skipped++
        continue
      }

      // Lead responded or appointed — stop automated sequence
      if (['responded', 'appointed'].includes(lead.status)) {
        await cancelRemaining(supabase, lead.id, `Lead ${lead.status} — sequence stopped`)
        skipped++
        continue
      }

      // Paused — leave pending, skip this run
      if (lead.sequence_paused) continue

      // AI paused — dealer is handling manually, skip sequence until re-enabled
      if (lead.ai_paused) continue

      // Do Not Contact check — block and mark dead
      const blocked = await isDoNotContact(DEMO_DEALERSHIP_ID, lead.phone, lead.email)
      if (blocked) {
        await supabase.from('leads').update({ status: 'dead' }).eq('id', lead.id)
        await cancelRemaining(supabase, lead.id, 'Lead on Do Not Contact list — marked dead')
        skipped++
        continue
      }

      // TCPA 18-month limit
      const ageMonths = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      if (ageMonths > TCPA_MAX_MONTHS) {
        await cancelRemaining(supabase, lead.id, 'Lead older than 18 months (TCPA limit)')
        skipped++
        continue
      }

      // No phone — fall back to email if available, otherwise skip this touch
      if (!lead.phone) {
        if (!lead.email) {
          await skipTouch(supabase, touch.id, 'No phone or email on file')
          skipped++
          continue
        }
        // Has email but no phone — send email fallback below
      }

      const vehicle = lead.vehicle_interest ?? 'the vehicle you were interested in'

      // Get conversation history to assess tone
      const { data: history } = await supabase
        .from('conversations')
        .select('direction, message')
        .eq('lead_id', lead.id)
        .order('sent_at', { ascending: true })

      const outboundCount = (history ?? []).filter((c: { direction: string }) => c.direction === 'outbound').length
      const hasInbound = (history ?? []).some((c: { direction: string }) => c.direction === 'inbound')

      // Build AI context and inject sequence-specific signals
      const baseContext = await buildAIContext(
        supabase, { ...lead, lead_intent: lead.lead_intent }, DEMO_DEALERSHIP_ID, salespersonName,
      )

      const pressureNote = outboundCount >= 3 && !hasInbound
        ? `\nNote: ${outboundCount} outbound touches with no response — keep this message shorter and lower pressure than previous ones. Don't ask a question if the last two messages asked questions.`
        : ''

      const enhancedContext: AIMessageContext = {
        ...baseContext,
        contextBlock: `${baseContext.contextBlock}\nSequence touch: ${touch.touch_number}\nPrevious outbound touches: ${outboundCount}${pressureNote}`,
      }

      const leadContext = {
        trade_in_make: lead.trade_in_make ?? null,
        trade_in_model: lead.trade_in_model ?? null,
        trade_in_year: lead.trade_in_year ?? null,
        trade_in_mileage: lead.trade_in_mileage ?? null,
        budget_notes: lead.budget_notes ?? null,
        created_at: lead.created_at,
      }

      // SMS is the primary channel for all sequence touches.
      // Email is only used as a fallback when the lead has no phone number.
      const useEmailFallback = !lead.phone && !!lead.email

      if (useEmailFallback) {
        const { subject, html, text } = await generateFollowUpEmail(
          lead.first_name, vehicle, lead.id, salespersonName, dealershipName,
          null, leadContext, enhancedContext
        )

        await supabase.from('conversations').insert({
          lead_id: lead.id, channel: 'email', direction: 'outbound', message: text,
        })

        try {
          await sendEmail({ to: lead.email!, subject, html, text })
        } catch (emailErr: any) {
          console.error(`[sequence] Email fallback failed for ${lead.id}:`, emailErr.message)
        }
      } else {
        const message = await generateFirstTouchSMS(
          lead.first_name, vehicle, salespersonName, null, leadContext, enhancedContext
        )

        await supabase.from('conversations').insert({
          lead_id: lead.id, channel: 'sms', direction: 'outbound', message,
        })

        try {
          await sendSMS(lead.phone, addSMSFooter(message))
        } catch (smsErr: any) {
          console.error(`[sequence] SMS failed for ${lead.id}:`, smsErr.message)
        }
      }

      // Mark touch sent
      await supabase
        .from('campaign_sequences')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', touch.id)

      // Advance lead status
      if (lead.status === 'pending') {
        await supabase.from('leads').update({ status: 'contacted' }).eq('id', lead.id)
      }

      processed++
    } catch (err: any) {
      console.error(`[sequence] Touch ${touch.id} failed:`, err.message)
      await supabase
        .from('campaign_sequences')
        .update({ status: 'failed', error_message: err.message.slice(0, 500) })
        .eq('id', touch.id)
      failed++
    }
  }

  return NextResponse.json({
    processed,
    skipped,
    failed,
    total: dueSequences.length,
  })
}

async function skipTouch(supabase: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>, touchId: string, reason: string) {
  await supabase
    .from('campaign_sequences')
    .update({ status: 'skipped', error_message: reason, sent_at: new Date().toISOString() })
    .eq('id', touchId)
}

async function cancelRemaining(supabase: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>, leadId: string, reason: string) {
  await supabase
    .from('campaign_sequences')
    .update({ status: 'skipped', error_message: reason, sent_at: new Date().toISOString() })
    .eq('lead_id', leadId)
    .eq('status', 'pending')
}
