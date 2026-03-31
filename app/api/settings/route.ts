import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('dealership_settings')
    .select('dealership_id, dealership_name, salesperson_name, salesperson_phone, salesperson_email, brands_we_sell, webhook_api_key, avg_deal_value, avg_lead_cost, monthly_plan_cost')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[settings GET] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? {
    dealership_id: DEMO_DEALERSHIP_ID,
    dealership_name: '',
    salesperson_name: '',
    salesperson_phone: '',
    salesperson_email: '',
    brands_we_sell: '',
  })
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  const payload: Record<string, unknown> = {
    dealership_id: DEMO_DEALERSHIP_ID,
    dealership_name: body.dealership_name ?? '',
    salesperson_name: body.salesperson_name ?? '',
    salesperson_phone: body.salesperson_phone ?? '',
    salesperson_email: body.salesperson_email ?? '',
    brands_we_sell: body.brands_we_sell ?? '',
  }
  if (body.avg_deal_value !== undefined) payload.avg_deal_value = Number(body.avg_deal_value) || 2500
  if (body.avg_lead_cost !== undefined) payload.avg_lead_cost = Number(body.avg_lead_cost) || 400
  if (body.monthly_plan_cost !== undefined) payload.monthly_plan_cost = Number(body.monthly_plan_cost) || 1500

  const { data, error } = await supabase
    .from('dealership_settings')
    .upsert(payload, { onConflict: 'dealership_id' })
    .select()
    .single()

  if (error) {
    console.error('[settings POST] error:', error.message, error.code)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
