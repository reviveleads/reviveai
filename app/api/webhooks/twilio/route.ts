import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateConversationReply } from '@/lib/ai/conversation'
import { sendSMS } from '@/lib/twilio/sms'
import { sendEmail } from '@/lib/resend/email'
import { Conversation } from '@/types'
import { isOptOutKeyword, isOptInKeyword, addSMSFooter } from '@/lib/compliance/optOut'
import { isWithinSendingHours } from '@/lib/compliance/quietHours'
import { isDoNotContact } from '@/lib/compliance/doNotContact'

const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

async function sendResponseNotification(
  supabase: ReturnType<typeof createAdminClient>,
  lead: { id: string; first_name: string; last_name: string; vehicle_interest: string | null },
  message: string,
) {
  try {
    const { data: settings } = await supabase
      .from('dealership_settings')
      .select('salesperson_email, salesperson_name')
      .eq('dealership_id', DEMO_DEALERSHIP_ID)
      .single()

    if (!settings?.salesperson_email) return

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const convoUrl = `${appUrl}/conversations/${lead.id}`
    const leadName = `${lead.first_name} ${lead.last_name}`
    const vehicle = lead.vehicle_interest || 'their vehicle of interest'

    await sendEmail({
      to: settings.salesperson_email,
      subject: `🔥 ${leadName} just responded — act fast`,
      html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;margin-top:24px;">
    <div style="background:#dc2626;padding:24px 32px;">
      <p style="color:#fecaca;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Lead Response Alert</p>
      <h1 style="color:white;font-size:20px;font-weight:700;margin:0;">${leadName} just responded</h1>
    </div>
    <div style="padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;width:120px;">Lead</td>
          <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:500;">${leadName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">Vehicle</td>
          <td style="padding:8px 0;color:#111827;font-size:13px;">${vehicle}</td>
        </tr>
      </table>
      <div style="background:#f9fafb;border-left:3px solid #dc2626;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
        <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">Their message</p>
        <p style="color:#111827;font-size:15px;margin:0;font-style:italic;">"${message}"</p>
      </div>
      <a href="${convoUrl}" style="display:inline-block;background:#2563eb;color:white;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">View Conversation →</a>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">ReviveAI — respond while they're warm</p>
    </div>
  </div>
</body>
</html>`,
      text: `${leadName} just responded!\n\nVehicle: ${vehicle}\nMessage: "${message}"\n\nView conversation: ${convoUrl}`,
    })
  } catch (err) {
    console.error('[twilio] response notification failed:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string

    if (!from || !body) {
      return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
    }

    const supabase = createAdminClient()

    // Find lead by phone number
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', from)
      .limit(1)

    if (!leads || leads.length === 0) {
      console.warn(`[twilio] Inbound SMS from unknown number: ${from}`)
      return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
    }

    const lead = leads[0]

    // --- OPT-OUT HANDLING ---
    if (isOptOutKeyword(body)) {
      await supabase
        .from('leads')
        .update({ opted_out: true, status: 'opted_out' })
        .eq('id', lead.id)

      await supabase.from('conversations').insert({
        lead_id: lead.id,
        channel: 'sms',
        direction: 'inbound',
        message: body,
      })

      console.log(`[twilio] Opt-out received from ${from} — lead ${lead.id} marked opted_out`)
      return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
    }

    // --- OPT-IN (re-subscribe) HANDLING ---
    if (isOptInKeyword(body)) {
      await supabase
        .from('leads')
        .update({ opted_out: false, status: 'pending' })
        .eq('id', lead.id)

      await supabase.from('conversations').insert({
        lead_id: lead.id,
        channel: 'sms',
        direction: 'inbound',
        message: body,
      })

      console.log(`[twilio] Opt-in received from ${from} — lead ${lead.id} reactivated`)
      return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
    }

    // --- BLOCK replies to opted-out leads ---
    if (lead.opted_out) {
      console.warn(`[twilio] Ignoring inbound from opted-out lead ${lead.id}`)
      return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
    }

    // --- Do Not Contact check ---
    const blocked = await isDoNotContact(DEMO_DEALERSHIP_ID, from, lead.email)
    if (blocked) {
      await supabase.from('leads').update({ status: 'dead' }).eq('id', lead.id)
      console.warn(`[twilio] Lead ${lead.id} is on Do Not Contact list — marked dead`)
      return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
    }

    // --- Store inbound message ---
    await supabase.from('conversations').insert({
      lead_id: lead.id,
      channel: 'sms',
      direction: 'inbound',
      message: body,
    })

    await supabase.from('leads').update({ status: 'responded' }).eq('id', lead.id)

    // --- Notify salesperson immediately (fire and forget) ---
    sendResponseNotification(supabase, lead, body)

    // --- Quiet hours check ---
    if (!isWithinSendingHours()) {
      console.log(`[twilio] Inbound from ${from} received outside quiet hours — no auto-reply`)
      return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
    }

    // --- Skip AI reply if ai_paused ---
    if (lead.ai_paused) {
      console.log(`[twilio] AI paused for lead ${lead.id} — skipping auto-reply`)
      return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
    }

    // --- Generate AI reply ---
    const { data: history } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .order('sent_at', { ascending: true })

    const vehicle = lead.vehicle_interest ?? 'the vehicle you were interested in'
    const aiReply = await generateConversationReply(
      lead.first_name,
      vehicle,
      (history ?? []) as Conversation[],
      body
    )

    await sendSMS(from, addSMSFooter(aiReply))

    await supabase.from('conversations').insert({
      lead_id: lead.id,
      channel: 'sms',
      direction: 'outbound',
      message: aiReply,
      sent_by: 'ai',
    })

    return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
  } catch (err: any) {
    console.error('[twilio] webhook error:', err)
    return new NextResponse(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
  }
}
