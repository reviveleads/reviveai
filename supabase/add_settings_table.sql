-- Dealership settings table
create table if not exists dealership_settings (
  id uuid primary key default uuid_generate_v4(),
  dealership_id uuid not null unique,
  dealership_name text not null default 'My Dealership',
  dealership_phone text,
  salesperson_name text,
  sending_email text,
  reply_to_email text,
  updated_at timestamptz not null default now()
);

-- Seed default settings for demo dealership
insert into dealership_settings (dealership_id, dealership_name, salesperson_name)
values ('00000000-0000-0000-0000-000000000001', 'ReviveAI Dealership', 'The Sales Team')
on conflict (dealership_id) do nothing;
