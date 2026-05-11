import { supabase } from './supabase'
import { format, startOfDay, endOfDay } from 'date-fns'
import type {
  MedicationLog,
  FluidLog,
  OutputLog,
  GeneralNote,
  DailySummary,
  Medication,
  MedicationLogForm,
  FluidLogForm,
  OutputLogForm,
  GeneralNoteForm,
  DailyStats,
  LogEntry,
} from '../types'

// ============================================================
// MEDICATIONS
// ============================================================

export async function getMedications(): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data || []
}

export async function createMedication(med: Omit<Medication, 'id' | 'created_at' | 'is_active'>): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .insert({ ...med, is_active: true })
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Medication insert did not return a row; check SELECT RLS on `medications`.')
  return data
}

// ============================================================
// LOG: MEDICATION
// ============================================================

export async function logMedication(form: MedicationLogForm, carerId: string): Promise<MedicationLog> {
  const { data, error } = await supabase
    .from('medication_logs')
    .insert({
      medication_id: form.medication_id || null,
      medication_name: form.medication_id, // will be replaced below
      dose_given: form.dose_given,
      given_at: form.given_at,
      carer_id: carerId,
      notes: form.notes || null,
    })
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Medication log insert did not return a row; check SELECT RLS on `medication_logs`.')
  return data
}

export async function logMedicationWithName(
  form: MedicationLogForm & { medication_name: string },
  carerId: string
): Promise<MedicationLog> {
  const { data, error } = await supabase
    .from('medication_logs')
    .insert({
      medication_id: form.medication_id || null,
      medication_name: form.medication_name,
      dose_given: form.dose_given,
      given_at: form.given_at,
      carer_id: carerId,
      notes: form.notes || null,
    })
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Medication log insert did not return a row; check SELECT RLS on `medication_logs`.')
  return data
}

// ============================================================
// LOG: FLUID
// ============================================================

export async function logFluid(form: FluidLogForm, carerId: string): Promise<FluidLog> {
  const { data, error } = await supabase
    .from('fluid_logs')
    .insert({
      amount_ml: parseInt(form.amount_ml),
      fluid_type: form.fluid_type,
      given_at: form.given_at,
      carer_id: carerId,
      notes: form.notes || null,
    })
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Fluid log insert did not return a row; check SELECT RLS on `fluid_logs`.')
  return data
}

// ============================================================
// LOG: OUTPUT
// ============================================================

export async function logOutput(form: OutputLogForm, carerId: string): Promise<OutputLog> {
  const { data, error } = await supabase
    .from('output_logs')
    .insert({
      logged_at: form.logged_at,
      nappy_was_dry: form.nappy_was_dry,
      nappy_weight_g: form.nappy_was_dry ? null : (form.nappy_weight_g ? parseInt(form.nappy_weight_g) : null),
      catheter_ml: form.catheter_ml ? parseInt(form.catheter_ml) : null,
      potty_ml: form.potty_ml ? parseInt(form.potty_ml) : null,
      carer_id: carerId,
      notes: form.notes || null,
    })
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Output log insert did not return a row; check SELECT RLS on `output_logs`.')
  return data
}

// ============================================================
// LOG: GENERAL NOTE
// ============================================================

export async function logNote(form: GeneralNoteForm, carerId: string): Promise<GeneralNote> {
  const { data, error } = await supabase
    .from('general_notes')
    .insert({
      content: form.content,
      category: form.category,
      noted_at: form.noted_at,
      carer_id: carerId,
    })
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Note insert did not return a row; check SELECT RLS on `general_notes`.')
  return data
}

// ============================================================
// FETCH: TODAY'S ENTRIES
// ============================================================

