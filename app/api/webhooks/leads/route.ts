import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { classifyTier } from '@/lib/sequences/tierClassifier'
import crypto from 'crypto'

// ── ADF/XML parser ─────────────────────────────────────────────────────────────

interface ParsedLead {
  first_name: string
  last_name: string
  phone: string
  email: string | null
  vehicle_interest: string | null
  last_contact_date: string | null
  lead_source: string | null
  notes: string | null
  lead_source_raw: string | null
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'))
  return m?.[1]?.trim() || null
}

function extractAttr(xml: string, tag: string, attr: string, value: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*${attr}=["']${value}["'][^>]*>([^<]*)</${tag}>`, 'i'))
  return m?.[1]?.trim() || null
}

function parseADF(xml: string): ParsedLead | null {
  const firstName = extractAttr(xml, 'name', 'part', 'first') || extractTag(xml, 'firstname')
  const lastName = extractAttr(xml, 'name', 'part', 'last') || extractTag(xml, 'lastname')
  const phone = extractTag(xml, 'phone')

  if (!firstName || !lastName || !phone) return null

  const year = extractTag(xml, 'year')
  const make = extractTag(xml, 'make')
  const model = extractTag(xml, 'model')
  const vehicleParts = [year, make, model].filter(Boolean)
  const vehicleInterest = vehicleParts.length > 0 ? vehicleParts.join(' ') : null

  const vendorName = extractTag(xml, 'vendorname') || extractTag(xml, 'vendor')

  return {
    first_name: firstName,
    last_name: lastName,
    phone: phone.replace(/\D/g, ''),
    email: extractTag(xml, 'email'),
    vehicle_interest: vehicleInterest,
    last_contact_date: null,
    lead_source: vendorName,
    notes: extractTag(xml, 'comments') || extractTag(xml, 'comment'),
    lead_source_raw: vendorName,
  }
}

function parseJSON(body: Record<string, unknown>): ParsedLead | null {
  const firstName = (body.first_name ?? body.firstName ?? body.firstname ?? '') as string
  const lastName = (body.last_name ?? body.lastName ?? body.lastname ?? '') as string
  const phone = (body.phone ?? body.phone_number ?? '') as string

  if (!firstName || !lastName || !phone) return null

  const rawSource = (body.source ?? body.lead_source_raw ?? body.vendor ?? body.provider ?? null) as string | null

  return {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    phone: phone.trim().replace(/\D/g, ''),
    email: ((body.email ?? null) as string | null)?.trim() || null,
    vehicle_interest: ((body.vehicle_interest ?? body.vehicle ?? body.model_interest ?? null) as string | null)?.trim() || null,
    last_contact_date: ((body.last_contact_date ?? body.last_contact ?? null) as string | null) || null,
    lead_source: ((body.lead_source ?? rawSource ?? null) as string | null)?.trim() || null,
    notes: ((body.notes ?? body.comments ?? null) as string | null)?.trim() || null,
    lead_source_raw: rawSource?.trim() || null,
  }
}

// ── POST /api/webhooks/leads ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  // ── Auth: look up dealership by API key ──────────────────────────────────────
  const apiKey =
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  const { data: settings, error: settingsErr } = await supabase
    .from('dealership_settings')
    .select('dealership_id, webhook_api_key')
    .eq('webhook_api_key', apiKey)
    .single()

  if (settingsErr || !settings) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const dealershipId = settings.dealership_id
  const sourceIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
  const rawPayload = await request.text()

  // ── Parse body ───────────────────────────────────────────────────────────────
  let parsed: ParsedLead | null = null
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('xml')) {
    parsed = parseADF(rawPayload)
  } else {
    try {
      const json = JSON.parse(rawPayload)
      parsed = parseJSON(json)
    } catch {
      // Try ADF fallback if JSON parse fails
      parsed = parseADF(rawPayload)
    }
  }

  if (!parsed) {
    await logAttempt(supabase, dealershipId, sourceIp, rawPayload, 'error', null, 'Missing required fields: first_name, last_name, phone')
    return NextResponse.json({ error: 'Missing required fields: first_name, last_name, phone' }, { status: 400 })
  }

  // ── Dedup by phone ───────────────────────────────────────────────────────────
  const normalizedPhone = parsed.phone
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('dealership_id', dealershipId)
    .eq('phone', normalizedPhone)
    .maybeSingle()

  if (existing) {
    await logAttempt(supabase, dealershipId, sourceIp, rawPayload, 'duplicate', existing.id, null)
    return NextResponse.json({ received: true, duplicate: true, lead_id: existing.id })
  }

  // ── 30-day freshness check + tier classification ──────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const isFresh = parsed.last_contact_date && parsed.last_contact_date >= thirtyDaysAgo

  const now = new Date().toISOString()
  const tier = isFresh ? null : classifyTier(parsed.last_contact_date, now)

  // ── Insert lead ──────────────────────────────────────────────────────────────
  const { data: newLead, error: insertErr } = await supabase
    .from('leads')
    .insert({
      dealership_id: dealershipId,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      phone: normalizedPhone,
      email: parsed.email,
      vehicle_interest: parsed.vehicle_interest,
      last_contact_date: parsed.last_contact_date,
      lead_source: parsed.lead_source,
      lead_source_raw: parsed.lead_source_raw,
      notes: parsed.notes,
      status: 'pending',
      lead_tier: tier,
      opted_out: false,
      ai_paused: false,
    })
    .select('id')
    .single()

  if (insertErr || !newLead) {
    await logAttempt(supabase, dealershipId, sourceIp, rawPayload, 'error', null, insertErr?.message ?? 'Insert failed')
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }

  const status = isFresh ? 'skipped_fresh' : 'accepted'
  await logAttempt(supabase, dealershipId, sourceIp, rawPayload, status, newLead.id, null)

  return NextResponse.json({
    received: true,
    lead_id: newLead.id,
    tier,
    fresh: !!isFresh,
  })
}

async function logAttempt(
  supabase: ReturnType<typeof createAdminClient>,
  dealershipId: string,
  sourceIp: string | null,
  payload: string,
  status: string,
  leadId: string | null,
  errorMsg: string | null,
) {
  await supabase.from('webhook_attempts').insert({
    dealership_id: dealershipId,
    source_ip: sourceIp,
    payload,
    status,
    lead_id: leadId,
    error_msg: errorMsg,
  })
}
