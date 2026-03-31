import { SeasonalContext } from '@/types'

interface SeasonalEvent {
  context: SeasonalContext
  label: string
  description: string
  month: number   // 1-12
  dayStart: number
  dayEnd: number
}

// Ordered by specificity — more specific (shorter) windows first
const SEASONAL_EVENTS: SeasonalEvent[] = [
  // Presidents' Day: mid-February window
  { context: 'presidents_day',  label: "Presidents' Day",                description: "Presidents' Day sales event",  month: 2,  dayStart: 10, dayEnd: 22 },
  // Memorial Day: last week of May
  { context: 'memorial_day',    label: "Memorial Day",                   description: "Memorial Day sales event",     month: 5,  dayStart: 25, dayEnd: 31 },
  // Fourth of July: late June through July 4
  { context: 'summer',          label: "Fourth of July",                 description: "Fourth of July sales event",   month: 6,  dayStart: 20, dayEnd: 30 },
  { context: 'summer',          label: "Fourth of July",                 description: "Fourth of July sales event",   month: 7,  dayStart: 1,  dayEnd: 4  },
  // Summer clearance: July through August
  { context: 'summer',          label: "Summer Clearance",               description: "summer clearance event",       month: 7,  dayStart: 5,  dayEnd: 31 },
  { context: 'summer',          label: "Summer Clearance",               description: "summer clearance event",       month: 8,  dayStart: 1,  dayEnd: 19 },
  // Labor Day: last week of August through Labor Day
  { context: 'labor_day',       label: "Labor Day",                      description: "Labor Day sales event",        month: 8,  dayStart: 20, dayEnd: 31 },
  { context: 'labor_day',       label: "Labor Day",                      description: "Labor Day sales event",        month: 9,  dayStart: 1,  dayEnd: 7  },
  // Black Friday: Thanksgiving week
  { context: 'black_friday',    label: "Black Friday",                   description: "Black Friday sales event",     month: 11, dayStart: 20, dayEnd: 30 },
  // Year-end clearance: December only (not months-long)
  { context: 'year_end',        label: "Year-End Clearance",             description: "year-end clearance event",     month: 12, dayStart: 1,  dayEnd: 31 },
  // Tax season: February 1 through April 15
  { context: 'spring_sales',    label: "Tax Season",                     description: "tax season buying period",     month: 2,  dayStart: 1,  dayEnd: 28 },
  { context: 'spring_sales',    label: "Tax Season",                     description: "tax season buying period",     month: 3,  dayStart: 1,  dayEnd: 31 },
  { context: 'spring_sales',    label: "Tax Season",                     description: "tax season buying period",     month: 4,  dayStart: 1,  dayEnd: 15 },
  // Spring sales: mid-March through April
  { context: 'spring_sales',    label: "Spring Sales",                   description: "spring sales season",          month: 3,  dayStart: 15, dayEnd: 31 },
  { context: 'spring_sales',    label: "Spring Sales",                   description: "spring sales season",          month: 4,  dayStart: 16, dayEnd: 30 },
]

export function getSeasonalContext(date: Date = new Date()): {
  context: SeasonalContext
  label: string
  description: string
} {
  const month = date.getMonth() + 1 // 1-12
  const day = date.getDate()

  // Find most specific matching event (prefer shorter windows)
  const match = SEASONAL_EVENTS.find(e =>
    e.month === month && day >= e.dayStart && day <= e.dayEnd
  )

  if (match) {
    return { context: match.context, label: match.label, description: match.description }
  }

  return { context: 'standard', label: 'Standard', description: 'standard buying period' }
}

// Returns upcoming seasonal events within the next 30 days
export function getUpcomingSeasonalEvents(fromDate: Date = new Date()): Array<{
  context: SeasonalContext
  label: string
  daysAway: number
  startsOn: Date
}> {
  const results: Array<{ context: SeasonalContext; label: string; daysAway: number; startsOn: Date }> = []
  const seen = new Set<string>()

  for (let i = 1; i <= 30; i++) {
    const checkDate = new Date(fromDate)
    checkDate.setDate(checkDate.getDate() + i)

    const month = checkDate.getMonth() + 1
    const day = checkDate.getDate()

    for (const event of SEASONAL_EVENTS) {
      if (event.month === month && day === event.dayStart && !seen.has(event.context)) {
        seen.add(event.context)
        results.push({ context: event.context, label: event.label, daysAway: i, startsOn: checkDate })
      }
    }
  }

  return results
}

export function estimateCurrentMileage(
  tradeInMileage: number,
  createdAt: string,
  avgMilesPerYear = 13500
): number {
  const daysSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  return Math.round(tradeInMileage + (daysSince / 365) * avgMilesPerYear)
}

const MILEAGE_MILESTONES = [75000, 100000, 125000, 150000]

export function checkMilestoneCrossed(
  tradeInMileage: number,
  estimatedMileage: number
): number | null {
  for (const milestone of MILEAGE_MILESTONES) {
    if (tradeInMileage < milestone && estimatedMileage >= milestone) {
      return milestone
    }
  }
  return null
}

export function monthsSince(dateStr: string): number {
  const then = new Date(dateStr)
  const now = new Date()
  return Math.floor(
    (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  )
}
