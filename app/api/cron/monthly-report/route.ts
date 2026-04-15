import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend/email'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

function prevMonthRange(): { start: string; end: string; label: string } {
  const now = new Date()
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return {
    start: firstOfLastMonth.toISOString(),
    end: firstOfThisMonth.toISOString(),
    label: firstOfLastMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
  }
}

async function buildReportData(supabase: ReturnType<typeof createAdminClient>, range: { start: string; end: string }) {
  const [settingsRes, totalLeadsRes, inboundRes, apptRes, topConvsRes] = await Promise.all([
    supabase
      .from('dealership_settings')
      .select('dealership_name, salesperson_name, sales_manager_email, gm_email, avg_deal_value, avg_lead_cost, monthly_plan_cost')
      .eq('dealership_id', DEMO_DEALERSHIP_ID)
      .single(),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('dealership_id', DEMO_DEALERSHIP_ID),
    supabase
      .from('conversations')
      .select('lead_id')
      .eq('direction', 'inbound')
      .gte('sent_at', range.start)
      .lt('sent_at', range.end),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', range.start)
      .lt('created_at', range.end),
    // Top 3 responded leads with their message
    supabase
      .from('conversations')
      .select('lead_id, message')
      .eq('direction', 'inbound')
      .gte('sent_at', range.start)
      .lt('sent_at', range.end)
      .limit(3),
  ])

  const settings = settingsRes.data ?? {}
  const avgDealValue = (settings as any).avg_deal_value ?? 2500
  const monthlyPlanCost = (settings as any).monthly_plan_cost ?? 1500

  const respondedLeadIds = Array.from(new Set((inboundRes.data ?? []).map((r: any) => r.lead_id)))
  const reactivated = respondedLeadIds.length
  const appointments = apptRes.count ?? 0
  const estimatedRevenue = appointments * avgDealValue
  const roiMultiple = monthlyPlanCost > 0 ? (estimatedRevenue / monthlyPlanCost).toFixed(1) : '—'

  // Top 3 leads
  let topLeads: { name: string; vehicle: string | null; message: string }[] = []
  if (topConvsRes.data && topConvsRes.data.length > 0) {
    const topLeadIds = Array.from(new Set(topConvsRes.data.map((r: any) => r.lead_id))).slice(0, 3)
    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, first_name, last_name, vehicle_interest')
      .in('id', topLeadIds)
    const leadMap: Record<string, any> = {}
    for (const l of leadsData ?? []) leadMap[l.id] = l
    const msgMap: Record<string, string> = {}
    for (const c of topConvsRes.data) {
      if (!msgMap[c.lead_id]) msgMap[c.lead_id] = c.message
    }
    topLeads = topLeadIds.map(id => ({
      name: leadMap[id] ? `${leadMap[id].first_name} ${leadMap[id].last_name}` : 'Unknown',
      vehicle: leadMap[id]?.vehicle_interest ?? null,
      message: msgMap[id] ?? '',
    }))
  }

  return {
    dealershipName: (settings as any).dealership_name || 'Your Dealership',
    salespersonName: (settings as any).salesperson_name || 'there',
    reportEmail: ((settings as any).gm_email || (settings as any).sales_manager_email) as string | null,
    totalLeads: totalLeadsRes.count ?? 0,
    reactivated,
    appointments,
    estimatedRevenue,
    roiMultiple,
    topLeads,
  }
}

