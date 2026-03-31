const DEFAULT_TZ = 'America/New_York'

/**
 * Returns true if it is currently within allowed sending hours (9am–8pm)
 * in the given IANA timezone (defaults to Eastern).
 */
export function isWithinSendingHours(timezone: string = DEFAULT_TZ): boolean {
  const now = new Date()
  const hour = getHourInZone(now, timezone)
  return hour >= 9 && hour < 20
}

/**
 * Returns an ISO string for the next 9am in the given timezone.
 * Used to report when a held message will be sent.
 */
export function nextSendWindowISO(timezone: string = DEFAULT_TZ): string {
  const now = new Date()
  const hour = getHourInZone(now, timezone)

  // Clone and find next 9am
  const candidate = new Date(now)
  if (hour >= 20) {
    // After 8pm → next morning
    candidate.setDate(candidate.getDate() + 1)
  }
  // Set to 9am in the local zone (approximate — works for ET offsets)
  const offset = getUTCOffsetHours(candidate, timezone)
  candidate.setUTCHours(9 - offset, 0, 0, 0)

  return candidate.toISOString()
}

function getHourInZone(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date)
  const hourPart = parts.find(p => p.type === 'hour')
  return hourPart ? parseInt(hourPart.value, 10) : 12
}

function getUTCOffsetHours(date: Date, timezone: string): number {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit' })
  const tzStr = date.toLocaleString('en-US', { timeZone: timezone, hour12: false, hour: '2-digit' })
  return parseInt(utcStr) - parseInt(tzStr)
}
