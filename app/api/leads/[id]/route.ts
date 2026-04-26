import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

async function safeQuery(promise: PromiseLike<{ data: any[] | null; error: any }>) {
  try {
    const { data } = await promise
    return data ?? []
  } catch {
    return []
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: leadError?.message ?? 'Lead not found' }, { status: 404 })
  }

  const [conversations, appointments, sequences] = await Promise.all([
    safeQuery(supabase.from('conversations').select('*').eq('lead_id', params.id).order('sent_at', { ascending: true })),
    safeQuery(supabase.from('appointments').select('*').eq('lead_id', params.id).order('scheduled_at', { ascending: true })),
    safeQuery(supabase.from('campaign_sequences').select('*').eq('lead_id', params.id).order('touch_number', { ascending: true })),
  ])

  return NextResponse.json({ lead, conversations, appointments, sequences })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()
  const body = await request.json()

  const allowed = [
    'first_name', 'last_name', 'business_name', 'phone', 'email', 'vehicle_interest',
    'last_contact_date', 'lead_source', 'status', 'notes', 'sequence_paused', 'ai_paused'
  ]

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
