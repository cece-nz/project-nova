import { useState, useEffect, useRef } from 'react'
import {
  getAppointmentNotes, createAppointmentNote, deleteAppointmentNote,
  getAppointmentActions, createAppointmentAction, toggleAppointmentAction, deleteAppointmentAction,
  getAppointmentDocuments, uploadAppointmentDocument, deleteAppointmentDocument, getDocumentUrl,
  updateAppointment,
} from '../../lib/appointments'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../lib/permissions'
import { format } from 'date-fns'
import {
  Phone, MapPin, Calendar, Clock, ArrowLeft, Plus, Trash2,
  CheckCircle, Circle, FileText, MessageSquare, User, Paperclip,
  CheckSquare, Pencil,
} from 'lucide-react'
import { Textarea } from '../ui/FormElements'
import { AppointmentForm } from './AppointmentForm'
import toast from 'react-hot-toast'
import type { Appointment, AppointmentNote, AppointmentAction, AppointmentDocument } from '../../types'

type DetailTab = 'shared' | 'person' | 'documents' | 'actions'

interface Props {
  appointment: Appointment
  onBack: () => void
  onUpdated: (appt: Appointment) => void
}

export function AppointmentDetail({ appointment: initial, onBack, onUpdated }: Props) {
  const { carer } = useAuth()
  const [appt, setAppt] = useState(initial)
  const [tab, setTab] = useState<DetailTab>('shared')
  const [editing, setEditing] = useState(false)

  const isAdmin = can.manageAppointments(carer?.role)
  const canDetail = can.viewAppointmentDetail(carer?.role)

  const handleUpdated = (updated: Appointment) => {
    setAppt(updated)
    onUpdated(updated)
    setEditing(false)
  }

  if (editing && isAdmin) {
    return (
      <div>
        <button onClick={() => setEditing(false)} className='flex items-center gap-1 text-sm text-nova-600 font-medium mb-4'>
          <ArrowLeft size={14} /> Back to appointment
        </button>
        <AppointmentForm appointment={appt} onSuccess={handleUpdated} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  const staffName = appt.medical_staff?.name
  const staffSub = appt.medical_staff?.specialty ?? appt.medical_staff?.type ?? ''
  const apptDate = new Date(appt.appointment_date)

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'shared', label: 'Shared notes', icon: MessageSquare },
    { id: 'person', label: 'Person notes', icon: User },
    { id: 'documents', label: 'Documents', icon: Paperclip },
    { id: 'actions', label: 'Actions', icon: CheckSquare },
  ]

  const visibleTabs = canDetail ? tabs : tabs.filter(t => t.id === 'shared' || t.id === 'documents')

  return (
    <div className='space-y-4'>
      {/* Back */}
      <button onClick={onBack} className='flex items-center gap-1 text-sm text-nova-600 font-medium'>
        <ArrowLeft size={14} /> All appointments
      </button>

      {/* Header card */}
      <div className='bg-white rounded-2xl border border-gray-100 p-4 space-y-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <h2 className='font-bold text-gray-900 text-base leading-tight'>{appt.title}</h2>
            {staffName && (
              <p className='text-sm text-gray-500 mt-0.5'>
                {staffName}{staffSub ? ` · ${staffSub}` : ''}
              </p>
            )}
          </div>
          {isAdmin && (
            <button onClick={() => setEditing(true)} className='shrink-0 p-1.5 text-gray-400 hover:text-nova-600'>
              <Pencil size={15} />
            </button>
          )}
        </div>

        <div className='flex flex-wrap gap-3 text-sm text-gray-600'>
          <span className='flex items-center gap-1.5'>
            <Calendar size={13} className='text-gray-400' />
            {format(apptDate, 'EEE d MMM yyyy')}
          </span>
          <span className='flex items-center gap-1.5'>
            <Clock size={13} className='text-gray-400' />
            {format(apptDate, 'h:mm a')}
            {appt.duration_minutes ? ` (${appt.duration_minutes} min)` : ''}
          </span>
          {appt.mode === 'telephone' ? (
            <span className='flex items-center gap-1.5'>
              <Phone size={13} className='text-gray-400' /> Telephone
            </span>
          ) : (
            <span className='flex items-center gap-1.5'>
              <MapPin size={13} className='text-gray-400' />
              {appt.location || 'In person'}
            </span>
          )}
        </div>

        {isAdmin && (
          <StatusSelector appt={appt} onUpdate={updated => { setAppt(updated); onUpdated(updated) }} />
        )}
      </div>

      {/* Section tabs */}
      <div className='flex gap-1 overflow-x-auto'>
        {visibleTabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-nova-100 text-nova-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={12} />{t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {(tab === 'shared' || tab === 'person') && (
        <NotesSection
          appointmentId={appt.id}
          noteType={tab}
          canAdd={canDetail}
          canDelete={isAdmin}
        />
      )}
      {tab === 'documents' && (
        <DocumentsSection appointmentId={appt.id} canUpload={isAdmin} carerId={carer?.id} />
      )}
      {tab === 'actions' && canDetail && (
        <ActionsSection
          appointmentId={appt.id}
          canAdd={canDetail}
          canDelete={isAdmin}
          carerId={carer?.id}
        />
      )}
    </div>
  )
}

// ── Status selector ──────────────────────────────────────────

function StatusSelector({ appt, onUpdate }: { appt: Appointment; onUpdate: (a: Appointment) => void }) {
  const options: Appointment['status'][] = ['upcoming', 'completed', 'cancelled']
  const colors: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  const handleChange = async (status: Appointment['status']) => {
    try {
      const updated = await updateAppointment(appt.id, { status })
      onUpdate(updated)
    } catch { toast.error('Failed to update status') }
  }

  return (
    <div className='flex gap-2'>
      {options.map(s => (
        <button
          key={s}
          type='button'
          onClick={() => handleChange(s)}
          className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
            appt.status === s ? colors[s] : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// ── Notes section ────────────────────────────────────────────

function NotesSection({
  appointmentId, noteType, canAdd, canDelete,
}: { appointmentId: string; noteType: 'shared' | 'person'; canAdd: boolean; canDelete: boolean }) {
  const { carer } = useAuth()
  const [notes, setNotes] = useState<AppointmentNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getAppointmentNotes(appointmentId).then(all => setNotes(all.filter(n => n.note_type === noteType)))
  }, [appointmentId, noteType])

  const handleAdd = async () => {
    if (!newNote.trim() || !carer) return
    setIsSaving(true)
    try {
      const note = await createAppointmentNote(appointmentId, noteType, newNote.trim(), carer.id)
      setNotes(prev => [...prev, note])
      setNewNote('')
    } catch { toast.error('Failed to add note') }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointmentNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch { toast.error('Failed to delete note') }
  }

  return (
    <div className='space-y-3'>
      {notes.length === 0 && (
        <div className='bg-gray-50 rounded-2xl p-4 text-sm text-gray-400 italic text-center'>
          No {noteType === 'shared' ? 'shared' : 'person'} notes yet.
        </div>
      )}
      {notes.map(note => (
        <div key={note.id} className='bg-white rounded-2xl border border-gray-100 p-4'>
          <div className='flex items-start justify-between gap-2'>
            <p className='text-sm text-gray-800 whitespace-pre-wrap flex-1'>{note.content}</p>
            {canDelete && (
              <button onClick={() => handleDelete(note.id)} className='shrink-0 p-1 text-gray-300 hover:text-red-400'>
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <div className='flex items-center gap-2 mt-2'>
            {note.author && (
              <div className='w-3 h-3 rounded-full' style={{ backgroundColor: note.author.color }} />
            )}
            <span className='text-xs text-gray-400'>
              {note.author?.name ?? 'Unknown'} · {format(new Date(note.created_at), 'd MMM, h:mm a')}
            </span>
          </div>
        </div>
      ))}

      {canAdd && (
        <div className='space-y-2'>
          <Textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder={`Add a ${noteType === 'shared' ? 'shared' : 'person'} note…`}
            rows={3}
          />
          <button
            type='button'
            onClick={handleAdd}
            disabled={!newNote.trim() || isSaving}
            className='flex items-center gap-1.5 text-sm font-semibold text-nova-600 disabled:opacity-40'
          >
            <Plus size={14} /> {isSaving ? 'Saving…' : 'Add note'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Documents section ────────────────────────────────────────

function DocumentsSection({
  appointmentId, canUpload, carerId,
}: { appointmentId: string; canUpload: boolean; carerId?: string }) {
  const [docs, setDocs] = useState<AppointmentDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { getAppointmentDocuments(appointmentId).then(setDocs) }, [appointmentId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !carerId) return
    setIsUploading(true)
    try {
      const doc = await uploadAppointmentDocument(appointmentId, file, carerId)
      setDocs(prev => [...prev, doc])
      toast.success(`${file.name} uploaded`)
    } catch { toast.error('Upload failed — ensure the "appointment-docs" bucket exists in Supabase Storage') }
    finally { setIsUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const handleOpen = async (doc: AppointmentDocument) => {
    try {
      const url = await getDocumentUrl(doc.storage_path)
      window.open(url, '_blank')
    } catch { toast.error('Could not open document') }
  }

  const handleDelete = async (doc: AppointmentDocument) => {
    try {
      await deleteAppointmentDocument(doc.id, doc.storage_path)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
    } catch { toast.error('Failed to delete') }
  }

  const fmtSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className='space-y-3'>
      {docs.length === 0 && (
        <div className='bg-gray-50 rounded-2xl p-4 text-sm text-gray-400 italic text-center'>
          No documents uploaded yet.
        </div>
      )}
      {docs.map(doc => (
        <div key={doc.id} className='bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3'>
          <div className='w-9 h-9 rounded-xl bg-nova-50 flex items-center justify-center flex-shrink-0'>
            <FileText size={16} className='text-nova-500' />
          </div>
          <div className='flex-1 min-w-0'>
            <button onClick={() => handleOpen(doc)} className='text-sm font-medium text-nova-600 hover:underline truncate block text-left'>
              {doc.filename}
            </button>
            <p className='text-xs text-gray-400'>
              {fmtSize(doc.size_bytes)}{doc.uploader ? ` · ${doc.uploader.name}` : ''} · {format(new Date(doc.created_at), 'd MMM')}
            </p>
          </div>
          {canUpload && (
            <button onClick={() => handleDelete(doc)} className='shrink-0 p-1 text-gray-300 hover:text-red-400'>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}

      {canUpload && (
        <div>
          <input ref={fileRef} type='file' className='hidden' onChange={handleFileChange} />
          <button
            type='button'
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className='flex items-center gap-1.5 text-sm font-semibold text-nova-600 disabled:opacity-40'
          >
            <Plus size={14} /> {isUploading ? 'Uploading…' : 'Upload document'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Actions section ──────────────────────────────────────────

function ActionsSection({
  appointmentId, canAdd, canDelete, carerId,
}: { appointmentId: string; canAdd: boolean; canDelete: boolean; carerId?: string }) {
  const [actions, setActions] = useState<AppointmentAction[]>([])
  const [newAction, setNewAction] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { getAppointmentActions(appointmentId).then(setActions) }, [appointmentId])

  const handleAdd = async () => {
    if (!newAction.trim() || !carerId) return
    setIsSaving(true)
    try {
      const action = await createAppointmentAction(appointmentId, newAction.trim(), carerId)
      setActions(prev => [...prev, action])
      setNewAction('')
    } catch { toast.error('Failed to add action') }
    finally { setIsSaving(false) }
  }

  const handleToggle = async (action: AppointmentAction) => {
    if (!carerId) return
    try {
      const updated = await toggleAppointmentAction(action.id, !action.is_completed, carerId)
      setActions(prev => prev.map(a => a.id === updated.id ? updated : a))
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointmentAction(id)
      setActions(prev => prev.filter(a => a.id !== id))
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className='space-y-3'>
      {actions.length === 0 && (
        <div className='bg-gray-50 rounded-2xl p-4 text-sm text-gray-400 italic text-center'>
          No actions added yet.
        </div>
      )}
      {actions.map(action => (
        <div key={action.id} className='bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3'>
          <button onClick={() => handleToggle(action)} className='shrink-0'>
            {action.is_completed
              ? <CheckCircle size={20} className='text-green-500' />
              : <Circle size={20} className='text-gray-300' />
            }
          </button>
          <div className='flex-1 min-w-0'>
            <p className={`text-sm font-medium ${action.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {action.description}
            </p>
            {action.is_completed && action.completer && (
              <p className='text-xs text-gray-400'>Done by {action.completer.name}</p>
            )}
          </div>
          {canDelete && (
            <button onClick={() => handleDelete(action.id)} className='shrink-0 p-1 text-gray-300 hover:text-red-400'>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}

      {canAdd && (
        <div className='flex gap-2'>
          <input
            value={newAction}
            onChange={e => setNewAction(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            placeholder='Add an action…'
            className='flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-nova-300'
          />
          <button
            type='button' onClick={handleAdd} disabled={!newAction.trim() || isSaving}
            className='px-4 py-3 rounded-xl bg-nova-500 text-white text-sm font-semibold disabled:opacity-40'
          >
            {isSaving ? '…' : 'Add'}
          </button>
        </div>
      )}
    </div>
  )
}
