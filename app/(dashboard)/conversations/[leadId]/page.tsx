import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ConversationThread from '@/components/conversations/ConversationThread'
import { Lead, Conversation } from '@/types'

export default async function ConversationThreadPage({
  params,
}: {
  params: { leadId: string }
}) {
  const supabase = createAdminClient()

  const [{ data: leadData }, { data: messages }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', params.leadId).single(),
    supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', params.leadId)
      .order('sent_at', { ascending: true }),
  ])

  if (!leadData) notFound()

  return (
    <ConversationThread
      lead={leadData as Lead}
      messages={(messages ?? []) as Conversation[]}
    />
  )
}
