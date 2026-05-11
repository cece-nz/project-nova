import { useState, useEffect } from 'react'
import { getMedicalStaff, createAppointment, updateAppointment } from '../../lib/appointments'
import { useAuth } from '../../hooks/useAuth'
import { toLocalIso, fromLocalIso } from '../../utils'
import { Field, Input, Select, SubmitButton } from '../ui/FormElements'
import { ChipGroup } from '../ui/FormElements'
import toast from 'react-hot-toast'
import type { Appointment, MedicalStaff, AppointmentMode } from '../../types'

interface Props {
  appointment?: Appointment
  onSuccess: (appt: Appointment) => void
  onCancel: () => void
}

export function AppointmentForm({ appointment, onSuccess, onCancel }: Props) {
  const { carer } = useAuth()
  const [staff, setStaff] = useState<MedicalStaff[]>([])
  const [title, setTitle] = useState(appointment?.title ?? '')
  const [staffId, setStaffId] = useState(appointment?.medical_staff_id ?? '')
  const [date, setDate] = useState(
    appointment ? toLocalIso(new Date(appointment.appointment_date)) : toLocalIso()
  )
  const [mode, setMode] = useState<AppointmentMode>(appointment?.mode ?? 'in_person')
  const [location, setLocation] = useState(appointment?.location ?? '')
  const [duration, setDuration] = useState(
    appointment?.duration_minutes ? String(appointment.duration_minutes) : ''
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { getMedicalStaff().then(setStaff) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return
    setIsLoading(true)
    try {
      const payload = {
        title: title.trim(),
        medical_staff_id: staffId || null,
        appointment_date: fromLocalIso(date),
        mode,
        location: mode === 'in_person' ? (location.trim() || null) : null,
        duration_minutes: duration ? parseInt(duration) : null,
      }
      const saved = appointment
        ? await updateAppointment(appointment.id, payload)
        : await createAppointment(payload, carer.id)
      toast.success(appointment ? 'Appointment updated' : 'Appointment added')
      onSuccess(saved)
    } catch {
      toast.error('Failed to save appointment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <Field label='Title'>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder='e.g. Urology follow-up'
          required
        />
      </Field>

      <Field label='With'>
        <Select value={staffId} onChange={e => setStaffId(e.target.value)}>
          <option value=''>No specific staff member</option>
          {staff.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}{s.specialty ? ` — ${s.specialty}` : ''}
            </option>
          ))}
        </Select>
      </Field>

      <Field label='Date & time'>
        <Input
          type='datetime-local'
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </Field>

      <Field label='How'>
        <ChipGroup
          options={[
            { value: 'in_person', label: 'In person' },
            { value: 'telephone', label: 'Telephone' },
          ]}
          value={mode}
          onChange={v => setMode(v as AppointmentMode)}
        />
      </Field>

      {mode === 'in_person' && (
        <Field label='Location / address'>
          <Input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder='e.g. Clinic B, Royal Hospital'
          />
        </Field>
      )}

      <Field label='Duration (minutes, optional)'>
        <Input
          type='number'
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder='e.g. 30'
          min='1'
        />
      </Field>

      <div className='flex gap-2 pt-1'>
        <button
          type='button'
          onClick={onCancel}
          className='flex-[3] py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600'
        >
          Cancel
        </button>
        <div className='flex-[7]'>
          <SubmitButton
            isLoading={isLoading}
            label={appointment ? 'Update' : 'Add appointment'}
            loadingLabel='Saving...'
          />
        </div>
      </div>
    </form>
  )
}
