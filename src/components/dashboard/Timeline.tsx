import { formatTime } from '../../utils'
import type { LogEntry } from '../../types'
import { Pill, Droplets, Activity, FileText, Trash2, Pencil } from 'lucide-react'
import { deleteEntry } from '../../lib/db'
import toast from 'react-hot-toast'

interface TimelineProps {
  entries: LogEntry[]
  isLoading: boolean
  onRefresh: () => void
  canDelete: boolean
  onEdit?: (entry: LogEntry) => void
}

export function Timeline({ entries, isLoading, onRefresh, canDelete, onEdit }: TimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0,1,2].map(i => (
          <div key={i} className="bg-gray-100 rounded-2xl h-16 animate-pulse" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-4xl mb-2">📋</p>
        <p className="text-sm">No entries yet today</p>
        <p className="text-xs mt-1">Use the buttons below to log</p>
      </div>
    )
  }

  async function handleDelete(entry: LogEntry) {
    const tableMap = {
      medication: 'medication_logs' as const,
      fluid: 'fluid_logs' as const,
      output: 'output_logs' as const,
      note: 'general_notes' as const,
    }
    try {
      await deleteEntry(tableMap[entry.type], entry.data.id)
      toast.success('Entry deleted')
      onRefresh()
    } catch {
      toast.error('Failed to delete entry')
    }
  }

  return (
    <div className="space-y-2">
      {entries.map(entry => (
        <TimelineEntry
          key={`${entry.type}-${entry.data.id}`}
          entry={entry}
          onDelete={canDelete ? () => handleDelete(entry) : undefined}
          onEdit={onEdit ? () => onEdit(entry) : undefined}
        />
      ))}
    </div>
  )
}

function TimelineEntry({
  entry, onDelete, onEdit,
}: {
  entry: LogEntry
  onDelete?: () => void
  onEdit?: () => void
}) {
  const config = getEntryConfig(entry)

  return (
    <div className={`flex gap-3 p-3 rounded-2xl border ${config.bg} ${config.border} animate-fade-in`}>
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
        <config.Icon size={16} className={config.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{config.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{config.detail}</p>
            {('notes' in entry.data) && entry.data.notes && (
              <p className="text-xs text-gray-400 mt-1 italic leading-tight">"{entry.data.notes}"</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-gray-400 font-medium">{formatTime(entry.time)}</span>
            {onEdit && (
              <button onClick={onEdit} className="p-1 text-gray-300 hover:text-nova-500 transition-colors">
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Carer tag */}
        {entry.data.carer && (
          <div className="flex items-center gap-1 mt-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: (entry.data.carer as { color: string }).color }}
            />
            <span className="text-xs text-gray-400">{(entry.data.carer as { name: string }).name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function getEntryConfig(entry: LogEntry) {
  switch (entry.type) {
    case 'medication':
      return {
        Icon: Pill,
        title: entry.data.medication_name,
        detail: `${entry.data.dose_given}`,
        bg: 'bg-purple-50',
        border: 'border-purple-100',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      }
    case 'fluid':
      return {
        Icon: Droplets,
        title: `${entry.data.amount_ml}ml fluid`,
        detail: entry.data.fluid_type.charAt(0).toUpperCase() + entry.data.fluid_type.slice(1),
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      }
    case 'output': {
      const parts: string[] = []
      if (entry.data.nappy_was_dry) parts.push('Nappy dry')
      else if (entry.data.nappy_weight_g) parts.push(`Nappy ${entry.data.nappy_weight_g}g`)
      if (entry.data.catheter_ml) parts.push(`Cathy ${entry.data.catheter_ml}ml`)
      if (entry.data.potty_ml) parts.push(`Potty ${entry.data.potty_ml}ml`)
      return {
        Icon: Activity,
        title: 'Output check',
        detail: parts.join(' · ') || 'Checked',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      }
    }
    case 'note':
      return {
        Icon: FileText,
        title: 'Note',
        detail: entry.data.content.length > 80
          ? entry.data.content.slice(0, 80) + '…'
          : entry.data.content,
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      }
  }
}
