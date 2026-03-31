import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateConversationReply, generateFirstTouchSMS } from '@/lib/ai/conversation'
import { sendSMS } from '@/lib/twilio/sms'
import { Conversation } from '@/types'
import { addSMSFooter } from '@/lib/compliance/optOut'
import { isWithinSendingHours, nextSendWindowISO } from '@/lib/compliance/quietHours'
import { buildAIContext } from '@/lib/intel/vehicleSearch'
import { classifyIntent } from '@/lib/intel/intentClassifier'
import { estimateCurrentMileage, checkMilestoneCrossed } from '@/lib/intel/seasonalContext'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()

  const { data: lead, error: leadError } = await supabase
    .from('leads').select('*').eq('id', params.id).single()

  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.opted_out) return NextResponse.json({ error: 'Lead has opted out of communications' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const prewrittenMessage: string | undefined = body?.message
  const sentBy: string = body?.sent_by ?? 'ai'

  // If a pre-written message is provided, skip AI generation and quiet-hours check
  if (prewrittenMessage) {
    await supabase.from('conversations').insert({
      lead_id: lead.id, channel: 'sms', direction: 'outbound', message: prewrittenMessage, sent_by: sentBy,
    })
    const leadUpdate: Record<string, unknown> = { status: 'contacted' }
    if (sentBy === 'manual') leadUpdate.ai_paused = true
    await supabase.from('leads').update(leadUpdate).eq('id', lead.id)

    let smsSent = true
    let smsError: string | undefined
    try {
      await sendSMS(lead.phone, addSMSFooter(prewrittenMessage))
    } catch (err: any) {
      smsSent = false
      smsError = err.message
      console.error('[message] SMS send failed:', err.message)
    }

    return NextResponse.json({ success: true, message: prewrittenMessage, smsSent, smsError })
  }

  if (!isWithinSendingHours()) {
    return NextResponse.json({ error: 'Outside quiet hours (9am–8pm ET)', held: true, send_at: nextSendWindowISO() }, { status: 425 })
  }

  const { data: settings } = await supabase
    .from('dealership_settings').select('salesperson_name, dealership_name')
    .eq('dealership_id', lead.dealership_id).single()

  const salespersonName = settings?.salesperson_name || 'Jake'

  const { data: history } = await supabase
    .from('conversations').select('*')
    .eq('lead_id', params.id).order('sent_at', { ascending: true })

  const vehicle = lead.vehicle_interest ?? 'the vehicle you were interested in'
  const conversations = (history ?? []) as Conversation[]

  // Classify intent and persist if not set
  const intent = lead.lead_intent ?? classifyIntent(vehicle)
  if (!lead.lead_intent) {
    await supabase.from('leads').update({ lead_intent: intent }).eq('id', lead.id)
  }

  // Flag mileage milestone
  if (lead.trade_in_mileage && lead.created_at && !lead.mileage_milestone_triggered) {
    const estimated = estimateCurrentMileage(lead.trade_in_mileage, lead.created_at)
    if (checkMilestoneCrossed(lead.trade_in_mileage, estimated)) {
      await supabase.from('leads').update({ mileage_milestone_triggered: true }).eq('id', lead.id)
    }
  }

  // Build full AI context (news, incentives, inventory, seasonal)
  const aiContext = await buildAIContext(
    supabase,
    { ...lead, lead_intent: intent },
    lead.dealership_id,
    salespersonName
  )

  const leadContext = {
    trade_in_make: lead.trade_in_make ?? null,
    trade_in_model: lead.trade_in_model ?? null,
    trade_in_year: lead.trade_in_year ?? null,
    trade_in_mileage: lead.trade_in_mileage ?? null,
    budget_notes: lead.budget_notes ?? null,
    created_at: lead.created_at,
  }

  let aiMessage: string
  if (conversations.length === 0) {
    aiMessage = await generateFirstTouchSMS(lead.first_name, vehicle, salespersonName, null, leadContext, aiContext)
  } else {
    const lastInbound = [...conversations].reverse().find(c => c.direction === 'inbound')
    aiMessage = await generateConversationReply(
      lead.first_name, vehicle, conversations,
      lastInbound?.message ?? `Follow up with ${lead.first_name} about the ${vehicle}`,
      salespersonName, null, leadContext, aiContext
    )
  }

  // Save conversation FIRST, then attempt SMS
  await supabase.from('conversations').insert({
    lead_id: lead.id, channel: 'sms', direction: 'outbound', message: aiMessage, sent_by: 'ai',
  })
  await supabase.from('leads').update({ status: 'contacted' }).eq('id', lead.id)

  let smsSent = true
  let smsError: string | undefined
  try {
    await sendSMS(lead.phone, addSMSFooter(aiMessage))
  } catch (err: any) {
    smsSent = false
    smsError = err.message
    console.error('[message] SMS send failed:', err.message)
  }

  return NextResponse.json({ success: true, message: aiMessage, smsSent, smsError })
}
