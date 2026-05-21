-- Add per-dealership Telnyx 10DLC fields to dealership_settings
-- Each dealership owns its own brand, campaign, and number.
-- Revive AI operates the messaging on their behalf.

alter table dealership_settings
  add column if not exists telnyx_brand_id text,
  add column if not exists telnyx_campaign_id text,
  add column if not exists tcr_brand_id text,
  add column if not exists tcr_campaign_id text,
  add column if not exists telnyx_phone_number text,
  add column if not exists telnyx_messaging_profile_id text,
  add column if not exists brand_status text default 'not_started'
    check (brand_status in ('not_started', 'pending', 'verified', 'rejected')),
  add column if not exists campaign_status text default 'not_started'
    check (campaign_status in ('not_started', 'pending', 'mno_pending', 'approved', 'rejected')),
  add column if not exists messaging_enabled boolean not null default false;

-- messaging_enabled is the master switch.
-- A dealership can only send SMS when its brand is verified,
-- campaign is approved, and a number is assigned.
-- The send layer must check this flag before sending anything.

comment on column dealership_settings.messaging_enabled is
  'Master switch. Only true when brand verified + campaign approved + number assigned. Send layer must check this before sending.';