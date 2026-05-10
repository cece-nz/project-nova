import { useState, useEffect, useCallback } from 'react'
import { getAppointments, deleteAppointment, getMedicalStaff } from '../../lib/appointments'
import { can } from '../../lib/permissions'
import { useAuth } from '../../hooks/useAuth'
import { format, isPast } from 'date-fns'
import { Plus, Phone, MapPin, Calendar, ChevronRight, Trash2, Filter } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { AppointmentForm } from './AppointmentForm'
import { AppointmentDetail } from './AppointmentDetail'
import toast from 'react-hot-toast'
import type { Appointment, AppointmentStatus, MedicalStaff } from '../../types'

export function AppointmentList() {
  const { carer } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [staffList, setStaffList] = useState<MedicalStaff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [staffFilter, setStaffFilter] = useState<string>('all')

  const isAdmin = can.manageAppointments(carer?.role)

  const load = useCallback(() => {
    setIsLoading(true)
    Promise.all([
      getAppointments(statusFilter !== 'all' ? { status: statusFilter } : undefined),
      getMedicalStaff(),
    ])
      .then(([appts, staff]) => { setAppointments(appts); setStaffList(staff) })
      .finally(() => setIsLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const filtered = staffFilter === 'all'
    ? appointments
    : appointments.filter(a => a.medical_staff_id === staffFilter)

  const handleDelete = async (appt: Appointment) => {
    try {
      await deleteAppointment(appt.id)
      setAppointments(prev => prev.filter(a => a.id !== appt.id))
      toast.success('Appointment deleted')
    } catch { toast.error('Failed to delete') }
  }

  if (selected) {
    return (
      <AppointmentDetail
        appointment={selected}
        onBack={() => setSelected(null)}
        onUpdated={updated => setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a))}
      />
    )
  }

  return (
    <div className='space-y-4'>
      {/* Toolbar */}
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-semibold text-gray-500 uppercase tracking-wide'>Appointments</h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className='flex items-center gap-1.5 px-3 py-2 rounded-xl bg-nova-500 text-white text-sm font-semibold active:scale-95 transition-all'
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {/* Filters */}
      <div className='space-y-2'>
        <div className='flex gap-2 overflow-x-auto pb-1'>
          {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === s ? 'bg-nova-100 text-nova-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {staffList.length > 0 && (
          <div className='flex items-center gap-2'>
            <Filter size={12} className='text-gray-400 flex-shrink-0' />
            <div className='flex gap-2 overflow-x-auto pb-1'>
              <button
                onClick={() => setStaffFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  staffFilter === 'all' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                All staff
              </button>
              {staffList.map(s => (
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
          </div>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className='space-y-3'>
          {[0,1,2].map(i => <div key={i} className='bg-gray-100 rounded-2xl h-20 animate-pulse' />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className='text-center py-10 text-gray-400'>
          <p className='text-4xl mb-2'>📅</p>
          <p className='text-sm'>No appointments found</p>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className='mt-3 text-nova-600 text-sm font-semibold'>
              Add one →
            </button>
          )}
        </div>
      ) : (
        <div className='space-y-2'>
          {filtered.map(appt => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onSelect={() => setSelected(appt)}
              onDelete={isAdmin ? () => handleDelete(appt) : undefined}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title='📅 New appointment'>
        <AppointmentForm
          onSuccess={appt => { setAppointments(prev => [appt, ...prev]); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}

function AppointmentCard({
  appointment: appt, onSelect, onDelete,
}: { appointment: Appointment; onSelect: () => void; onDelete?: () => void }) {
  const apptDate = new Date(appt.appointment_date)
  const isToday = format(apptDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  const overdue = appt.status === 'upcoming' && isPast(apptDate) && !isToday

  const statusColor: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  return (
    <div
      className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${
        overdue ? 'border-amber-200' : 'border-gray-100'
      }`}
    >
      {/* Date column */}
      <div className='w-12 flex-shrink-0 text-center'>
        <p className='text-xs text-gray-400 font-medium uppercase'>{format(apptDate, 'MMM')}</p>
        <p className='text-xl font-bold text-gray-800 leading-tight'>{format(apptDate, 'd')}</p>
        <p className='text-xs text-gray-400'>{format(apptDate, 'EEE')}</p>
      </div>

      {/* Main content */}
      <div className='flex-1 min-w-0' onClick={onSelect} role='button'>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-semibold text-gray-800 truncate'>{appt.title}</p>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[appt.status]}`}>
            {appt.status}
          </span>
        </div>
        {appt.medical_staff && (
          <p className='text-xs text-gray-500 truncate mt-0.5'>{appt.medical_staff.name}</p>
        )}
        <div className='flex items-center gap-3 mt-1'>
          <span className='flex items-center gap-1 text-xs text-gray-400'>
            <Calendar size={11} /> {format(apptDate, 'h:mm a')}
          </span>
          <span className='flex items-center gap-1 text-xs text-gray-400'>
            {appt.mode === 'telephone'
              ? <><Phone size={11} /> Telephone</>
              : <><MapPin size={11} /> {appt.location || 'In person'}</>
            }
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className='flex items-center gap-1 flex-shrink-0'>
        {onDelete && (
          <button onClick={e => { e.stopPropagation(); onDelete() }} className='p-1.5 text-gray-300 hover:text-red-400'>
            <Trash2 size={14} />
          </button>
        )}
        <button onClick={onSelect} className='p-1.5 text-gray-300'>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