export async function getTodayEntries(date?: Date): Promise<LogEntry[]> {
  const day = date || new Date()
  const start = startOfDay(day).toISOString()
  const end = endOfDay(day).toISOString()

  const [meds, fluids, outputs, notes] = await Promise.all([
    supabase
      .from('medication_logs')
      .select('*, carer:carer_id(id, name, color)')
      .gte('given_at', start)
      .lte('given_at', end)
      .order('given_at', { ascending: false }),
    supabase
      .from('fluid_logs')
      .select('*, carer:carer_id(id, name, color)')
      .gte('given_at', start)
      .lte('given_at', end)
      .order('given_at', { ascending: false }),
    supabase
      .from('output_logs')
      .select('*, carer:carer_id(id, name, color)')
      .gte('logged_at', start)
      .lte('logged_at', end)
      .order('logged_at', { ascending: false }),
    supabase
      .from('general_notes')
      .select('*, carer:carer_id(id, name, color)')
      .gte('noted_at', start)
      .lte('noted_at', end)
      .order('noted_at', { ascending: false }),
  ])

  const entries: LogEntry[] = [
    ...(meds.data || []).map((d): LogEntry => ({ type: 'medication', data: d as MedicationLog, time: d.given_at })),
    ...(fluids.data || []).map((d): LogEntry => ({ type: 'fluid', data: d as FluidLog, time: d.given_at })),
    ...(outputs.data || []).map((d): LogEntry => ({ type: 'output', data: d as OutputLog, time: d.logged_at })),
    ...(notes.data || []).map((d): LogEntry => ({ type: 'note', data: d as GeneralNote, time: d.noted_at })),
  ]

  return entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

// ============================================================
// FETCH: DAILY STATS
// ============================================================

export async function getDailyStats(date?: Date): Promise<DailyStats> {
  const day = date || new Date()
  const start = startOfDay(day).toISOString()
  const end = endOfDay(day).toISOString()

  const [fluids, outputs, meds, lastOutput] = await Promise.all([
    supabase.from('fluid_logs').select('amount_ml').gte('given_at', start).lte('given_at', end),
    supabase.from('output_logs').select('catheter_ml, potty_ml, nappy_weight_g').gte('logged_at', start).lte('logged_at', end),
    supabase.from('medication_logs').select('id').gte('given_at', start).lte('given_at', end),
    supabase.from('output_logs').select('logged_at').order('logged_at', { ascending: false }).limit(1),
  ])

  return {
    totalFluidMl: (fluids.data || []).reduce((sum, r) => sum + (r.amount_ml || 0), 0),
    fluidEntries: (fluids.data || []).length,
    totalCatheterMl: (outputs.data || []).reduce((sum, r) => sum + (r.catheter_ml || 0), 0),
    totalPottyMl: (outputs.data || []).reduce((sum, r) => sum + (r.potty_ml || 0), 0),
    totalNappyG: (outputs.data || []).reduce((sum, r) => sum + (r.nappy_weight_g || 0), 0),
    outputEntries: (outputs.data || []).length,
    medicationsGiven: (meds.data || []).length,
    lastOutputAt: lastOutput.data?.[0]?.logged_at || null,
  }
}

// ============================================================
// FETCH: LAST OUTPUT (for countdown)
// ============================================================

export async function getLastOutput(): Promise<OutputLog | null> {
  const { data, error } = await supabase
    .from('output_logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data as OutputLog | null
}

// ============================================================
// DAILY SUMMARY
// ============================================================

export async function getDailySummary(date: Date): Promise<DailySummary | null> {
  const dateStr = format(date, 'yyyy-MM-dd')
  const { data, error } = await supabase
    .from('daily_summaries')
    .select('*, carer:carer_id(id, name, color)')
    .eq('summary_date', dateStr)
    .maybeSingle()

  if (error || !data) return null
  return data as DailySummary
}

export async function saveDailySummary(
  content: string,
  carerId: string,
  date: Date
): Promise<DailySummary> {
  const dateStr = format(date, 'yyyy-MM-dd')
  const { data, error } = await supabase
    .from('daily_summaries')
    .upsert(
      { summary_date: dateStr, content, carer_id: carerId, updated_at: new Date().toISOString() },
      { onConflict: 'summary_date' }
    )
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data)
    throw new Error('Daily summary upsert did not return a row; check SELECT RLS on `daily_summaries`.')
  return data as DailySummary
}

// ============================================================
// UPDATE: LOG ENTRIES
// ============================================================

export async function updateMedicationLog(
  id: string,
  updates: { medication_name: string; dose_given: string; given_at: string; notes: string | null }
): Promise<MedicationLog> {
  const { data, error } = await supabase
    .from('medication_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Update returned no row')
  return data
}

export async function updateFluidLog(
  id: string,
  updates: { amount_ml: number; fluid_type: string; given_at: string; notes: string | null }
): Promise<FluidLog> {
  const { data, error } = await supabase
    .from('fluid_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Update returned no row')
  return data
}

export async function updateOutputLog(
  id: string,
  updates: {
    logged_at: string
    nappy_was_dry: boolean
    nappy_weight_g: number | null
    catheter_ml: number | null
    potty_ml: number | null
    notes: string | null
  }
): Promise<OutputLog> {
  const { data, error } = await supabase
    .from('output_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Update returned no row')
  return data
}

export async function updateNote(
  id: string,
  updates: { content: string; category: string; noted_at: string }
): Promise<GeneralNote> {
  const { data, error } = await supabase
    .from('general_notes')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Update returned no row')
  return data
}

// ============================================================
// FETCH: CATHETER BLOCK DATA
// ============================================================

export async function getLastCatheterOutput(): Promise<OutputLog | null> {
  const { data, error } = await supabase
    .from('output_logs')
    .select('*')
    .gt('catheter_ml', 0)
    .order('logged_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as OutputLog | null
}

export async function getCatheterBlockData(): Promise<{
  catheterLogs: OutputLog[]
  allFluidLogs: FluidLog[]
  allOutputLogs: OutputLog[]
  allMedLogs: MedicationLog[]
  allNotes: GeneralNote[]
}> {
  const [catheter, fluids, outputs, meds, notes] = await Promise.all([
    supabase.from('output_logs').select('*, carer:carer_id(id, name, color)').gt('catheter_ml', 0).order('logged_at'),
    supabase.from('fluid_logs').select('*, carer:carer_id(id, name, color)').order('given_at'),
    supabase.from('output_logs').select('*, carer:carer_id(id, name, color)').order('logged_at'),
    supabase.from('medication_logs').select('*, carer:carer_id(id, name, color)').order('given_at'),
    supabase.from('general_notes').select('*, carer:carer_id(id, name, color)').order('noted_at'),
  ])
  return {
    catheterLogs: (catheter.data || []) as OutputLog[],
    allFluidLogs: (fluids.data || []) as FluidLog[],
    allOutputLogs: (outputs.data || []) as OutputLog[],
    allMedLogs: (meds.data || []) as MedicationLog[],
    allNotes: (notes.data || []) as GeneralNote[],
  }
}

// ============================================================
// FETCH: LAST MEDICATION
// ============================================================

export async function getLastMedication(): Promise<MedicationLog | null> {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .order('given_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as MedicationLog | null
}

export async function getEntriesForRange(from?: Date): Promise<LogEntry[]> {
  const start = from ? startOfDay(from).toISOString() : undefined

  const [meds, fluids, outputs, notes] = await Promise.all([
    (() => {
      let q = supabase.from('medication_logs').select('*, carer:carer_id(id, name, color)').order('given_at', { ascending: false })
      if (start) q = q.gte('given_at', start)
      return q
    })(),
    (() => {
      let q = supabase.from('fluid_logs').select('*, carer:carer_id(id, name, color)').order('given_at', { ascending: false })
      if (start) q = q.gte('given_at', start)
      return q
    })(),
    (() => {
      let q = supabase.from('output_logs').select('*, carer:carer_id(id, name, color)').order('logged_at', { ascending: false })
      if (start) q = q.gte('logged_at', start)
      return q
    })(),
    (() => {
      let q = supabase.from('general_notes').select('*, carer:carer_id(id, name, color)').order('noted_at', { ascending: false })
      if (start) q = q.gte('noted_at', start)
      return q
    })(),
  ])

  const entries: LogEntry[] = [
    ...(meds.data || []).map((d): LogEntry => ({ type: 'medication', data: d as MedicationLog, time: d.given_at })),
    ...(fluids.data || []).map((d): LogEntry => ({ type: 'fluid', data: d as FluidLog, time: d.given_at })),
    ...(outputs.data || []).map((d): LogEntry => ({ type: 'output', data: d as OutputLog, time: d.logged_at })),
    ...(notes.data || []).map((d): LogEntry => ({ type: 'note', data: d as GeneralNote, time: d.noted_at })),
  ]

  return entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

export async function deleteEntry(
  type: 'medication_logs' | 'fluid_logs' | 'output_logs' | 'general_notes',
  id: string
): Promise<void> {
  const { error } = await supabase.from(type).delete().eq('id', id)
  if (error) throw error
}

export interface DailyPoint {
  date: string       // 'yyyy-MM-dd'
  label: string      // 'Mon 5 May'
  fluidMl: number
  cathyMl: number
  pottyMl: number
  nappyMl: number
  meds: number
}

export async function getDailyTrends(days: number): Promise<DailyPoint[]> {
  const from = startOfDay(new Date(Date.now() - (days - 1) * 86400000))
  const start = from.toISOString()

  const [fluids, outputs, meds] = await Promise.all([
    supabase.from('fluid_logs').select('given_at, amount_ml').gte('given_at', start),
    supabase.from('output_logs').select('logged_at, catheter_ml, potty_ml, nappy_weight_g, nappy_was_dry').gte('logged_at', start),
    supabase.from('medication_logs').select('given_at').gte('given_at', start),
  ])

  const points = new Map<string, DailyPoint>()

  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86400000)
    const key = format(d, 'yyyy-MM-dd')
    points.set(key, { date: key, label: format(d, 'EEE d MMM'), fluidMl: 0, cathyMl: 0, pottyMl: 0, nappyMl: 0, meds: 0 })
  }

  for (const f of fluids.data || []) {
    const key = f.given_at.slice(0, 10)
    const p = points.get(key)
    if (p) p.fluidMl += f.amount_ml || 0
  }
  for (const o of outputs.data || []) {
    const key = o.logged_at.slice(0, 10)
    const p = points.get(key)
    if (p) {
      p.cathyMl += o.catheter_ml || 0
      p.pottyMl += o.potty_ml || 0
      if (!o.nappy_was_dry && o.nappy_weight_g) p.nappyMl += Math.max(0, o.nappy_weight_g - 50)
    }
  }
  for (const m of meds.data || []) {
    const key = m.given_at.slice(0, 10)
    const p = points.get(key)
    if (p) p.meds += 1
  }

  return Array.from(points.values())
}
