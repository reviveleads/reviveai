import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { extractBrand } from '@/lib/intel/intentClassifier'
import { findCompetitorLeads } from '@/lib/intel/articleClassifier'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')
  const articleType = searchParams.get('article_type') ?? 'news'
  if (!brand) return NextResponse.json({ error: 'brand required' }, { status: 400 })

  const supabase = createAdminClient()

  const [{ data: allLeads }, { data: settings }] = await Promise.all([
    supabase
      .from('leads')
      .select('id, first_name, last_name, vehicle_interest, phone, status, opted_out')
      .eq('dealership_id', DEMO_DEALERSHIP_ID)
      .not('vehicle_interest', 'is', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('dealership_settings')
      .select('salesperson_name')
      .eq('dealership_id', DEMO_DEALERSHIP_ID)
      .single(),
  ])

  const leads = allLeads ?? []
  const brandLower = brand.toLowerCase()

  // Same-brand leads: vehicle_interest contains brand name OR extractBrand maps to it
  const sameBrandLeads = leads.filter((lead) => {
    const vi = lead.vehicle_interest ?? ''
    if (vi.toLowerCase().includes(brandLower)) return true
    return extractBrand(vi) === brand
  })

  // Competitor leads: only for 'deal' articles
  let competitorLeads: Array<typeof leads[number] & { segment_name: string }> = []
  if (articleType === 'deal') {
    // Exclude leads already in sameBrandLeads
    const sameBrandIds = new Set(sameBrandLeads.map(l => l.id))
    const nonSameBrand = leads.filter(l => !sameBrandIds.has(l.id))
    const competitorMatches = findCompetitorLeads(brand, nonSameBrand)
    const matchMap = new Map(competitorMatches.map(m => [m.leadId, m.segmentName]))
    competitorLeads = nonSameBrand
      .filter(l => matchMap.has(l.id))
      .map(l => ({ ...l, segment_name: matchMap.get(l.id)! }))
  }

  return NextResponse.json({
    same_brand_leads: sameBrandLeads,
    competitor_leads: competitorLeads,
    salesperson_name: settings?.salesperson_name || 'Jake',
  })
}
