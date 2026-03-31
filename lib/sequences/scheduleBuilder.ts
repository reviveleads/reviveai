import { LeadTier } from './tierClassifier'

interface TouchDef {
  touch_number: number
  day_offset: number
  channel: 'sms' | 'email'
}

// Hot: recently went dead (30–90 days) — aggressive, 13 touches over 180 days
const HOT_SEQUENCE: TouchDef[] = [
  { touch_number: 1,  day_offset: 0,   channel: 'sms'   }, // Sent immediately on launch
  { touch_number: 2,  day_offset: 3,   channel: 'sms'   },
  { touch_number: 3,  day_offset: 5,   channel: 'sms'   },
  { touch_number: 4,  day_offset: 8,   channel: 'email' },
  { touch_number: 5,  day_offset: 11,  channel: 'sms'   },
  { touch_number: 6,  day_offset: 16,  channel: 'email' },
  { touch_number: 7,  day_offset: 22,  channel: 'sms'   },
  { touch_number: 8,  day_offset: 28,  channel: 'sms'   },
  { touch_number: 9,  day_offset: 45,  channel: 'email' },
  { touch_number: 10, day_offset: 60,  channel: 'sms'   },
  { touch_number: 11, day_offset: 90,  channel: 'email' },
  { touch_number: 12, day_offset: 120, channel: 'sms'   },
  { touch_number: 13, day_offset: 180, channel: 'email' },
]

// Warm: went dark 91 days–1 year — medium cadence, 7 touches over 180 days
const WARM_SEQUENCE: TouchDef[] = [
  { touch_number: 1, day_offset: 0,   channel: 'sms'   }, // Sent immediately on launch
  { touch_number: 2, day_offset: 7,   channel: 'email' },
  { touch_number: 3, day_offset: 21,  channel: 'sms'   },
  { touch_number: 4, day_offset: 45,  channel: 'email' },
  { touch_number: 5, day_offset: 75,  channel: 'sms'   },
  { touch_number: 6, day_offset: 105, channel: 'email' },
  { touch_number: 7, day_offset: 180, channel: 'sms'   },
]

// Cold: 1+ year gone — relationship play, 6 touches over 365 days
// Touch 1 is email (not immediate SMS blast) — queued for cron
const COLD_SEQUENCE: TouchDef[] = [
  { touch_number: 1, day_offset: 0,   channel: 'email' },
  { touch_number: 2, day_offset: 30,  channel: 'sms'   },
  { touch_number: 3, day_offset: 90,  channel: 'email' },
  { touch_number: 4, day_offset: 180, channel: 'sms'   },
  { touch_number: 5, day_offset: 270, channel: 'email' },
  { touch_number: 6, day_offset: 365, channel: 'sms'   },
]

const SEQUENCES: Record<LeadTier, TouchDef[]> = {
  hot: HOT_SEQUENCE,
  warm: WARM_SEQUENCE,
  cold: COLD_SEQUENCE,
}

export interface SequenceRecord {
  lead_id: string
  dealership_id: string
  channel: 'sms' | 'email'
  scheduled_for: string
  status: 'pending' | 'sent'
  touch_number: number
}

/**
 * Build all sequence records for a lead.
 * - Hot/warm: touch 1 is sent immediately by campaign launch, so mark it 'sent'
 * - Cold: all touches are pending (cron handles touch 1 as email)
 */
export function buildSequence(
  leadId: string,
  dealershipId: string,
  tier: LeadTier,
  launchAt: Date = new Date()
): SequenceRecord[] {
  const isCold = tier === 'cold'
  return SEQUENCES[tier].map(touch => {
    const scheduledFor = new Date(launchAt)
    scheduledFor.setDate(scheduledFor.getDate() + touch.day_offset)
    // Hot/warm touch 1 is handled by campaign launch immediately
    const alreadySent = !isCold && touch.touch_number === 1
    return {
      lead_id: leadId,
      dealership_id: dealershipId,
      channel: touch.channel,
      scheduled_for: scheduledFor.toISOString(),
      status: alreadySent ? 'sent' : 'pending',
      touch_number: touch.touch_number,
    }
  })
}

export function totalTouches(tier: LeadTier): number {
  return SEQUENCES[tier].length
}
