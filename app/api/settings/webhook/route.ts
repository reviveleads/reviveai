import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

function generateKey(): string {
  return 'rva_' + crypto.randomBytes(24).toString('hex')
}

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('dealership_settings')
    .select('webhook_api_key')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ webhook_api_key: data?.webhook_api_key ?? null })
}

export async function POST() {
  const supabase = createAdminClient()
  const newKey = generateKey()

  const { data, error } = await supabase
    .from('dealership_settings')
    .upsert(
      { dealership_id: DEMO_DEALERSHIP_ID, webhook_api_key: newKey },
      { onConflict: 'dealership_id' }
    )
    .select('webhook_api_key')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ webhook_api_key: data.webhook_api_key })
}
