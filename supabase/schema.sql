-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Leads table
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  dealership_id uuid not null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  vehicle_interest text,
  last_contact_date date,
  lead_source text,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'responded', 'appointed', 'dead')),
  notes text,
  created_at timestamptz not null default now()
);

-- Conversations table
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  channel text not null check (channel in ('sms', 'email')),
  direction text not null check (direction in ('outbound', 'inbound')),
  message text not null,
  sent_at timestamptz not null default now()
);

-- Appointments table
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  scheduled_at timestamptz not null,
  salesperson_notified boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists leads_dealership_id_idx on leads(dealership_id);
create index if not exists leads_status_idx on leads(status);
create index if not exists conversations_lead_id_idx on conversations(lead_id);
create index if not exists appointments_lead_id_idx on appointments(lead_id);
