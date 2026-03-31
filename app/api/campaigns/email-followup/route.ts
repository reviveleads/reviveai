import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateFollowUpEmail } from '@/lib/ai/conversation'
import { sendEmail } from '@/lib/resend/email'
import { Lead } from '@/types'
import { buildEmailUnsubscribeFooterHtml } from '@/lib/compliance/optOut'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(_request: NextRequest) {
  const supabase = createAdminClient()

  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

  // Never email opted_out leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .eq('status', 'contacted')
    .eq('opted_out', false)
    .not('email', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!leads || leads.length === 0) return NextResponse.json({ message: 'No leads to follow up', count: 0 })

  const results: { id: string; success: boolean; error?: string }[] = []

  for (const lead of leads as Lead[]) {
    try {
      const { data: convos } = await supabase
        .from('conversations')
        .select('direction, channel, sent_at')
        .eq('lead_id', lead.id)
        .order('sent_at', { ascending: false })

      const hasReply = convos?.some(c => c.direction === 'inbound')
      const hasEmail = convos?.some(c => c.channel === 'email' && c.direction === 'outbound')
      const lastOutbound = convos?.find(c => c.direction === 'outbound')
      const contactedAt = lastOutbound ? new Date(lastOutbound.sent_at) : null

      if (hasReply || hasEmail) continue
      if (contactedAt && contactedAt > new Date(fourHoursAgo)) continue

      const vehicle = lead.vehicle_interest ?? 'your vehicle of interest'
      const { subject, html, text } = await generateFollowUpEmail(lead.first_name, vehicle, lead.id)

      await sendEmail({ to: lead.email!, subject, html, text })

      await supabase.from('conversations').insert({
        lead_id: lead.id,
        channel: 'email',
        direction: 'outbound',
        message: text,
      })

      results.push({ id: lead.id, success: true })
    } catch (err: any) {
      console.error(`[email-followup] Failed for ${lead.id}:`, err.message)
      results.push({ id: lead.id, success: false, error: err.message })
    }
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
  })
}
