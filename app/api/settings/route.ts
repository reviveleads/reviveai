import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('dealership_settings')
    .select('*')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[settings GET] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? { dealership_id: DEMO_DEALERSHIP_ID })
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  const payload: Record<string, unknown> = {
    dealership_id: DEMO_DEALERSHIP_ID,
    dealership_name: body.dealership_name ?? '',
    salesperson_name: body.salesperson_name ?? '',
    salesperson_phone: body.salesperson_phone ?? '',
    brands_we_sell: body.brands_we_sell ?? '',
    // Keep salesperson_email in sync with sales_manager_email for legacy references
    salesperson_email: body.sales_manager_email || null,
    sales_manager_email: body.sales_manager_email || null,
    gm_email: body.gm_email || null,
    additional_emails: body.additional_emails || null,
    avg_deal_value: body.avg_deal_value !== undefined ? (Number(body.avg_deal_value) || 2500) : 2500,
    avg_lead_cost: body.avg_lead_cost !== undefined ? (Number(body.avg_lead_cost) || 400) : 400,
    monthly_plan_cost: body.monthly_plan_cost !== undefined ? (Number(body.monthly_plan_cost) || 1500) : 1500,
  }

  let { data, error } = await supabase
    .from('dealership_settings')
    .upsert(payload, { onConflict: 'dealership_id' })
    .select()
    .single()

  // If business metrics columns don't exist yet (migration pending), retry without them
  if (error?.code === '42703') {
    console.warn('[settings POST] column missing — retrying without business metrics:', error.message)
    const { avg_deal_value, avg_lead_cost, monthly_plan_cost, ...basePayload } = payload as any
    ;({ data, error } = await supabase
      .from('dealership_settings')
      .upsert(basePayload, { onConflict: 'dealership_id' })
      .select()
      .single())
  }

  if (error) {
    console.error('[settings POST] error:', error.message, error.code)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
