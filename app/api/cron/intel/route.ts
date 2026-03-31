import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchVehicleIntel, parseVehicleInterest } from '@/lib/intel/vehicleSearch'
import { estimateCurrentMileage, checkMilestoneCrossed } from '@/lib/intel/seasonalContext'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

// Simple secret check — set CRON_SECRET in .env.local to protect this endpoint
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // Not configured — open for dev
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const startedAt = Date.now()
  const log: string[] = []

  // ─── 1. Fetch distinct active vehicles ────────────────────────
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('vehicle_interest, trade_in_make, trade_in_model, trade_in_year, trade_in_mileage, mileage_milestone_triggered, created_at, id')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .not('vehicle_interest', 'is', null)
    .in('status', ['pending', 'contacted', 'responded'])

  if (leadsError) {
    return NextResponse.json({ error: leadsError.message }, { status: 500 })
  }

  // ─── 2. Refresh mileage milestones ────────────────────────────
  const milestoneUpdates: string[] = []
  for (const lead of leads ?? []) {
    if (lead.trade_in_mileage && lead.created_at && !lead.mileage_milestone_triggered) {
      const estimated = estimateCurrentMileage(lead.trade_in_mileage, lead.created_at)
      const crossed = checkMilestoneCrossed(lead.trade_in_mileage, estimated)
      if (crossed) {
        await supabase
          .from('leads')
          .update({ mileage_milestone_triggered: true })
          .eq('id', lead.id)
        milestoneUpdates.push(`Lead ${lead.id} crossed ${crossed.toLocaleString()} miles`)
      }
    }
  }
  if (milestoneUpdates.length > 0) log.push(`Milestone flags: ${milestoneUpdates.join('; ')}`)

  // ─── 3. Refresh vehicle intel ─────────────────────────────────
  const seen = new Set<string>()
  const vehicles: string[] = []
  for (const lead of leads ?? []) {
    if (lead.vehicle_interest && !seen.has(lead.vehicle_interest)) {
      seen.add(lead.vehicle_interest)
      vehicles.push(lead.vehicle_interest)
    }
  }

  log.push(`Refreshing intel for ${vehicles.length} distinct vehicle(s)`)

  const intelResults: { vehicle: string; success: boolean; error?: string }[] = []

  for (const vehicle of vehicles) {
    try {
      const intel = await fetchVehicleIntel(vehicle)

      if (intel) {
        const { year, make, model } = parseVehicleInterest(vehicle)

        await supabase.from('vehicle_intel').insert({
          dealership_id: DEMO_DEALERSHIP_ID,
          make,
          model,
          year,
          intel_type: intel.intel_type,
          incentive_type: intel.intel_type === 'incentive' ? 'cash_back' : 'general',
          summary: intel.summary,
          source_url: intel.source_url,
          region: null,
          source: intel.source_url ? new URL(intel.source_url).hostname : null,
          is_active: true,
          fetched_at: new Date().toISOString(),
        })
      }

      intelResults.push({ vehicle, success: true })
    } catch (err: any) {
      console.error(`[cron/intel] Failed for "${vehicle}":`, err.message)
      intelResults.push({ vehicle, success: false, error: err.message })
    }
  }

  // ─── 4. Expire stale intel (> 7 days old) ─────────────────────
  await supabase
    .from('vehicle_intel')
    .update({ is_active: false })
    .lt('fetched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .eq('is_active', true)

  // ─── 5. Delete very old intel (> 30 days) ─────────────────────
  await supabase
    .from('vehicle_intel')
    .delete()
    .lt('fetched_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const elapsed = Date.now() - startedAt

  return NextResponse.json({
    ok: true,
    elapsed_ms: elapsed,
    vehicles_refreshed: intelResults.filter(r => r.success).length,
    vehicles_failed: intelResults.filter(r => !r.success).length,
    milestone_flags: milestoneUpdates.length,
    log,
    results: intelResults,
  })
}

// GET — returns cron status (last run, counts)
export async function GET() {
  const supabase = createAdminClient()

  const { data: latest } = await supabase
    .from('vehicle_intel')
    .select('fetched_at')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .order('fetched_at', { ascending: false })
    .limit(1)

  const { count: activeCount } = await supabase
    .from('vehicle_intel')
    .select('*', { count: 'exact', head: true })
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .eq('is_active', true)

  const { count: milestoneCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .eq('mileage_milestone_triggered', true)

  return NextResponse.json({
    last_run: latest?.[0]?.fetched_at ?? null,
    active_intel_count: activeCount ?? 0,
    mileage_milestone_leads: milestoneCount ?? 0,
  })
}
