import { useState, useEffect } from 'react'
import { getUpcomingAppointments } from '../../lib/appointments'
import { differenceInCalendarDays, format, isToday } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import type { Appointment } from '../../types'

interface AppointmentsWidgetProps {
  onClick: () => void
}

export function AppointmentsWidget({ onClick }: AppointmentsWidgetProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getUpcomingAppointments()
      .then(setAppointments)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <div className="bg-gray-100 rounded-2xl h-16 animate-pulse" />
  }

  const next = appointments[0]
  const daysUntil = next ? differenceInCalendarDays(new Date(next.appointment_date), new Date()) : null

  const daysLabel = daysUntil === null
    ? null
    : isToday(new Date(next!.appointment_date))
    ? 'Today!'
    : daysUntil === 1
    ? 'Tomorrow'
    : `in ${daysUntil} days`

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 text-left active:scale-95 transition-all hover:border-nova-200"
    >
      <div className="w-10 h-10 rounded-xl bg-nova-50 flex items-center justify-center flex-shrink-0">
        <CalendarDays size={18} className="text-nova-500" />
      </div>

      <div className="flex-1 min-w-0">
        {appointments.length === 0 ? (
          <p className="text-sm font-medium text-gray-400">No upcoming appointments</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-800">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} booked
            </p>
            <p className="text-xs text-gray-400 truncate">
              Next: {next!.title} · {daysLabel}
              {daysUntil !== null && daysUntil > 1 ? ` · ${format(new Date(next!.appointment_date), 'd MMM')}` : ''}
            </p>
          </>
        )}
      </div>

      <span className="text-gray-300 text-xs flex-shrink-0">→</span>
    </button>
  )
}
