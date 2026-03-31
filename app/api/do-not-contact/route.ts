import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('do_not_contact')
    .select('*')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()

  // Batch insert (array) or single entry
  const entries: { phone?: string; email?: string; reason?: string }[] =
    Array.isArray(body) ? body : [body]

  const valid = entries
    .filter(e => e.phone?.trim() || e.email?.trim())
    .map(e => ({
      dealership_id: DEMO_DEALERSHIP_ID,
      phone: e.phone?.trim() || null,
      email: e.email?.trim().toLowerCase() || null,
      reason: e.reason?.trim() || null,
    }))

  if (valid.length === 0) {
    return NextResponse.json({ error: 'At least one phone or email required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('do_not_contact')
    .insert(valid)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ count: data?.length ?? 0, entries: data })
}
