import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchVehicleIntel } from '@/lib/intel/vehicleSearch'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

// GET — return all cached intel for this dealership
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vehicle_intel')
    .select('*')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .order('fetched_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — refresh intel for all distinct vehicles in leads, or a specific vehicle
// Body: { vehicle?: string }  (if omitted, refreshes all distinct vehicles)
export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json().catch(() => ({}))

  let vehicles: string[] = []

  if (body.vehicle) {
    vehicles = [body.vehicle]
  } else {
    // Pull all distinct vehicle_interest values from leads
    const { data: leads, error } = await supabase
      .from('leads')
      .select('vehicle_interest')
      .eq('dealership_id', DEMO_DEALERSHIP_ID)
      .not('vehicle_interest', 'is', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const seen = new Set<string>()
    for (const row of leads ?? []) {
      if (row.vehicle_interest && !seen.has(row.vehicle_interest)) {
        seen.add(row.vehicle_interest)
        vehicles.push(row.vehicle_interest)
      }
    }
  }

  if (vehicles.length === 0) {
    return NextResponse.json({ message: 'No vehicles to refresh', refreshed: 0, failed: 0 })
  }

  const results: { vehicle: string; success: boolean; error?: string }[] = []

  for (const vehicle of vehicles) {
    try {
      const intel = await fetchVehicleIntel(vehicle)

      if (intel) {
        await supabase.from('vehicle_intel').insert({
          dealership_id: DEMO_DEALERSHIP_ID,
          make: intel.make,
          model: intel.model,
          year: intel.year,
          intel_type: intel.intel_type,
          summary: intel.summary,
          source_url: intel.source_url,
          fetched_at: new Date().toISOString(),
        })
      }

      results.push({ vehicle, success: true })
    } catch (err: any) {
      console.error(`[intel/refresh] Failed for "${vehicle}":`, err.message)
      results.push({ vehicle, success: false, error: err.message })
    }
  }

  // Clean up intel older than 7 days
  await supabase
    .from('vehicle_intel')
    .delete()
    .lt('fetched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  return NextResponse.json({
    refreshed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  })
}
