import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LeadDetailPage from '@/components/leads/LeadDetailPage'
import { Lead, Conversation, Appointment } from '@/types'

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const [{ data: lead, error }, { data: conversations }, { data: appointments }] =
    await Promise.all([
      supabase.from('leads').select('*').eq('id', params.id).single(),
      supabase.from('conversations').select('*').eq('lead_id', params.id).order('sent_at', { ascending: true }),
      supabase.from('appointments').select('*').eq('lead_id', params.id).order('scheduled_at', { ascending: true }),
    ])

  if (error || !lead) notFound()

  return (
    <LeadDetailPage
      lead={lead as Lead}
      conversations={(conversations ?? []) as Conversation[]}
      appointments={(appointments ?? []) as Appointment[]}
    />
  )
}
