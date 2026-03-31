import { createAdminClient } from '@/lib/supabase/server'
import AppointmentsPageClient from '@/components/appointments/AppointmentsPageClient'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export type AppointmentRow = {
  id: string
  lead_id: string
  scheduled_at: string
  salesperson_notified: boolean
  notes: string | null
  created_at: string
  lead_first_name: string
  lead_last_name: string
  lead_phone: string
  lead_vehicle_interest: string | null
}

export default async function AppointmentsPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      lead_id,
      scheduled_at,
      salesperson_notified,
      notes,
      created_at,
      leads!inner (
        first_name,
        last_name,
        phone,
        vehicle_interest,
        dealership_id
      )
    `)
    .eq('leads.dealership_id', DEMO_DEALERSHIP_ID)
    .order('scheduled_at', { ascending: true })

  if (error) console.error('[appointments page]', error.message)

  const rows: AppointmentRow[] = (data ?? []).map((a: any) => ({
    id: a.id,
    lead_id: a.lead_id,
    scheduled_at: a.scheduled_at,
    salesperson_notified: a.salesperson_notified,
    notes: a.notes,
    created_at: a.created_at,
    lead_first_name: a.leads.first_name,
    lead_last_name: a.leads.last_name,
    lead_phone: a.leads.phone,
    lead_vehicle_interest: a.leads.vehicle_interest,
  }))

  return <AppointmentsPageClient rows={rows} />
}
