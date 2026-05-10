-- ============================================================
-- Role refactor: admin | medical | helper
-- Run this in your Supabase SQL editor.
-- Safe to re-run.
-- ============================================================

-- Drop any existing role check constraint, then add the new one
alter table carers drop constraint if exists carers_role_check;

alter table carers
  add constraint carers_role_check
  check (role in ('admin', 'medical', 'helper'));

-- Rename 'carer' → 'helper' for any existing rows
update carers set role = 'helper'
  where role = 'carer';

-- Any remaining unrecognised roles get downgraded to helper
update carers set role = 'helper'
  where role not in ('admin', 'medical', 'helper');
