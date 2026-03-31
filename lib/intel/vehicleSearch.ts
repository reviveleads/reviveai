import Anthropic from '@anthropic-ai/sdk'
import { IncentiveType, Lead, LeadIntent } from '@/types'
import { classifyIntent, extractBrand, extractVehicleCategory } from './intentClassifier'
import {
  getSeasonalContext,
  estimateCurrentMileage,
  checkMilestoneCrossed,
  monthsSince,
} from './seasonalContext'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface BraveResult {
  title: string
  url: string
  description: string
}

interface BraveSearchResponse {
  web?: { results: BraveResult[] }
}

export interface FetchedVehicleIntel {
  make: string | null
  model: string | null
  year: number | null
  summary: string
  source_url: string | null
  intel_type: 'incentive' | 'news' | 'general'
  incentive_type: IncentiveType
  incentive_amount: number | null
  incentive_expiry: string | null
  region: string | null
}

export function parseVehicleInterest(vehicleInterest: string): {
  year: number | null
  make: string | null
  model: string | null
} {
  const yearMatch = vehicleInterest.match(/\b(19|20)\d{2}\b/)
  const year = yearMatch ? parseInt(yearMatch[0]) : null
  const withoutYear = vehicleInterest.replace(/\b(19|20)\d{2}\b/, '').trim()
  const parts = withoutYear.split(/\s+/)
  return { year, make: parts[0] || null, model: parts.slice(1).join(' ') || null }
}

