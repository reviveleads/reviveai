import { createAdminClient } from '@/lib/supabase/server'

/**
 * Check if a phone or email is on the Do Not Contact list.
 * Returns true if the contact should be blocked.
 */
export async function isDoNotContact(
  dealershipId: string,
  phone: string | null,
  email: string | null,
): Promise<boolean> {
  if (!phone && !email) return false
  const supabase = createAdminClient()

  const filters: string[] = []
  if (phone) filters.push(`phone.eq.${phone}`)
  if (email) filters.push(`email.eq.${email}`)

  const { data } = await supabase
    .from('do_not_contact')
    .select('id')
    .eq('dealership_id', dealershipId)
    .or(filters.join(','))
    .limit(1)

  return (data ?? []).length > 0
}
