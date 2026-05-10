import { useState, useEffect } from 'react'
import { getUpcomingAppointments, getMedicalStaff } from '../../lib/appointments'
import { format, isToday, isTomorrow } from 'date-fns'
import { Phone, MapPin, Calendar } from 'lucide-react'
import type { Appointment, AppointmentMode, MedicalStaff } from '../../types'

function dateLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE d MMM')
}

export function UpcomingAppointmentsStrip() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [staffList, setStaffList] = useState<MedicalStaff[]>([])
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [modeFilter, setModeFilter] = useState<AppointmentMode | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([getUpcomingAppointments(), getMedicalStaff()])
      .then(([appts, staff]) => { setAppointments(appts); setStaffList(staff) })
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = appointments.filter(a => {
    if (staffFilter !== 'all' && a.medical_staff_id !== staffFilter) return false
    if (modeFilter !== 'all' && a.mode !== modeFilter) return false
    return true
  })

  const staffInResults = staffList.filter(s => appointments.some(a => a.medical_staff_id === s.id))

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="bg-gray-100 rounded-2xl h-16 animate-pulse" />
        <div className="bg-gray-100 rounded-2xl h-16 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Upcoming appointments</h2>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['all', 'telephone', 'in_person'] as const).map(m => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                modeFilter === m ? 'bg-nova-100 text-nova-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {m === 'all' ? 'All' : m === 'telephone' ? <><Phone size={10} /> Telephone</> : <><MapPin size={10} /> In person</>}
            </button>
          ))}
        </div>

        {staffInResults.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setStaffFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                staffFilter === 'all' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              All staff
            </button>
            {staffInResults.map(s => (
              <button
                key={s.id}
                onClick={() => setStaffFilter(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  staffFilter === s.id ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center text-sm text-gray-400">
          No upcoming appointments
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(appt => {
            const apptDate = new Date(appt.appointment_date)
            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3"
              >
                <div className="w-10 flex-shrink-0 text-center">
                  <p className="text-xs text-gray-400 font-medium uppercase leading-none">{format(apptDate, 'MMM')}</p>
                  <p className="text-xl font-bold text-gray-800 leading-tight">{format(apptDate, 'd')}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{appt.title}</p>
                  {appt.medical_staff && (
                    <p className="text-xs text-gray-500 truncate">{appt.medical_staff.name}</p>
                  )}
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={10} /> {dateLabel(apptDate)} · {format(apptDate, 'h:mm a')}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {appt.mode === 'telephone' ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                      <Phone size={10} /> Tel
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                      <MapPin size={10} /> {appt.location ? appt.location.split(' ')[0] : 'In person'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
