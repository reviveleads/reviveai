import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function weeksAgo(n: number) {
  return new Date(Date.now() - n * 7 * 24 * 60 * 60 * 1000).toISOString()
}

function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  // Sunday-aligned week bucket: get Monday of that week
  const day = d.getUTCDay()
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7))
  return monday.toISOString().split('T')[0]
}

export async function GET() {
  const supabase = createAdminClient()
  const monthStart = startOfMonth()
  const ninetyDaysAgo = weeksAgo(13) // 13 weeks ≈ 91 days

  const [settingsRes, inboundThisMonthRes, appointmentsThisMonthRes, outboundRes, inboundRes, apptRes] =
    await Promise.all([
      // Settings
      supabase
        .from('dealership_settings')
        .select('avg_deal_value, avg_lead_cost, monthly_plan_cost, dealership_name')
        .eq('dealership_id', DEMO_DEALERSHIP_ID)
        .single(),

      // Inbound conversations this month (reactivations)
      supabase
        .from('conversations')
        .select('lead_id, sent_at')
        .eq('direction', 'inbound')
        .gte('sent_at', monthStart)
        .order('sent_at', { ascending: true }),

      // Appointments this month
      supabase
        .from('appointments')
        .select('id, lead_id, created_at')
        .gte('created_at', monthStart),

      // All outbound in last 90 days (for chart: distinct lead per week)
      supabase
        .from('conversations')
        .select('lead_id, sent_at')
        .eq('direction', 'outbound')
        .gte('sent_at', ninetyDaysAgo)
        .order('sent_at', { ascending: true }),

      // All inbound in last 90 days (for chart)
      supabase
        .from('conversations')
        .select('lead_id, sent_at')
        .eq('direction', 'inbound')
        .gte('sent_at', ninetyDaysAgo)
        .order('sent_at', { ascending: true }),

      // All appointments in last 90 days (for chart)
      supabase
        .from('appointments')
        .select('id, lead_id, created_at')
        .gte('created_at', ninetyDaysAgo),
    ])

  const settings = settingsRes.data ?? {}
  const avgDealValue = (settings as any).avg_deal_value ?? 2500
  const avgLeadCost = (settings as any).avg_lead_cost ?? 400
  const monthlyPlanCost = (settings as any).monthly_plan_cost ?? 1500

  // ── Stats ──────────────────────────────────────────────────────────────────
  const inboundLeadIds = new Set((inboundThisMonthRes.data ?? []).map(r => r.lead_id))
  const reactivatedCount = inboundLeadIds.size
  const appointmentsCount = (appointmentsThisMonthRes.data ?? []).length

  const estimatedRevenue = appointmentsCount * avgDealValue
  const leadInvestment = reactivatedCount * avgLeadCost
  const roiMultiple = monthlyPlanCost > 0 ? +(estimatedRevenue / monthlyPlanCost).toFixed(1) : 0

  // ── Timeline — 13 weekly buckets ────────────────────────────────────────────
  const weeks = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(Date.now() - (12 - i) * 7 * 24 * 60 * 60 * 1000)
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)) // align to Monday
    return d.toISOString().split('T')[0]
  })

  const weekMap: Record<string, { contacted: Set<string>; responded: Set<string>; appointed: Set<string> }> = {}
  for (const w of weeks) weekMap[w] = { contacted: new Set(), responded: new Set(), appointed: new Set() }

  for (const row of outboundRes.data ?? []) {
    const key = isoWeekKey(row.sent_at)
    if (weekMap[key]) weekMap[key].contacted.add(row.lead_id)
  }
  for (const row of inboundRes.data ?? []) {
    const key = isoWeekKey(row.sent_at)
    if (weekMap[key]) weekMap[key].responded.add(row.lead_id)
  }
  for (const row of apptRes.data ?? []) {
    const key = isoWeekKey(row.created_at)
    if (weekMap[key]) weekMap[key].appointed.add(row.lead_id)
  }

  const timeline = weeks.map(w => ({
    week: w,
    contacted: weekMap[w].contacted.size,
    responded: weekMap[w].responded.size,
    appointed: weekMap[w].appointed.size,
  }))

  // ── Reactivated leads table ─────────────────────────────────────────────────
  let reactivatedLeads: any[] = []
  if (inboundLeadIds.size > 0) {
    const { data: leads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, vehicle_interest, status')
      .in('id', Array.from(inboundLeadIds))
      .not('status', 'in', '("dead","opted_out")')

    const firstInbound: Record<string, string> = {}
    for (const row of inboundThisMonthRes.data ?? []) {
      if (!firstInbound[row.lead_id]) firstInbound[row.lead_id] = row.sent_at
    }

    reactivatedLeads = (leads ?? []).map(lead => ({
      id: lead.id,
      name: `${lead.first_name} ${lead.last_name}`,
      vehicle: lead.vehicle_interest,
      status: lead.status,
      reactivated_at: firstInbound[lead.id] ?? null,
    }))
  }

  return NextResponse.json({
    settings: { avg_deal_value: avgDealValue, avg_lead_cost: avgLeadCost, monthly_plan_cost: monthlyPlanCost },
    stats: {
      reactivated_this_month: reactivatedCount,
      appointments_this_month: appointmentsCount,
      estimated_revenue: estimatedRevenue,
      lead_investment: leadInvestment,
      roi_multiple: roiMultiple,
    },
    timeline,
    reactivated_leads: reactivatedLeads,
  })
}