async function braveSearch(query: string): Promise<BraveResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) return []

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&freshness=pm`
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const data = await res.json() as BraveSearchResponse
    return data.web?.results ?? []
  } catch {
    return []
  }
}

export async function fetchVehicleIntel(vehicleInterest: string): Promise<FetchedVehicleIntel | null> {
  const { year, make, model } = parseVehicleInterest(vehicleInterest)
  const currentYear = new Date().getFullYear()

  const [incentiveResults, newsResults] = await Promise.all([
    braveSearch(`${vehicleInterest} manufacturer incentives cash back lease APR ${currentYear}`),
    braveSearch(`${vehicleInterest} news updates new model year ${currentYear}`),
  ])

  const allResults = [...incentiveResults.slice(0, 3), ...newsResults.slice(0, 2)]
  if (allResults.length === 0) return null

  const snippets = allResults.slice(0, 4)
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.description}`)
    .join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Briefing for a car salesperson on the ${vehicleInterest}.\n\nSearch results:\n${snippets}\n\nReply in JSON only (no markdown):\n{\n  "summary": "2-3 sentences. Factual, conversational. Focus on current incentives or notable news.",\n  "incentive_type": "cash_back | apr_deal | lease_special | loyalty | supplier | regional | general",\n  "incentive_amount": 1500,\n  "incentive_expiry": "2025-03-31 or null"\n}`,
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    const parsed = JSON.parse(raw.trim())
    return {
      make, model, year,
      summary: parsed.summary ?? '',
      source_url: allResults[0]?.url ?? null,
      intel_type: incentiveResults.length > 0 ? 'incentive' : 'news',
      incentive_type: parsed.incentive_type ?? 'general',
      incentive_amount: typeof parsed.incentive_amount === 'number' ? parsed.incentive_amount : null,
      incentive_expiry: parsed.incentive_expiry ?? null,
      region: null,
    }
  } catch {
    return null
  }
}

export async function getOrRefreshVehicleIntel(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>,
  vehicleInterest: string,
  dealershipId: string = '00000000-0000-0000-0000-000000000001'
): Promise<string | null> {
  const { make, model } = parseVehicleInterest(vehicleInterest)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('vehicle_intel')
    .select('summary')
    .eq('dealership_id', dealershipId)
    .eq('is_active', true)
    .gte('fetched_at', cutoff)
    .order('fetched_at', { ascending: false })
    .limit(1)

  if (make) query = query.ilike('make', make)
  if (model) query = query.ilike('model', `%${model.split(' ')[0]}%`)

  const { data: cached } = await query
  if (cached?.length) return cached[0].summary

  const intel = await fetchVehicleIntel(vehicleInterest)
  if (!intel) return null

  const { make: pm, model: pmod, year } = parseVehicleInterest(vehicleInterest)
  await supabase.from('vehicle_intel').insert({
    dealership_id: dealershipId,
    make: pm, model: pmod, year,
    intel_type: intel.intel_type,
    incentive_type: intel.incentive_type,
    incentive_amount: intel.incentive_amount,
    incentive_expiry: intel.incentive_expiry,
    summary: intel.summary,
    source_url: intel.source_url,
    region: intel.region,
    source: intel.source_url ? (() => { try { return new URL(intel.source_url!).hostname } catch { return null } })() : null,
    is_active: true,
    fetched_at: new Date().toISOString(),
  })

  return intel.summary
}

// ─── Full AI context builder ──────────────────────────────────────────────────

export interface AIMessageContext {
  intent: LeadIntent
  contextBlock: string   // Ready-to-inject string for the AI prompt
  newsArticle: { headline: string; url: string } | null
}

export async function buildAIContext(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>,
  lead: Pick<Lead,
    'first_name' | 'vehicle_interest' | 'trade_in_make' | 'trade_in_model' |
    'trade_in_year' | 'trade_in_mileage' | 'budget_notes' | 'created_at' |
    'lead_intent'
  >,
  dealershipId: string,
  salespersonName: string,
): Promise<AIMessageContext> {
  const vehicle = lead.vehicle_interest ?? ''
  const intent = lead.lead_intent ?? classifyIntent(vehicle || 'general vehicle')

  const lines: string[] = [
    `Salesperson: ${salespersonName}`,
    `Customer: ${lead.first_name}`,
    `Vehicle of interest: ${vehicle || 'unspecified'}`,
    `Lead type: ${intent === 'model_loyal' ? 'Model-loyal (interested in a specific vehicle)' : 'Budget-driven (price/value focused)'}`,
  ]

  // ── Timing context ──
  if (lead.created_at) {
    const months = monthsSince(lead.created_at)
    if (months > 0) lines.push(`Time since inquiry: ${months} month${months !== 1 ? 's' : ''}`)
  }

  // ── Trade-in + mileage ──
  if (lead.trade_in_make && lead.trade_in_model) {
    const tradeLabel = [lead.trade_in_year, lead.trade_in_make, lead.trade_in_model].filter(Boolean).join(' ')
    lines.push(`Trade-in: ${tradeLabel}`)
    if (lead.trade_in_mileage && lead.created_at) {
      const estimated = estimateCurrentMileage(lead.trade_in_mileage, lead.created_at)
      const milestone = checkMilestoneCrossed(lead.trade_in_mileage, estimated)
      lines.push(`Estimated current mileage on trade: ~${estimated.toLocaleString()} miles`)
      if (milestone) lines.push(`STRONG SIGNAL: trade just crossed ${milestone.toLocaleString()} miles — great time to bring up upgrading`)
    }
  }

  // ── Budget notes ──
  if (lead.budget_notes) lines.push(`Budget/payment notes: ${lead.budget_notes}`)

  let newsArticle: { headline: string; url: string } | null = null
  let hookInjected = false

  if (intent === 'model_loyal' && vehicle) {
    // ── Dealer incentives matching this vehicle (Hook 1 — highest priority) ──
    const brand = extractBrand(vehicle)
    const vehicleWords = vehicle.toLowerCase().split(/\s+/)

    const { data: incentives } = await supabase
      .from('dealer_incentives')
      .select('vehicle_model, deal_description, expires_at, deal_scope')
      .eq('dealership_id', dealershipId)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString().split('T')[0]}`)

    const isUsed = /\bused\b|\bcpo\b|\bcertified\b/i.test(vehicle)
    const matchingIncentives = (incentives ?? []).filter(inc => {
      const scope = inc.deal_scope ?? 'specific'
      if (scope === 'all_new') return !isUsed
      if (scope === 'all_used') return isUsed
      // scope === 'specific'
      if (!inc.vehicle_model) return true // blank vehicle_model = all leads fallback
      const lower = inc.vehicle_model.toLowerCase()
      return vehicleWords.some(w => w.length > 3 && lower.includes(w))
        || (brand && lower.includes(brand.toLowerCase()))
    })

    if (matchingIncentives.length > 0) {
      const inc = matchingIncentives[0]
      const expiry = inc.expires_at ? ` (expires ${inc.expires_at})` : ''
      const label = inc.vehicle_model ? inc.vehicle_model : (inc.deal_scope === 'all_used' ? 'used vehicles' : 'new vehicles')
      lines.push(`Active deal on ${label}: ${inc.deal_description}${expiry}`)
      hookInjected = true
    }

    // ── Pre-fetch all news candidate articles in parallel ──
    let dealArt: { headline: string; url: string; article_type: string } | null = null
    let newModelArt: { headline: string; url: string; article_type: string } | null = null
    let newsArt: { headline: string; url: string; article_type: string } | null = null

    if (brand) {
      const now = Date.now()
      const d14 = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString()
      const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
      const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [r1, r2, r3] = await Promise.all([
        supabase
          .from('vehicle_news')
          .select('headline, url, article_type')
          .eq('dealership_id', dealershipId)
          .eq('brand', brand)
          .eq('article_type', 'deal')
          .gte('published_at', d14)
          .order('published_at', { ascending: false })
          .limit(1),
        supabase
          .from('vehicle_news')
          .select('headline, url, article_type')
          .eq('dealership_id', dealershipId)
          .eq('brand', brand)
          .eq('article_type', 'new_model')
          .gte('published_at', d30)
          .order('published_at', { ascending: false })
          .limit(1),
        supabase
          .from('vehicle_news')
          .select('headline, url, article_type')
          .eq('dealership_id', dealershipId)
          .eq('brand', brand)
          .eq('article_type', 'news')
          .gte('published_at', d7)
          .order('published_at', { ascending: false })
          .limit(1),
      ])

      dealArt = r1.data?.[0] ?? null
      newModelArt = r2.data?.[0] ?? null
      newsArt = r3.data?.[0] ?? null
    }

    // Hook 2: deal article (14d)
    if (!hookInjected && dealArt) {
      const cleanUrl = dealArt.url.replace(/#_b=[^&]*/, '')
      newsArticle = { headline: dealArt.headline, url: cleanUrl }
      lines.push(`Recent ${extractBrand(vehicle) ?? vehicle} deal: "${dealArt.headline}"`)
      lines.push(`Article URL: ${cleanUrl}`)
      lines.push(`If mentioning this, include the URL naturally — "saw this and thought of you" energy, not "I'm forwarding you a link"`)
      hookInjected = true
    }

    // Hook 3: seasonal event
    const seasonal = getSeasonalContext()
    if (!hookInjected && seasonal.context !== 'standard') {
      lines.push(`Current sales event: ${seasonal.label}`)
      hookInjected = true
    }

    // Hook 4: new_model article (30d)
    if (!hookInjected && newModelArt) {
      const cleanUrl = newModelArt.url.replace(/#_b=[^&]*/, '')
      newsArticle = { headline: newModelArt.headline, url: cleanUrl }
      lines.push(`Recent ${extractBrand(vehicle) ?? vehicle} news: "${newModelArt.headline}"`)
      lines.push(`Article URL: ${cleanUrl}`)
      lines.push(`If mentioning this, include the URL naturally — "saw this and thought of you" energy, not "I'm forwarding you a link"`)
      hookInjected = true
    }

    // Hook 5: regular news (7d)
    if (!hookInjected && newsArt) {
      const cleanUrl = newsArt.url.replace(/#_b=[^&]*/, '')
      newsArticle = { headline: newsArt.headline, url: cleanUrl }
      lines.push(`Recent ${extractBrand(vehicle) ?? vehicle} news: "${newsArt.headline}"`)
      lines.push(`Article URL: ${cleanUrl}`)
      lines.push(`If mentioning this, include the URL naturally — "saw this and thought of you" energy, not "I'm forwarding you a link"`)
      hookInjected = true
    }

    // No hook available
    if (!hookInjected) {
      lines.push(`No current hook — keep this message genuine and human without fabricating context`)
    }

    // ── Brave Search vehicle intel (supplementary context, only when hook exists) ──
    if (hookInjected && process.env.BRAVE_SEARCH_API_KEY) {
      try {
        const intel = await getOrRefreshVehicleIntel(supabase, vehicle, dealershipId)
        if (intel) lines.push(`Additional market context: ${intel}`)
      } catch { /* non-blocking */ }
    }

  } else {
    // ── Seasonal context ──
    const seasonal = getSeasonalContext()
    if (seasonal.context !== 'standard') lines.push(`Current sales event: ${seasonal.label}`)

    // ── Budget-driven: check inventory for matching vehicles ──
    const category = extractVehicleCategory(vehicle)

    const { data: inventory } = await supabase
      .from('dealer_inventory')
      .select('year, make, model, trim, price, condition')
      .eq('dealership_id', dealershipId)
      .eq('is_available', true)
      .eq('category', category === 'general' ? 'suv' : category)
      .order('price', { ascending: true })
      .limit(3)

    if (inventory?.length) {
      const items = inventory.map(i =>
        `${i.condition} ${i.year} ${i.make} ${i.model}${i.trim ? ` ${i.trim}` : ''}${i.price ? ` — $${i.price.toLocaleString()}` : ''}`
      ).join('; ')
      lines.push(`Matching inventory on the lot: ${items}`)
      lines.push(`If mentioning inventory, keep it casual — "we actually have one that might fit" not a sales pitch`)
    } else {
      lines.push(`No exact inventory match — focus on their situation: timing, mileage, financing options`)
    }

    // ── Dealer incentives for budget-driven (any active deal) ──
    const { data: financeDeals } = await supabase
      .from('dealer_incentives')
      .select('vehicle_model, deal_description, expires_at, deal_scope')
      .eq('dealership_id', dealershipId)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString().split('T')[0]}`)
      .limit(3)

    if (financeDeals?.length) {
      // Prefer APR/financing deals; fall back to first active deal
      const preferred = financeDeals.find(d => /apr|financ|rate|0%/i.test(d.deal_description)) ?? financeDeals[0]
      lines.push(`Financing/deal available: ${preferred.deal_description}`)
    }
  }

  return {
    intent,
    contextBlock: lines.join('\n'),
    newsArticle,
  }
}
