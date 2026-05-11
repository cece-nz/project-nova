import { supabase } from './supabase'
import type {
  MedicalStaff,
  MedicalStaffType,
  SavedAddress,
  Appointment,
  AppointmentMode,
  AppointmentStatus,
  AppointmentNote,
  AppointmentNoteType,
  AppointmentDocument,
  AppointmentAction,
} from '../types'

// ============================================================
// MEDICAL STAFF
// ============================================================

export async function getMedicalStaff(): Promise<MedicalStaff[]> {
  const { data, error } = await supabase
    .from('medical_staff')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data || []
}

export async function createMedicalStaff(staff: {
  name: string
  type: MedicalStaffType
  specialty?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}): Promise<MedicalStaff> {
  const { data, error } = await supabase
    .from('medical_staff')
    .insert({ ...staff, is_active: true })
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Medical staff insert returned no row')
  return data
}

export async function deactivateMedicalStaff(id: string): Promise<void> {
  const { error } = await supabase
    .from('medical_staff')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}

// ============================================================
// APPOINTMENTS
// ============================================================

export async function getAppointments(opts?: {
  status?: AppointmentStatus
  staffId?: string
}): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select('*, medical_staff:medical_staff_id(*)')
    .order('appointment_date', { ascending: true })

  if (opts?.status) query = query.eq('status', opts.status)
  if (opts?.staffId) query = query.eq('medical_staff_id', opts.staffId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, medical_staff:medical_staff_id(*)')
    .eq('status', 'upcoming')
    .gte('appointment_date', new Date().toISOString())
    .order('appointment_date', { ascending: true })
    .limit(10)
  if (error) throw error
  return data || []
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, medical_staff:medical_staff_id(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createAppointment(
  appt: {
    title: string
    medical_staff_id?: string | null
    appointment_date: string
    duration_minutes?: number | null
    mode: AppointmentMode
    location?: string | null
    address_id?: string | null
    latitude?: number | null
    longitude?: number | null
  },
  carerId: string,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...appt, created_by: carerId, status: 'upcoming' })
    .select('*, medical_staff:medical_staff_id(*)')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Appointment insert returned no row')
  return data
}

export async function updateAppointment(
  id: string,
  updates: Partial<{
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
  }>,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, medical_staff:medical_staff_id(*)')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Appointment update returned no row')
  return data
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// APPOINTMENT NOTES
// ============================================================

export async function getAppointmentNotes(appointmentId: string): Promise<AppointmentNote[]> {
  const { data, error } = await supabase
    .from('appointment_notes')
    .select('*, author:created_by(id, name, color)')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createAppointmentNote(
  appointmentId: string,
  noteType: AppointmentNoteType,
  content: string,
  carerId: string,
): Promise<AppointmentNote> {
  const { data, error } = await supabase
    .from('appointment_notes')
    .insert({ appointment_id: appointmentId, note_type: noteType, content, created_by: carerId })
    .select('*, author:created_by(id, name, color)')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Note insert returned no row')
  return data
}

export async function deleteAppointmentNote(id: string): Promise<void> {
  const { error } = await supabase.from('appointment_notes').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// APPOINTMENT DOCUMENTS
// ============================================================

export async function getAppointmentDocuments(appointmentId: string): Promise<AppointmentDocument[]> {
  const { data, error } = await supabase
    .from('appointment_documents')
    .select('*, uploader:uploaded_by(id, name)')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function uploadAppointmentDocument(
  appointmentId: string,
  file: File,
  carerId: string,
): Promise<AppointmentDocument> {
  const storagePath = `${appointmentId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('appointment-docs')
    .upload(storagePath, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('appointment_documents')
    .insert({
      appointment_id: appointmentId,
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: carerId,
    })
    .select('*, uploader:uploaded_by(id, name)')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Document insert returned no row')
  return data
}

export async function getDocumentUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('appointment-docs')
    .createSignedUrl(storagePath, 60 * 60) // 1 hour
  return data?.signedUrl ?? ''
}

export async function deleteAppointmentDocument(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from('appointment-docs').remove([storagePath])
  const { error } = await supabase.from('appointment_documents').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// APPOINTMENT ACTIONS
// ============================================================

export async function getAppointmentActions(appointmentId: string): Promise<AppointmentAction[]> {
  const { data, error } = await supabase
    .from('appointment_actions')
    .select('*, completer:completed_by(id, name)')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createAppointmentAction(
  appointmentId: string,
  description: string,
  carerId: string,
): Promise<AppointmentAction> {
  const { data, error } = await supabase
    .from('appointment_actions')
    .insert({ appointment_id: appointmentId, description, created_by: carerId })
    .select('*, completer:completed_by(id, name)')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Action insert returned no row')
  return data
}

export async function toggleAppointmentAction(
  id: string,
  isCompleted: boolean,
  carerId: string,
): Promise<AppointmentAction> {
  const { data, error } = await supabase
    .from('appointment_actions')
    .update({
      is_completed: isCompleted,
      completed_by: isCompleted ? carerId : null,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('*, completer:completed_by(id, name)')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Action update returned no row')
  return data
}

export async function deleteAppointmentAction(id: string): Promise<void> {
  const { error } = await supabase.from('appointment_actions').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// SAVED ADDRESSES
// medical_staff_id = null → shared/global, available on any appointment
// ============================================================

export async function getSharedAddresses(): Promise<SavedAddress[]> {
  const { data, error } = await supabase
    .from('saved_addresses')
    .select('*')
    .is('medical_staff_id', null)
    .order('created_at')
  if (error) throw error
  return (data || []) as SavedAddress[]
}

export async function getStaffAddresses(staffId: string): Promise<SavedAddress[]> {
  const { data, error } = await supabase
    .from('saved_addresses')
    .select('*')
    .eq('medical_staff_id', staffId)
    .order('created_at')
  if (error) throw error
  return (data || []) as SavedAddress[]
}

/** Returns shared addresses, plus addresses for the given staff if provided. */
export async function getAddressesForAppointment(staffId: string | null): Promise<SavedAddress[]> {
  const [shared, staff] = await Promise.all([
    getSharedAddresses(),
    staffId ? getStaffAddresses(staffId) : Promise.resolve([] as SavedAddress[]),
  ])
  return [...shared, ...staff]
}

export async function createSavedAddress(addr: {
  medical_staff_id: string | null
  label: string
  address: string
  latitude: number | null
  longitude: number | null
}): Promise<SavedAddress> {
  const { data, error } = await supabase
    .from('saved_addresses')
    .insert(addr)
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Address insert returned no row')
  return data as SavedAddress
}

export async function deleteSavedAddress(id: string): Promise<void> {
  const { error } = await supabase.from('saved_addresses').delete().eq('id', id)
  if (error) throw error
}
