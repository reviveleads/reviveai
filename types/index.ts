export type LeadStatus = 'pending' | 'contacted' | 'responded' | 'appointed' | 'dead' | 'abandoned' | 'opted_out'
export type LeadIntent = 'model_loyal' | 'budget_driven'
export type LeadTier = 'hot' | 'warm' | 'cold'

export type SeasonalContext =
  | 'presidents_day'
  | 'spring_sales'
  | 'memorial_day'
  | 'summer'
  | 'labor_day'
  | 'year_end'
  | 'black_friday'
  | 'standard'

export interface Lead {
  id: string
  dealership_id: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  vehicle_interest: string | null
  last_contact_date: string | null
  lead_source: string | null
  lead_source_raw: string | null
  status: LeadStatus
  notes: string | null
  opted_out: boolean
  consent_source: string | null
  consent_date: string | null
  trade_in_make: string | null
  trade_in_model: string | null
  trade_in_year: number | null
  trade_in_mileage: number | null
  budget_notes: string | null
  mileage_milestone_triggered: boolean
  lead_intent: LeadIntent | null
  lead_tier: LeadTier | null
  sequence_paused: boolean
  ai_paused: boolean
  created_at: string
}

export interface Conversation {
  id: string
  lead_id: string
  channel: 'sms' | 'email'
  direction: 'outbound' | 'inbound'
  message: string
  sent_at: string
  sent_by?: string
}

export interface Appointment {
  id: string
  lead_id: string
  scheduled_at: string
  salesperson_notified: boolean
  notes: string | null
  created_at: string
}

export interface LeadStats {
  total: number
  pending: number
  contacted: number
  responded: number
  appointed: number
  dead: number
  abandoned: number
  opted_out: number
  sequences_active: number
}

export interface CampaignSequence {
  id: string
  lead_id: string
  dealership_id: string
  channel: 'sms' | 'email'
  scheduled_for: string
  status: 'pending' | 'sent' | 'skipped' | 'failed'
  touch_number: number
  sent_at: string | null
  error_message: string | null
  created_at: string
}

export interface LeadSequenceSummary {
  lead_id: string
  touches_sent: number
  total_touches: number
  next_touch_number: number | null
  next_touch_at: string | null
  next_touch_channel: 'sms' | 'email' | null
}

export interface CSVLeadRow {
  first_name: string
  last_name: string
  phone: string
  email?: string
  vehicle_interest?: string
  last_contact_date?: string
  lead_source?: string
  consent_source?: string
  consent_date?: string
  notes?: string
  trade_in_make?: string
  trade_in_model?: string
  trade_in_year?: string
  trade_in_mileage?: string
  budget_notes?: string
}

export type IncentiveType = 'cash_back' | 'apr_deal' | 'lease_special' | 'loyalty' | 'supplier' | 'regional' | 'general'

export interface VehicleIntel {
  id: string
  dealership_id: string
  make: string | null
  model: string | null
  year: number | null
  intel_type: string
  incentive_type: IncentiveType
  incentive_amount: number | null
  incentive_expiry: string | null
  region: string | null
  source: string | null
  summary: string
  source_url: string | null
  is_active: boolean
  fetched_at: string
  created_at: string
}

export interface VehicleNews {
  id: string
  dealership_id: string
  headline: string
  summary: string | null
  url: string
  brand: string | null
  image_url: string | null
  source: string | null
  published_at: string | null
  article_type?: string
  created_at: string
}

export interface DealerIncentive {
  id: string
  dealership_id: string
  vehicle_model: string | null
  deal_description: string
  expires_at: string | null
  deal_scope: 'all_new' | 'all_used' | 'specific'
  created_at: string
}

export interface DoNotContactEntry {
  id: string
  dealership_id: string
  phone: string | null
  email: string | null
  reason: string | null
  created_at: string
}

export interface DealerInventoryItem {
  id: string
  dealership_id: string
  year: number
  make: string
  model: string
  trim: string | null
  price: number | null
  mileage: number | null
  condition: 'new' | 'used' | 'certified'
  category: string | null
  stock_number: string | null
  is_available: boolean
  created_at: string
}
