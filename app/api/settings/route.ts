import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createAdminClient()
  console.log('[settings GET] fetching dealership_id:', DEMO_DEALERSHIP_ID)

  const { data, error } = await supabase
    .from('dealership_settings')
    .select('*')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[settings GET] error:', error.code, error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[settings GET] returned columns:', data ? Object.keys(data) : 'no row')
  return NextResponse.json(data ?? { dealership_id: DEMO_DEALERSHIP_ID })
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  console.log('[settings POST] request body:', JSON.stringify(body, null, 2))

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
    avg_deal_value: Number(body.avg_deal_value) || 2500,
    avg_lead_cost: Number(body.avg_lead_cost) || 400,
    monthly_plan_cost: Number(body.monthly_plan_cost) || 1500,
  }

  console.log('[settings POST] upsert payload:', JSON.stringify(payload, null, 2))

  let { data, error } = await supabase
    .from('dealership_settings')
    .upsert(payload, { onConflict: 'dealership_id' })
    .select()
    .single()

  console.log('[settings POST] upsert result — data:', JSON.stringify(data), 'error:', JSON.stringify(error))

  // If business metrics columns don't exist yet (migration pending), retry without them
  if (error?.code === '42703') {
    console.warn('[settings POST] missing column error — retrying without business metrics. Run: supabase/add_business_metrics.sql')
    const { avg_deal_value, avg_lead_cost, monthly_plan_cost, ...basePayload } = payload as any
    void avg_deal_value; void avg_lead_cost; void monthly_plan_cost
    ;({ data, error } = await supabase
      .from('dealership_settings')
      .upsert(basePayload, { onConflict: 'dealership_id' })
      .select()
      .single())
    console.log('[settings POST] retry result — data:', JSON.stringify(data), 'error:', JSON.stringify(error))
  }

  if (error) {
    console.error('[settings POST] final error:', error.code, error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[settings POST] saved successfully, columns:', data ? Object.keys(data) : 'none')
  return NextResponse.json(data)
}
