import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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

  const [
    { data: conversations },
    { data: appointments },
    { data: sequences },
  ] = await Promise.all([
    supabase.from('conversations').select('*').eq('lead_id', params.id).order('sent_at', { ascending: true }).then(r => ({ data: r.data ?? [] })).catch(() => ({ data: [] })),
    supabase.from('appointments').select('*').eq('lead_id', params.id).order('scheduled_at', { ascending: true }).then(r
