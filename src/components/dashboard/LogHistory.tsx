import { useState, useEffect, useCallback } from 'react'
import { getEntriesForRange } from '../../lib/db'
import { Timeline } from './Timeline'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../lib/permissions'
import { format, subDays, startOfDay } from 'date-fns'
import { Download } from 'lucide-react'
import type { LogEntry, MedicationLog, FluidLog, OutputLog, GeneralNote } from '../../types'

function exportToCSV(entries: LogEntry[]) {
  const rows: string[][] = [
    ['Date', 'Time', 'Type', 'Detail', 'Amount/Dose', 'Notes', 'Logged by'],
  ]

  for (const e of entries) {
    const date = format(new Date(e.time), 'yyyy-MM-dd')
    const time = format(new Date(e.time), 'HH:mm')
    const carer = (e.data.carer as { name: string } | undefined)?.name ?? ''

    if (e.type === 'medication') {
      const d = e.data as MedicationLog
      rows.push([date, time, 'Medication', d.medication_name, d.dose_given, d.notes ?? '', carer])
    } else if (e.type === 'fluid') {
      const d = e.data as FluidLog
      rows.push([date, time, 'Fluid', d.fluid_type, `${d.amount_ml}ml`, d.notes ?? '', carer])
    } else if (e.type === 'output') {
      const d = e.data as OutputLog
      const detail = [
        d.catheter_ml ? `Cathy ${d.catheter_ml}ml` : '',
        d.potty_ml ? `Potty ${d.potty_ml}ml` : '',
        d.nappy_was_dry ? 'Nappy dry' : d.nappy_weight_g ? `Nappy ${d.nappy_weight_g}g` : '',
      ].filter(Boolean).join(', ')
      rows.push([date, time, 'Output', detail, '', d.notes ?? '', carer])
    } else if (e.type === 'note') {
      const d = e.data as GeneralNote
      rows.push([date, time, 'Note', d.category, d.content, '', carer])
    }
  }

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nova-care-log-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

type Period = 'today' | '7d' | '30d' | 'all'
type TypeFilter = 'all' | 'medication' | 'fluid' | 'output' | 'note'

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All time' },
]

const TYPE_FILTERS: { id: TypeFilter; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '📋' },
  { id: 'medication', label: 'Meds', emoji: '💊' },
  { id: 'fluid', label: 'Fluids', emoji: '💧' },
  { id: 'output', label: 'Output', emoji: '📊' },
  { id: 'note', label: 'Notes', emoji: '📝' },
]

function periodToFrom(period: Period): Date | undefined {
  if (period === 'all') return undefined
  if (period === 'today') return startOfDay(new Date())
  if (period === '7d') return subDays(new Date(), 7)
  if (period === '30d') return subDays(new Date(), 30)
}

function groupByDate(entries: LogEntry[]): { date: string; label: string; entries: LogEntry[] }[] {
  const map = new Map<string, LogEntry[]>()
  for (const entry of entries) {
    const key = format(new Date(entry.time), 'yyyy-MM-dd')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(entry)
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    date: key,
    label: format(new Date(key + 'T12:00:00'), 'EEE d MMM yyyy'),
    entries: items,
  }))
}

interface LogHistoryProps {
  onEdit?: (entry: LogEntry) => void
  initialTypeFilter?: string
}

export function LogHistory({ onEdit, initialTypeFilter }: LogHistoryProps) {
  const { carer } = useAuth()
  const [period, setPeriod] = useState<Period>('7d')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    (initialTypeFilter as TypeFilter | undefined) ?? 'all'
  )
  const [allEntries, setAllEntries] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  useEffect(() => {
    setIsLoading(true)
    getEntriesForRange(periodToFrom(period))
      .then(setAllEntries)
      .finally(() => setIsLoading(false))
  }, [period, refreshKey])

  const filtered = typeFilter === 'all'
    ? allEntries
    : allEntries.filter(e => e.type === typeFilter)

  const groups = groupByDate(filtered)
  const canDelete = can.deleteEntry(carer?.role)
  const canExport = can.exportData(carer?.role)

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex gap-1.5 flex-wrap">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              period === p.id
                ? 'bg-nova-100 text-nova-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPE_FILTERS.map(t => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              typeFilter === t.id
                ? 'bg-nova-100 text-nova-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Export */}
      {!isLoading && filtered.length > 0 && canExport && (
        <div className="flex justify-end">
          <button
            onClick={() => exportToCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm">No entries found</p>
          <p className="text-xs mt-1">Try a different filter or time range</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(group => (
            <div key={group.date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {group.label}
                <span className="ml-2 font-normal normal-case">
                  {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </p>
              <Timeline
                entries={group.entries}
                isLoading={false}
                onRefresh={refresh}
                canDelete={canDelete}
                onEdit={onEdit && canDelete ? onEdit : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
