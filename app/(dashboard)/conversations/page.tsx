import { createAdminClient } from '@/lib/supabase/server'
import ConversationsPageClient from '@/components/conversations/ConversationsPageClient'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export type ConversationRow = {
  id: string
  lead_id: string
  channel: 'sms' | 'email'
  direction: 'outbound' | 'inbound'
  message: string
  sent_at: string
  lead_first_name: string
  lead_last_name: string
  lead_phone: string
  lead_vehicle_interest: string | null
}

export default async function ConversationsPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      lead_id,
      channel,
      direction,
      message,
      sent_at,
      leads!inner (
        first_name,
        last_name,
        phone,
        vehicle_interest,
        dealership_id
      )
    `)
    .eq('leads.dealership_id', DEMO_DEALERSHIP_ID)
    .order('sent_at', { ascending: false })

  if (error) console.error('[conversations page]', error.message)

  const rows: ConversationRow[] = (data ?? []).map((c: any) => ({
    id: c.id,
    lead_id: c.lead_id,
    channel: c.channel,
    direction: c.direction,
    message: c.message,
    sent_at: c.sent_at,
    lead_first_name: c.leads.first_name,
    lead_last_name: c.leads.last_name,
    lead_phone: c.leads.phone,
    lead_vehicle_interest: c.leads.vehicle_interest,
  }))

  return <ConversationsPageClient rows={rows} />
}
