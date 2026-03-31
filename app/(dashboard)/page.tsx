import { createAdminClient } from '@/lib/supabase/server'
import LeadsDashboard from '@/components/leads/LeadsDashboard'
import { Lead, LeadStats, LeadSequenceSummary } from '@/types'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export default async function DashboardPage() {
  let allLeads: Lead[] = []
  let sequenceMap: Record<string, LeadSequenceSummary> = {}

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isConfigured = supabaseUrl && supabaseUrl.startsWith('http')

  if (isConfigured) {
    const supabase = createAdminClient()
    const [{ data, error }, { data: seqData }] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .eq('dealership_id', DEMO_DEALERSHIP_ID)
        .order('created_at', { ascending: false }),
      supabase
        .from('campaign_sequences')
        .select('lead_id, touch_number, scheduled_for, status, channel')
        .eq('dealership_id', DEMO_DEALERSHIP_ID)
        .neq('status', 'skipped'),
    ])

    if (error) console.error('[leads] fetch error:', error.message)
    allLeads = data ?? []

    // Build per-lead sequence summary map
    for (const seq of seqData ?? []) {
      if (!sequenceMap[seq.lead_id]) {
        sequenceMap[seq.lead_id] = {
          lead_id: seq.lead_id,
          touches_sent: 0,
          total_touches: 0,
          next_touch_number: null,
          next_touch_at: null,
          next_touch_channel: null,
        }
      }
      const summary = sequenceMap[seq.lead_id]
      summary.total_touches++
      if (seq.status === 'sent') summary.touches_sent++
      if (seq.status === 'pending') {
        if (!summary.next_touch_at || seq.scheduled_for < summary.next_touch_at) {
          summary.next_touch_at = seq.scheduled_for
          summary.next_touch_number = seq.touch_number
          summary.next_touch_channel = seq.channel
        }
      }
    }
  }

  const sequencesActive = Object.values(sequenceMap).filter(s => s.next_touch_at !== null).length

  const stats: LeadStats = {
    total: allLeads.length,
    pending: allLeads.filter(l => l.status === 'pending').length,
    contacted: allLeads.filter(l => l.status === 'contacted').length,
    responded: allLeads.filter(l => l.status === 'responded').length,
    appointed: allLeads.filter(l => l.status === 'appointed').length,
    dead: allLeads.filter(l => l.status === 'dead').length,
    opted_out: allLeads.filter(l => l.opted_out === true).length,
    sequences_active: sequencesActive,
  }

  return <LeadsDashboard initialLeads={allLeads} stats={stats} initialSequenceMap={sequenceMap} />
}
