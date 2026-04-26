export type ArticleType = 'deal' | 'new_model' | 'news'

const DEAL_KEYWORDS = [
  'discount', 'lease', 'finance', ' apr ', 'incentive', 'rebate',
  ' deal', 'offer', 'savings', 'off msrp', 'per month', 'cash back', 'special',
]

const NEW_MODEL_KEYWORDS = [
  'revealed', 'debuts', 'unveiled', 'first look', 'new model',
  'next generation', 'next-generation', '2026', '2027',
]

const OLD_MODEL_YEAR_RE = /\b(19\d{2}|20[0-2]\d|2023)\b/

export function classifyArticle(headline: string, summary?: string | null): ArticleType {
  const text = ` ${(headline + ' ' + (summary ?? '')).toLowerCase()} `
  if (DEAL_KEYWORDS.some(k => text.includes(k))) return 'deal'
  if (NEW_MODEL_KEYWORDS.some(k => text.includes(k)) && !OLD_MODEL_YEAR_RE.test(text)) return 'new_model'
  return 'news'
}

// ── Competitor segment matching ───────────────────────────────────────────────

interface SegmentEntry {
  brand: string
  keywords: string[]
}

export interface VehicleSegment {
  name: string
  entries: SegmentEntry[]
}

export const VEHICLE_SEGMENTS: VehicleSegment[] = [
  {
    name: 'Luxury Sedans',
    entries: [
      { brand: 'Cadillac', keywords: ['ct5'] },
      { brand: 'BMW', keywords: ['5 series', '5-series', '540i', '530i'] },
      { brand: 'Mercedes', keywords: ['e-class', 'e class', 'e350', 'e450', 'e 350', 'e 450'] },
      { brand: 'Audi', keywords: ['a6'] },
      { brand: 'Lexus', keywords: ['lexus es', ' es 3', ' es 5'] },
    ],
  },
  {
    name: 'Luxury SUVs',
    entries: [
      { brand: 'Cadillac', keywords: ['xt6'] },
      { brand: 'BMW', keywords: ['x5', 'x7'] },
      { brand: 'Mercedes', keywords: ['gle', 'gls'] },
      { brand: 'Audi', keywords: ['q7', 'q8'] },
      { brand: 'Lexus', keywords: ['lexus rx', 'lexus gx', 'lexus lx'] },
      { brand: 'Lincoln', keywords: ['navigator', 'aviator'] },
    ],
  },
  {
    name: 'Full-Size Trucks',
    entries: [
      { brand: 'Chevy', keywords: ['silverado'] },
      { brand: 'GMC', keywords: ['sierra 1500', 'sierra'] },
      { brand: 'Ford', keywords: ['f-150', 'f150', 'f 150'] },
      { brand: 'RAM', keywords: ['ram 1500'] },
      { brand: 'Toyota', keywords: ['tundra'] },
      { brand: 'Nissan', keywords: ['titan'] },
    ],
  },
  {
    name: 'Mid-Size Trucks',
    entries: [
      { brand: 'Chevy', keywords: ['colorado'] },
      { brand: 'GMC', keywords: ['canyon'] },
      { brand: 'Ford', keywords: ['ranger'] },
      { brand: 'Toyota', keywords: ['tacoma'] },
      { brand: 'Nissan', keywords: ['frontier'] },
      { brand: 'Honda', keywords: ['ridgeline'] },
    ],
  },
  {
    name: 'Full-Size SUVs',
    entries: [
      { brand: 'Chevy', keywords: ['tahoe', 'suburban'] },
      { brand: 'GMC', keywords: ['yukon'] },
      { brand: 'Ford', keywords: ['expedition'] },
      { brand: 'Nissan', keywords: ['armada'] },
      { brand: 'Toyota', keywords: ['sequoia'] },
    ],
  },
  {
    name: 'Muscle / Sports',
    entries: [
      { brand: 'Chevy', keywords: ['camaro', 'corvette'] },
      { brand: 'Ford', keywords: ['mustang'] },
      { brand: 'Dodge', keywords: ['challenger', 'charger'] },
    ],
  },
]

export interface CompetitorMatch {
  leadId: string
  segmentName: string
}

export function findCompetitorLeads(
  articleBrand: string,
  leads: Array<{ id: string; vehicle_interest: string | null }>
): CompetitorMatch[] {
  const brandLower = articleBrand.toLowerCase()
  const relevantSegments = VEHICLE_SEGMENTS.filter(seg =>
    seg.entries.some(e => e.brand.toLowerCase() === brandLower)
  )
  if (relevantSegments.length === 0) return []

  const results: CompetitorMatch[] = []
  const seen = new Set<string>()

  for (const lead of leads) {
    if (seen.has(lead.id)) continue
    const vi = ` ${(lead.vehicle_interest ?? '').toLowerCase()} `
    for (const seg of relevantSegments) {
      for (const entry of seg.entries) {
        if (entry.brand.toLowerCase() === brandLower) continue
        if (entry.keywords.some(k => vi.includes(k))) {
          results.push({ leadId: lead.id, segmentName: seg.name })
          seen.add(lead.id)
          break
        }
      }
      if (seen.has(lead.id)) break
    }
  }

  return results
}
