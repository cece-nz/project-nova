-- ============================================================
-- Saved addresses
-- Stores reusable addresses for appointments. Each address may be
-- linked to a specific medical staff member (medical_staff_id set)
-- or be shared/global (medical_staff_id null) — shared addresses
-- appear for any appointment regardless of staff.
-- Captures lat/lon from OpenStreetMap/Nominatim autocomplete.
-- Run this in your Supabase SQL editor.
-- ============================================================

create table if not exists saved_addresses (
  id uuid primary key default uuid_generate_v4(),
  medical_staff_id uuid references medical_staff(id) on delete cascade,
  label text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create index if not exists idx_saved_addresses_staff
  on saved_addresses(medical_staff_id);

-- Optional fields on appointments: link to a saved address, plus its lat/lon
-- (so the appointment retains coords even if the saved row is later deleted).
alter table appointments
  add column if not exists address_id uuid references saved_addresses(id) on delete set null,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- RLS: open access for anon key (matches existing tables)
alter table saved_addresses enable row level security;
create policy "Service role full access" on saved_addresses for all using (true);
