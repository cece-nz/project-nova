import type { CarerRole } from '../types'

// Admin: everything.
// Medical: read-only. Sees appointments, shared notes, documents.
// Helper: can add output/fluid/med-log/note. Sees appointments (basic info only).

export const can = {
  logEntry: (role: CarerRole | undefined) => role === 'admin' || role === 'helper',
  deleteEntry: (role: CarerRole | undefined) => role === 'admin',
  editDailySummary: (role: CarerRole | undefined) => role === 'admin',
  manageAdmin: (role: CarerRole | undefined) => role === 'admin',
  manageAppointments: (role: CarerRole | undefined) => role === 'admin',
  viewAppointmentDetail: (role: CarerRole | undefined) => role === 'admin' || role === 'medical',
  manageMedicalStaff: (role: CarerRole | undefined) => role === 'admin',
}

export const ROLE_LABEL: Record<CarerRole, string> = {
  admin: 'Admin',
  medical: 'Medical',
  helper: 'Helper',
}
