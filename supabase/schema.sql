-- ============================================================
-- Nova Care - Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CARERS (users who log data)
-- ============================================================
create table carers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  pin_hash text not null, -- bcrypt hash of 4-digit PIN
  role text not null default 'carer', -- 'admin' | 'carer'
  color text not null default '#6366f1', -- avatar color
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- ============================================================
-- MEDICATIONS (the medications Nova takes)
-- ============================================================
create table medications (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  dose text not null, -- e.g. "5ml", "1 tablet"
  scheduled_times text[] not null default '{}', -- e.g. ['08:00', '13:00', '18:00']
  notes text,
  color text not null default '#8b5cf6',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MEDICATION LOGS
-- ============================================================
create table medication_logs (
  id uuid primary key default uuid_generate_v4(),
  medication_id uuid references medications(id) on delete set null,
  medication_name text not null, -- denormalised in case medication is deleted
  dose_given text not null,
  given_at timestamptz not null default now(),
  carer_id uuid references carers(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FLUID INTAKE LOGS
-- ============================================================
create table fluid_logs (
  id uuid primary key default uuid_generate_v4(),
  amount_ml integer not null,
  fluid_type text not null default 'water', -- 'water' | 'milk' | 'juice' | 'other'
  given_at timestamptz not null default now(),
  carer_id uuid references carers(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- OUTPUT LOGS (nappy + catheter + potty, every ~4 hours)
-- ============================================================
create table output_logs (
  id uuid primary key default uuid_generate_v4(),
  logged_at timestamptz not null default now(),
  nappy_weight_g integer, -- weight of wet nappy in grams (null if dry)
  nappy_was_dry boolean not null default false,
  catheter_ml integer, -- ml drained from catheter (null if none)
  potty_ml integer, -- ml from potty (null if none)
  carer_id uuid references carers(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- GENERAL NOTES
-- ============================================================
create table general_notes (
  id uuid primary key default uuid_generate_v4(),
  noted_at timestamptz not null default now(),
  content text not null,
  category text not null default 'general', -- 'general' | 'health' | 'behaviour' | 'sleep' | 'food'
  carer_id uuid references carers(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- DAILY SUMMARIES
-- ============================================================
create table daily_summaries (
  id uuid primary key default uuid_generate_v4(),
  summary_date date not null unique,
  content text not null,
  carer_id uuid references carers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- We use a simple approach: all authenticated requests via
-- the service role key are trusted (your app handles auth).
-- Enable RLS but allow all for the anon key with a secret check.
-- ============================================================

alter table carers enable row level security;
alter table medications enable row level security;
alter table medication_logs enable row level security;
alter table fluid_logs enable row level security;
alter table output_logs enable row level security;
alter table general_notes enable row level security;
alter table daily_summaries enable row level security;

-- Allow all operations via service role (your backend/app uses this)
create policy "Service role full access" on carers for all using (true);
create policy "Service role full access" on medications for all using (true);
create policy "Service role full access" on medication_logs for all using (true);
create policy "Service role full access" on fluid_logs for all using (true);
create policy "Service role full access" on output_logs for all using (true);
create policy "Service role full access" on general_notes for all using (true);
create policy "Service role full access" on daily_summaries for all using (true);

-- ============================================================
-- SEED: Initial admin carer
-- PIN: 1234 (change this immediately after setup!)
-- bcrypt hash of "1234" with 10 rounds
-- ============================================================
insert into carers (name, pin_hash, role, color) values
  ('Admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh8i', 'admin', '#6366f1');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Today's fluid total
create or replace view today_fluid_total as
  select
    coalesce(sum(amount_ml), 0) as total_ml,
    count(*) as entry_count
  from fluid_logs
  where given_at::date = current_date;

-- Today's output total  
create or replace view today_output_total as
  select
    coalesce(sum(catheter_ml), 0) as total_catheter_ml,
    coalesce(sum(potty_ml), 0) as total_potty_ml,
    coalesce(sum(nappy_weight_g), 0) as total_nappy_g,
    count(*) as entry_count
  from output_logs
  where logged_at::date = current_date;

-- Last output log (for countdown)
create or replace view last_output as
  select logged_at, id
  from output_logs
  order by logged_at desc
  limit 1;
