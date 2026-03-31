import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('dealer_incentives')
    .select('*')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  console.log('[incentives POST] body:', JSON.stringify(body))

  if (!body.deal_description?.trim()) {
    console.log('[incentives POST] rejected: missing deal_description')
    return NextResponse.json({ error: 'deal_description is required' }, { status: 400 })
  }

  const scope = body.deal_scope ?? 'specific'
  // vehicle_model is only meaningful for 'specific' scope.
  // Stored as null when scope is broad — requires vehicle_model column to be nullable.
  const vehicleModel = scope === 'specific'
    ? (body.vehicle_model?.trim() || '')
    : null

  const payload = {
    dealership_id: DEMO_DEALERSHIP_ID,
    vehicle_model: vehicleModel,
    deal_description: body.deal_description.trim(),
    expires_at: body.expires_at || null,
    deal_scope: scope,
  }
  console.log('[incentives POST] inserting:', JSON.stringify(payload))

  const { data, error } = await supabase
    .from('dealer_incentives')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[incentives POST] supabase error:', error.code, error.message, error.details, error.hint)
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 })
  }

  console.log('[incentives POST] inserted:', JSON.stringify(data))
  return NextResponse.json(data)
}
