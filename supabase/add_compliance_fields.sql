-- Add opted_out boolean to leads
alter table leads add column if not exists opted_out boolean not null default false;

-- Add consent tracking fields to leads
alter table leads add column if not exists consent_source text;
alter table leads add column if not exists consent_date date;

-- Drop and recreate status check constraint to include opted_out
alter table leads drop constraint if exists leads_status_check;
alter table leads add constraint leads_status_check
  check (status in ('pending', 'contacted', 'responded', 'appointed', 'dead', 'opted_out'));

-- Add compliance fields to dealership_settings
alter table dealership_settings add column if not exists legal_business_name text;
alter table dealership_settings add column if not exists state_of_operation text;
alter table dealership_settings add column if not exists consent_confirmed boolean not null default false;

-- Index for fast opted_out filtering
create index if not exists leads_opted_out_idx on leads(opted_out);
