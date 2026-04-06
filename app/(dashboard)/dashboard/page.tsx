import { createAdminClient } from '@/lib/supabase/server'
import LeadsDashboard from '@/components/leads/LeadsDashboard'
import { Lead, LeadStats, LeadSequenceSummary } from '@/types'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'
const ABANDONED_DAYS = 30

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

    // ── Auto-mark abandoned leads ─────────────────────────────────────
    // A lead is abandoned if it is pending or contacted and has had no
    // outbound conversation in the last 30 days (or was never contacted
    // and was created 30+ days ago).
    const eligibleIds = allLeads
      .filter(l => (l.status === 'pending' || l.status === 'contacted') && !l.opted_out)
      .map(l => l.id)

    if (eligibleIds.length > 0) {
      const cutoff = new Date(Date.now() - ABANDONED_DAYS * 24 * 60 * 60 * 1000).toISOString()

      // Get the most recent outbound message timestamp per lead
      const { data: recentOutbound } = await supabase
        .from('conversations')
        .select('lead_id, sent_at')
        .in('lead_id', eligibleIds)
        .eq('direction', 'outbound')
        .gt('sent_at', cutoff)

      // Build a set of leads that have had recent outbound activity
      const recentlyContacted = new Set(recentOutbound?.map(r => r.lead_id) ?? [])

      const toAbandon = allLeads.filter(l => {
        if (l.status !== 'pending' && l.status !== 'contacted') return false
        if (l.opted_out) return false
        if (recentlyContacted.has(l.id)) return false
        // No recent outbound — check if the lead itself is old enough
        const ref = l.last_contact_date ?? l.created_at
        const daysSince = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24)
        return daysSince >= ABANDONED_DAYS
      })

      if (toAbandon.length > 0) {
        const abandonIds = toAbandon.map(l => l.id)
        await supabase
          .from('leads')
          .update({ status: 'abandoned' })
          .in('id', abandonIds)

        // Reflect new status in the local array so stats are correct
        for (const lead of allLeads) {
          if (abandonIds.includes(lead.id)) lead.status = 'abandoned'
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────

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
    abandoned: allLeads.filter(l => l.status === 'abandoned').length,
    contacted: allLeads.filter(l => l.status === 'contacted').length,
    responded: allLeads.filter(l => l.status === 'responded').length,
    appointed: allLeads.filter(l => l.status === 'appointed').length,
    dead: allLeads.filter(l => l.status === 'dead').length,
    opted_out: allLeads.filter(l => l.opted_out === true).length,
    sequences_active: sequencesActive,
  }

  return <LeadsDashboard initialLeads={allLeads} stats={stats} initialSequenceMap={sequenceMap} />
}
