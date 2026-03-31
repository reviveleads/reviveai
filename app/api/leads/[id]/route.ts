import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()

  const [{ data: lead, error: leadError }, { data: conversations }, { data: appointments }, { data: sequences }] =
    await Promise.all([
      supabase.from('leads').select('*').eq('id', params.id).single(),
      supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', params.id)
        .order('sent_at', { ascending: true }),
      supabase
        .from('appointments')
        .select('*')
        .eq('lead_id', params.id)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('campaign_sequences')
        .select('*')
        .eq('lead_id', params.id)
        .order('touch_number', { ascending: true }),
    ])

  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 404 })

  return NextResponse.json({ lead, conversations: conversations ?? [], appointments: appointments ?? [], sequences: sequences ?? [] })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()
  const body = await request.json()

  const allowed = ['first_name', 'last_name', 'phone', 'email', 'vehicle_interest',
    'last_contact_date', 'lead_source', 'status', 'notes', 'sequence_paused', 'ai_paused']
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
