export type LeadTier = 'hot' | 'warm' | 'cold'

/**
 * Classify lead tier based on how long they've been dead/inactive.
 * Uses last_contact_date if available, falls back to created_at.
 * Returns null if lead is too fresh (< 30 days) — should be skipped.
 */
export function classifyTier(
  lastContactDate: string | null,
  createdAt: string
): LeadTier | null {
  const ref = lastContactDate ?? createdAt
  const daysSince = Math.floor(
    (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSince < 30) return null   // Too fresh — CRM is probably still working them
  if (daysSince <= 90) return 'hot'  // 30–90 days
  if (daysSince <= 365) return 'warm' // 91 days–1 year
  return 'cold'                       // 1+ year
}

export const TIER_LABELS: Record<LeadTier, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
}

export const TIER_COLORS: Record<LeadTier, { bg: string; text: string; ring: string }> = {
  hot:  { bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-200'   },
  warm: { bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200' },
  cold: { bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200'  },
}
