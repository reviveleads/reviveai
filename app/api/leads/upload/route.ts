import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CSVLeadRow } from '@/types'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const rows: CSVLeadRow[] = body.leads

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
    }

    // Validate required fields
    const invalid = rows.filter(r => !r.first_name || !r.last_name || !r.phone)
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `${invalid.length} rows are missing required fields (first_name, last_name, phone)` },
        { status: 400 }
      )
    }

    // Skip leads contacted less than 30 days ago — too fresh for reactivation
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const freshRows = rows.filter(r => r.last_contact_date && r.last_contact_date >= thirtyDaysAgo)
    const eligibleRows = rows.filter(r => !r.last_contact_date || r.last_contact_date < thirtyDaysAgo)

    if (eligibleRows.length === 0) {
      return NextResponse.json({
        error: `All ${rows.length} leads were skipped — last contact date is within the last 30 days. These leads are too recent for reactivation.`,
      }, { status: 400 })
    }

    const leadsToInsert = eligibleRows.map(row => ({
      dealership_id: DEMO_DEALERSHIP_ID,
      first_name: row.first_name.trim(),
      last_name: row.last_name.trim(),
      phone: row.phone.trim(),
      email: row.email?.trim() || null,
      vehicle_interest: row.vehicle_interest?.trim() || null,
      last_contact_date: row.last_contact_date?.trim() || null,
      lead_source: row.lead_source?.trim() || null,
      notes: row.notes?.trim() || null,
      trade_in_make: row.trade_in_make?.trim() || null,
      trade_in_model: row.trade_in_model?.trim() || null,
      trade_in_year: row.trade_in_year ? parseInt(row.trade_in_year) || null : null,
      trade_in_mileage: row.trade_in_mileage ? parseInt(row.trade_in_mileage) || null : null,
      budget_notes: row.budget_notes?.trim() || null,
      status: 'pending' as const,
    }))

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data?.length ?? 0,
      skipped_fresh: freshRows.length,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
