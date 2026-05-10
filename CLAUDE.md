# Nova Care — Project Context

Personal care-tracking app for Nova. Helpers log daily care events (medications, fluid intake, output, notes). Medical staff and admins have read-only or full access. Appointments with medical staff are tracked with notes, documents, and actions.

## Running the project

```bash
npm run dev      # dev server at localhost:5173
npm run build    # tsc + vite build
npx tsc --noEmit # type-check only
```

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 (custom `nova` colour scale — purple/fuchsia) |
| Font | DM Sans (Google Fonts, loaded in `index.html`) |
| Icons | lucide-react |
| Backend | Supabase (Postgres + Storage) |
| Auth | PIN-based (bcryptjs hashes stored in `carers` table) |
| Date handling | date-fns |
| Toasts | react-hot-toast |

## Project structure

```
src/
  App.tsx                        # Root — AuthProvider wraps everything
  index.css                      # Tailwind base + scroll-margin-top mobile fix

  components/
    auth/LoginScreen.tsx         # PIN login — pick user → enter 4-digit PIN
    dashboard/
      Dashboard.tsx              # Tab shell: Today | Summary | Appointments | Admin
      CountdownCard.tsx          # Output countdown (4h target), circular progress
      StatsBar.tsx               # Fluid / catheter / medication daily totals
      Timeline.tsx               # Chronological log of today's entries
      DailySummaryView.tsx       # Admin-editable daily notes + auto stats
      AdminPanel.tsx             # Manage Users | Medical Staff | Medications
    appointments/
      AppointmentList.tsx        # List with status + staff filters; tap → detail
      AppointmentForm.tsx        # Create / edit appointment
      AppointmentDetail.tsx      # 4-tab detail: shared notes | person notes | docs | actions
    forms/
      MedicationForm.tsx         # Log medication given
      FluidForm.tsx              # Log fluid intake
      OutputForm.tsx             # Log output check (nappy/catheter/potty)
      NoteForm.tsx               # Add general note
    layout/ActionBar.tsx         # Fixed bottom bar — shows log buttons (hidden for Medical)
    ui/
      Modal.tsx                  # Bottom-sheet on mobile, centred on desktop
      FormElements.tsx           # Field, Input, Textarea, Select, Toggle, ChipGroup, NumberInput, SubmitButton

  hooks/
    useAuth.tsx                  # AuthContext — carer | isLoading | login | logout
    useCountdown.ts              # Polls last output, recomputes every 30s

  lib/
    supabase.ts                  # Supabase client (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
    auth.ts                      # loginWithPin, getAllCarers, createCarer, updateCarerPin
    db.ts                        # Core log CRUD — medications, fluid, output, notes, daily summary
    appointments.ts              # Medical staff + appointments + notes + documents + actions
    permissions.ts               # can.* helpers + ROLE_LABEL

  types/index.ts                 # All TypeScript interfaces and union types
  utils/index.ts                 # formatTime, formatDate, toLocalIso, getCountdownInfo, CARER_COLORS, FLUID_TYPES, NOTE_CATEGORIES

supabase/
  schema.sql                     # Full schema for a fresh install
  migrations/
    2026-05-10-roles.sql         # Adds role check constraint (admin|medical|helper)
    2026-05-11-appointments.sql  # Adds medical_staff, appointments, notes, documents, actions tables
```

## Supabase setup

**Environment variables** (`.env.local`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Tables:** `carers`, `medications`, `medication_logs`, `fluid_logs`, `output_logs`, `general_notes`, `daily_summaries`, `medical_staff`, `appointments`, `appointment_notes`, `appointment_documents`, `appointment_actions`

**Storage bucket:** `appointment-docs` (private) — create manually in Supabase dashboard under Storage.

**Running migrations:** paste each file in `supabase/migrations/` into the Supabase SQL editor in order.

**Auth model:** no Supabase Auth — the app uses its own PIN auth. All DB access goes through the anon key with open RLS policies (`for all using (true)`). Session is stored in `sessionStorage` as a JSON `Carer` object.

## Role system

Defined in `src/lib/permissions.ts`. Three roles stored in `carers.role`:

| Role | What they can do |
|---|---|
| `admin` | Everything — manage users, medical staff, medications, create/edit/delete appointments, edit daily summary, delete log entries |
| `medical` | Read-only across the board. Sees appointments, shared notes, uploaded documents. No log buttons, no admin tab |
| `helper` | Can ADD output / fluid / medication-log / note. Sees appointments (basic info only — no notes/docs/actions). No delete, no admin |

Always gate UI with `can.*` helpers — never check `carer.role === 'admin'` directly in components.

```ts
can.logEntry(role)             // admin | helper
can.deleteEntry(role)          // admin only
can.editDailySummary(role)     // admin only
can.manageAdmin(role)          // admin only
can.manageAppointments(role)   // admin only
can.viewAppointmentDetail(role)// admin | medical
can.manageMedicalStaff(role)   // admin only
```

## Key conventions

**Forms** open in a `Modal` (bottom-sheet on mobile). Pass `onSuccess` to close + refresh.

**DB functions** always `throw` on error and return typed data. Use `.maybeSingle()` not `.single()` to avoid 406 errors.

**Dates** — store as ISO UTC in Supabase. Display with `date-fns`. Use `toLocalIso()` / `fromLocalIso()` to convert datetime-local inputs.

**Tailwind** — use the `nova` colour scale for brand elements. `pb-safe` class handles iOS safe-area padding on the bottom bar. `scroll-margin-top: 7rem` is set globally on inputs to prevent the sticky header obscuring focused fields on mobile.

**No comments** unless a non-obvious constraint. No default exports except in `App.tsx` and `main.tsx`.

## Planned / in progress (Session 3)

- Dashboard Today tab: strip showing upcoming appointments (filterable by staff / mode)
- Dashboard Today tab: "time since last medication" card (hours + minutes, med name)
