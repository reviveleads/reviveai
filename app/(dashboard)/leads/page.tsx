import { createAdminClient } from '@/lib/supabase/server'
import LeadsPageClient from '@/components/leads/LeadsPageClient'
import { Lead } from '@/types'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export default async function LeadsPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .order('created_at', { ascending: false })

  if (error) console.error('[leads page]', error.message)

  return <LeadsPageClient leads={(data ?? []) as Lead[]} />
}
