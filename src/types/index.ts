// ============================================================
// Database types matching Supabase schema
// ============================================================

export type CarerRole = 'admin' | 'medical' | 'helper'

export interface Carer {
  id: string
  name: string
  pin_hash: string
  role: CarerRole
  color: string
  created_at: string
  is_active: boolean
}

export interface Medication {
  id: string
  name: string
  dose: string
  scheduled_times: string[]
  notes: string | null
  color: string
  is_active: boolean
  created_at: string
}

export interface MedicationLog {
  id: string
  medication_id: string | null
  medication_name: string
  dose_given: string
  given_at: string
  carer_id: string | null
  notes: string | null
  created_at: string
  carer?: Carer
  medication?: Medication
}

export interface FluidLog {
  id: string
  amount_ml: number
  fluid_type: FluidType
  given_at: string
  carer_id: string | null
  notes: string | null
  created_at: string
  carer?: Carer
}

export interface OutputLog {
  id: string
  logged_at: string
  nappy_weight_g: number | null
  nappy_was_dry: boolean
  catheter_ml: number | null
  potty_ml: number | null
  carer_id: string | null
  notes: string | null
  created_at: string
  carer?: Carer
}

export interface GeneralNote {
  id: string
  noted_at: string
  content: string
  category: NoteCategory
  carer_id: string | null
  created_at: string
  carer?: Carer
}

export interface DailySummary {
  id: string
  summary_date: string
  content: string
  carer_id: string | null
  created_at: string
  updated_at: string
  carer?: Carer
}

// ============================================================
// Union types for log entries (timeline display)
// ============================================================

export type LogEntry =
  | { type: 'medication'; data: MedicationLog; time: string }
  | { type: 'fluid'; data: FluidLog; time: string }
  | { type: 'output'; data: OutputLog; time: string }
  | { type: 'note'; data: GeneralNote; time: string }

// ============================================================
// Enums / union types
// ============================================================

export type FluidType = 'water' | 'milk' | 'juice' | 'formula' | 'other'

export type NoteCategory = 'general' | 'health' | 'behaviour' | 'sleep' | 'food'

// ============================================================
// Auth context type
// ============================================================

export interface AuthState {
  carer: Carer | null
  isLoading: boolean
}

// ============================================================
// Form types
// ============================================================

export interface MedicationLogForm {
  medication_id: string
  dose_given: string
  given_at: string
  notes: string
}

export interface FluidLogForm {
  amount_ml: string
  fluid_type: FluidType
  given_at: string
  notes: string
}

export interface OutputLogForm {
  logged_at: string
  nappy_was_dry: boolean
  nappy_weight_g: string
  catheter_ml: string
  potty_ml: string
  notes: string
}

export interface GeneralNoteForm {
  content: string
  category: NoteCategory
  noted_at: string
}

// ============================================================
// Medical staff & appointments
// ============================================================

export type MedicalStaffType = 'gp' | 'specialist' | 'nurse' | 'physio' | 'therapist' | 'other'
export type AppointmentMode = 'telephone' | 'in_person'
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled'
export type AppointmentNoteType = 'shared' | 'person'

export interface MedicalStaff {
  id: string
  name: string
  type: MedicalStaffType
  specialty: string | null
  phone: string | null
  email: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface SavedAddress {
  id: string
  medical_staff_id: string | null
  label: string
  address: string
  latitude: number | null
  longitude: number | null
  created_at: string
}

export interface Appointment {
  id: string
  title: string
  medical_staff_id: string | null
  appointment_date: string
  duration_minutes: number | null
  mode: AppointmentMode
  location: string | null
  address_id: string | null
  latitude: number | null
  longitude: number | null
  status: AppointmentStatus
  created_by: string | null
  created_at: string
  updated_at: string
  medical_staff?: MedicalStaff
}

export interface AppointmentNote {
  id: string
  appointment_id: string
  note_type: AppointmentNoteType
  content: string
  created_by: string | null
  created_at: string
  updated_at: string
  author?: { id: string; name: string; color: string }
}

export interface AppointmentDocument {
  id: string
  appointment_id: string
  filename: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
  uploader?: { id: string; name: string }
}

export interface AppointmentAction {
  id: string
  appointment_id: string
  description: string
  is_completed: boolean
  completed_by: string | null
  completed_at: string | null
  created_by: string | null
  created_at: string
  completer?: { id: string; name: string }
}

// ============================================================
// Daily stats
// ============================================================

export interface DailyStats {
  totalFluidMl: number
  fluidEntries: number
  totalCatheterMl: number
  totalPottyMl: number
  totalNappyG: number
  outputEntries: number
  medicationsGiven: number
  lastOutputAt: string | null
}
