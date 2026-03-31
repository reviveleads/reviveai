import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('campaign_sequences')
    .select('lead_id')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .eq('status', 'pending')

  const sequences_active = new Set((data ?? []).map((r: { lead_id: string }) => r.lead_id)).size

  return NextResponse.json({ sequences_active })
}
