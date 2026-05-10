-- ============================================================
-- Appointments feature
-- Run this in your Supabase SQL editor.
-- ============================================================

-- ============================================================
-- MEDICAL STAFF
-- ============================================================
create table if not exists medical_staff (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null default 'other'
    check (type in ('gp', 'specialist', 'nurse', 'physio', 'therapist', 'other')),
  specialty text,
  phone text,
  email text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  medical_staff_id uuid references medical_staff(id) on delete set null,
  appointment_date timestamptz not null,
  duration_minutes integer,
  mode text not null default 'in_person'
    check (mode in ('telephone', 'in_person')),
  location text,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'completed', 'cancelled')),
  created_by uuid references carers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- APPOINTMENT NOTES
-- ============================================================
create table if not exists appointment_notes (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  note_type text not null default 'shared'
    check (note_type in ('shared', 'person')),
  content text not null,
  created_by uuid references carers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- APPOINTMENT DOCUMENTS  (storage paths — bucket: appointment-docs)
-- ============================================================
create table if not exists appointment_documents (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid references carers(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- APPOINTMENT ACTIONS
-- ============================================================
create table if not exists appointment_actions (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  description text not null,
  is_completed boolean not null default false,
  completed_by uuid references carers(id) on delete set null,
  completed_at timestamptz,
  created_by uuid references carers(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS  (same open policy as existing tables — app handles auth)
-- ============================================================
alter table medical_staff enable row level security;
alter table appointments enable row level security;
alter table appointment_notes enable row level security;
alter table appointment_documents enable row level security;
alter table appointment_actions enable row level security;

create policy "Service role full access" on medical_staff for all using (true);
create policy "Service role full access" on appointments for all using (true);
create policy "Service role full access" on appointment_notes for all using (true);
create policy "Service role full access" on appointment_documents for all using (true);
create policy "Service role full access" on appointment_actions for all using (true);

-- ============================================================
-- Supabase Storage bucket
-- Create this manually in your Supabase dashboard:
--   Storage → New bucket → Name: "appointment-docs" → Private
-- ============================================================
