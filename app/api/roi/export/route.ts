import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function fmt(n: number) {
  return n.toLocaleString('en-US')
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US')
}

export async function GET() {
  const supabase = createAdminClient()
  const monthStart = startOfMonth()
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  const [settingsRes, inboundRes, apptRes] = await Promise.all([
    supabase
      .from('dealership_settings')
      .select('avg_deal_value, avg_lead_cost, monthly_plan_cost, dealership_name, salesperson_name')
      .eq('dealership_id', DEMO_DEALERSHIP_ID)
      .single(),
    supabase
      .from('conversations')
      .select('lead_id')
      .eq('direction', 'inbound')
      .gte('sent_at', monthStart),
    supabase
      .from('appointments')
      .select('id')
      .gte('created_at', monthStart),
  ])

  const settings = settingsRes.data ?? {}
  const avgDealValue = (settings as any).avg_deal_value ?? 2500
  const avgLeadCost = (settings as any).avg_lead_cost ?? 400
  const monthlyPlanCost = (settings as any).monthly_plan_cost ?? 1500
  const dealershipName = (settings as any).dealership_name || 'Your Dealership'

  const reactivated = new Set((inboundRes.data ?? []).map((r: any) => r.lead_id)).size
  const appointments = (apptRes.data ?? []).length
  const revenue = appointments * avgDealValue
  const investment = reactivated * avgLeadCost
  const roiMultiple = monthlyPlanCost > 0 ? (revenue / monthlyPlanCost).toFixed(1) : '—'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ReviveAI ROI Report — ${monthName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: white; padding: 48px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 700; color: #111827; }
  h2 { font-size: 16px; font-weight: 600; color: #374151; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
  .subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
  .stat { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
  .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; }
  .stat-value { font-size: 28px; font-weight: 700; color: #111827; margin-top: 6px; }
  .stat-sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }
  .highlight { background: #eff6ff; border-color: #bfdbfe; }
  .highlight .stat-value { color: #1d4ed8; }
  .footer { margin-top: 48px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  @media print {
    body { padding: 24px; }
    @page { margin: 0.5in; }
  }
</style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <h1>${dealershipName}</h1>
      <p class="subtitle">ReviveAI ROI Report — ${monthName}</p>
    </div>
    <div style="text-align:right;font-size:12px;color:#9ca3af;">Generated ${new Date().toLocaleDateString()}</div>
  </div>

  <h2>Monthly Results</h2>
  <div class="grid">
    <div class="stat">
      <div class="stat-label">Leads Reactivated</div>
      <div class="stat-value">${fmt(reactivated)}</div>
      <div class="stat-sub">responded this month</div>
    </div>
    <div class="stat">
      <div class="stat-label">Appointments Booked</div>
      <div class="stat-value">${fmt(appointments)}</div>
      <div class="stat-sub">in showroom</div>
    </div>
    <div class="stat highlight">
      <div class="stat-label">Estimated Revenue</div>
      <div class="stat-value">${fmtMoney(revenue)}</div>
      <div class="stat-sub">${fmt(appointments)} appts × ${fmtMoney(avgDealValue)}/deal</div>
    </div>
  </div>

  <div class="grid" style="margin-top:12px;">
    <div class="stat">
      <div class="stat-label">Lead Investment</div>
      <div class="stat-value">${fmtMoney(investment)}</div>
      <div class="stat-sub">${fmt(reactivated)} leads × ${fmtMoney(avgLeadCost)} avg cost</div>
    </div>
    <div class="stat">
      <div class="stat-label">Monthly Plan Cost</div>
      <div class="stat-value">${fmtMoney(monthlyPlanCost)}</div>
      <div class="stat-sub">ReviveAI subscription</div>
    </div>
    <div class="stat highlight">
      <div class="stat-label">ROI Multiple</div>
      <div class="stat-value">${roiMultiple}×</div>
      <div class="stat-sub">revenue vs plan cost</div>
    </div>
  </div>

  <div class="footer">
    <p>ReviveAI — Dead Lead Reactivation Platform</p>
    <p style="margin-top:4px;">Estimates based on configured average deal gross of ${fmtMoney(avgDealValue)} and lead cost of ${fmtMoney(avgLeadCost)}.</p>
  </div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
