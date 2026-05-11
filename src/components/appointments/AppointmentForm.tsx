import { useState, useEffect } from 'react'
import {
  getMedicalStaff, createAppointment, updateAppointment, getAddressesForAppointment,
} from '../../lib/appointments'
import { useAuth } from '../../hooks/useAuth'
import { toLocalIso, fromLocalIso } from '../../utils'
import { Field, Input, Select, SubmitButton } from '../ui/FormElements'
import { ChipGroup } from '../ui/FormElements'
import { AddressAutocomplete, type AddressValue } from '../ui/AddressAutocomplete'
import toast from 'react-hot-toast'
import type { Appointment, MedicalStaff, SavedAddress, AppointmentMode } from '../../types'

interface Props {
  appointment?: Appointment
  onSuccess: (appt: Appointment) => void
  onCancel: () => void
}

type AddressChoice = string | 'custom' | ''   // address id, 'custom', or '' (none)

export function AppointmentForm({ appointment, onSuccess, onCancel }: Props) {
  const { carer } = useAuth()
  const [staff, setStaff] = useState<MedicalStaff[]>([])
  const [title, setTitle] = useState(appointment?.title ?? '')
  const [staffId, setStaffId] = useState(appointment?.medical_staff_id ?? '')
  const [date, setDate] = useState(
    appointment ? toLocalIso(new Date(appointment.appointment_date)) : toLocalIso()
  )
  const [mode, setMode] = useState<AppointmentMode>(appointment?.mode ?? 'in_person')
  const [duration, setDuration] = useState(
    appointment?.duration_minutes ? String(appointment.duration_minutes) : ''
  )

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [addressChoice, setAddressChoice] = useState<AddressChoice>(
    appointment?.address_id ?? (appointment?.location ? 'custom' : '')
  )
  const [customAddress, setCustomAddress] = useState<AddressValue>({
    address: appointment?.location ?? '',
    latitude: appointment?.latitude ?? null,
    longitude: appointment?.longitude ?? null,
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { getMedicalStaff().then(setStaff) }, [])

  // Load shared + (optionally) staff-specific addresses whenever staff changes
  useEffect(() => {
    getAddressesForAppointment(staffId || null)
      .then(setSavedAddresses)
      .catch(() => setSavedAddresses([]))
  }, [staffId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return
    setIsLoading(true)
    try {
      // Resolve the chosen address
      let location: string | null = null
      let addressId: string | null = null
      let latitude: number | null = null
      let longitude: number | null = null

      if (mode === 'in_person') {
        if (addressChoice === 'custom') {
          location = customAddress.address.trim() || null
          latitude = customAddress.latitude
          longitude = customAddress.longitude
        } else if (addressChoice) {
          const saved = savedAddresses.find(a => a.id === addressChoice)
          if (saved) {
            location = saved.address
            addressId = saved.id
            latitude = saved.latitude
            longitude = saved.longitude
          }
        }
      }

      const payload = {
        title: title.trim(),
        medical_staff_id: staffId || null,
        appointment_date: fromLocalIso(date),
        mode,
        location,
        address_id: addressId,
        latitude,
        longitude,
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
        <Field label='Location'>
          <div className='space-y-2'>
            {/* Saved address chips */}
            {savedAddresses.length > 0 && (
              <div className='flex flex-wrap gap-1.5'>
                {savedAddresses.map(a => (
                  <button
                    key={a.id}
                    type='button'
                    onClick={() => setAddressChoice(a.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      addressChoice === a.id
                        ? 'bg-nova-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={a.address}
                  >
                    {a.label}
                  </button>
                ))}
                <button
                  type='button'
                  onClick={() => setAddressChoice('custom')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    addressChoice === 'custom'
                      ? 'bg-nova-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  + Custom
                </button>
              </div>
            )}

            {/* Selected saved address preview */}
            {addressChoice && addressChoice !== 'custom' && (() => {
              const saved = savedAddresses.find(a => a.id === addressChoice)
              return saved ? (
                <p className='text-xs text-gray-500 px-1'>{saved.address}</p>
              ) : null
            })()}

            {/* Custom address autocomplete */}
            {(addressChoice === 'custom' || savedAddresses.length === 0) && (
              <AddressAutocomplete
                value={customAddress.address}
                onChange={v => { setCustomAddress(v); setAddressChoice('custom') }}
                placeholder={savedAddresses.length > 0 ? 'Enter a custom address…' : 'Start typing an address…'}
              />
            )}
          </div>
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