function buildEmailHtml(data: Awaited<ReturnType<typeof buildReportData>>, monthLabel: string, appUrl: string): string {
  const topLeadsHtml = data.topLeads.length > 0
    ? data.topLeads.map(l => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
          <strong style="color:#111827;">${l.name}</strong>
          ${l.vehicle ? `<span style="color:#6b7280;font-size:13px;"> — ${l.vehicle}</span>` : ''}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px;font-style:italic;">"${l.message.slice(0, 100)}${l.message.length > 100 ? '…' : ''}"</td>
      </tr>`).join('')
    : `<tr><td colspan="2" style="padding:12px;color:#9ca3af;text-align:center;">No responses yet this month</td></tr>`

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:white;">
    <!-- Header -->
    <div style="background:#0f1117;padding:32px 40px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="background:#2563eb;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:18px;font-weight:bold;">⚡</span>
        </div>
        <span style="color:white;font-size:16px;font-weight:600;">ReviveAI</span>
      </div>
      <h1 style="color:white;font-size:22px;font-weight:700;margin-top:20px;margin-bottom:4px;">Your Revive Results — ${monthLabel}</h1>
      <p style="color:#8b92a5;font-size:14px;margin:0;">${data.dealershipName}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="color:#374151;font-size:15px;margin-bottom:24px;">Hey ${data.salespersonName}, here's what ReviveAI did for you last month.</p>

      <!-- Stats grid -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td width="50%" style="padding:0 8px 12px 0;">
            <div style="background:#eff6ff;border-radius:12px;padding:20px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#3b82f6;font-weight:600;">Leads Reactivated</div>
              <div style="font-size:32px;font-weight:700;color:#1d4ed8;margin-top:6px;">${data.reactivated}</div>
            </div>
          </td>
          <td width="50%" style="padding:0 0 12px 8px;">
            <div style="background:#f0fdf4;border-radius:12px;padding:20px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#16a34a;font-weight:600;">Appointments Booked</div>
              <div style="font-size:32px;font-weight:700;color:#15803d;margin-top:6px;">${data.appointments}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:0 8px 0 0;">
            <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-weight:600;">Estimated Revenue</div>
              <div style="font-size:28px;font-weight:700;color:#111827;margin-top:6px;">$${data.estimatedRevenue.toLocaleString()}</div>
              <div style="font-size:12px;color:#9ca3af;margin-top:2px;">${data.appointments} appts × avg deal gross</div>
            </div>
          </td>
          <td width="50%" style="padding:0 0 0 8px;">
            <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-weight:600;">ROI Multiple</div>
              <div style="font-size:28px;font-weight:700;color:#111827;margin-top:6px;">${data.roiMultiple}×</div>
              <div style="font-size:12px;color:#9ca3af;margin-top:2px;">vs monthly plan cost</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Top leads -->
      <h2 style="font-size:14px;font-weight:600;color:#374151;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">Top Responses</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="text-align:left;padding:10px 12px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">Lead</th>
            <th style="text-align:left;padding:10px 12px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">What They Said</th>
          </tr>
        </thead>
        <tbody>${topLeadsHtml}</tbody>
      </table>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${appUrl}" style="display:inline-block;background:#2563eb;color:white;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">View Full Dashboard →</a>
      </div>

      <!-- Closer -->
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;text-align:center;">
        <p style="color:#92400e;font-size:14px;font-style:italic;margin:0;">"Your best month could be one follow-up away."</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">ReviveAI • Dead Lead Reactivation Platform</p>
      <p style="color:#9ca3af;font-size:11px;margin-top:4px;">Total leads in system: ${data.totalLeads}</p>
    </div>
  </div>
</body>
</html>`
}

export async function GET() {
  // Status check
  return NextResponse.json({ message: 'Monthly report cron — POST to trigger' })
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  const isTest = request.headers.get('x-test-report') === '1'

  if (!isTest && process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const range = prevMonthRange()
  const data = await buildReportData(supabase, range)

  if (!data.reportEmail) {
    return NextResponse.json({ error: 'No notification email configured in settings' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.reviveai.com'
  const html = buildEmailHtml(data, range.label, appUrl)

  await sendEmail({
    to: data.reportEmail,
    subject: `Your Revive Results — ${range.label}`,
    html,
    text: `ReviveAI Monthly Report — ${range.label}\n\nLeads reactivated: ${data.reactivated}\nAppointments booked: ${data.appointments}\nEstimated revenue: $${data.estimatedRevenue.toLocaleString()}\nROI: ${data.roiMultiple}×\n\nView your dashboard: ${appUrl}`,
  })

  return NextResponse.json({ sent: true, to: data.reportEmail, month: range.label })
}
