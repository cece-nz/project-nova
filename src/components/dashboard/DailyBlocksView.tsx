import { useState, useEffect } from 'react'
import { getAllLogsData } from '../../lib/db'
import { NAPPY_TARE_G } from '../../utils'
import { format } from 'date-fns'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Timeline } from './Timeline'
import type { FluidLog, OutputLog, MedicationLog, GeneralNote, LogEntry } from '../../types'

interface DayBlock {
  date: string         // 'yyyy-MM-dd'
  label: string        // 'Mon 13 May 2026'
  cathyMl: number
  pottyMl: number
  nappyMl: number
  cathyCount: number
  dryNappies: number
  fluidInMl: number
  fluidEntries: number
  medsGiven: number
  entries: LogEntry[]
}

function dayKey(iso: string): string {
  return iso.slice(0, 10) // 'yyyy-MM-dd'
}

function buildDays(
  fluidLogs: FluidLog[],
  outputLogs: OutputLog[],
  medLogs: MedicationLog[],
  notes: GeneralNote[],
): DayBlock[] {
  const map = new Map<string, DayBlock>()

  const getDay = (key: string): DayBlock => {
    let day = map.get(key)
    if (!day) {
      day = {
        date: key,
        label: format(new Date(key + 'T12:00:00'), 'EEE d MMM yyyy'),
        cathyMl: 0, pottyMl: 0, nappyMl: 0,
        cathyCount: 0, dryNappies: 0,
        fluidInMl: 0, fluidEntries: 0, medsGiven: 0,
        entries: [],
      }
      map.set(key, day)
    }
    return day
  }

  for (const f of fluidLogs) {
    const day = getDay(dayKey(f.given_at))
    day.fluidInMl += f.amount_ml ?? 0
    day.fluidEntries += 1
    day.entries.push({ type: 'fluid', data: f, time: f.given_at })
  }
  for (const o of outputLogs) {
    const day = getDay(dayKey(o.logged_at))
    if ((o.catheter_ml ?? 0) > 0) {
      day.cathyMl += o.catheter_ml ?? 0
      day.cathyCount += 1
    }
    day.pottyMl += o.potty_ml ?? 0
    if (o.nappy_was_dry) {
      day.dryNappies += 1
    } else if (o.nappy_weight_g != null) {
      day.nappyMl += Math.max(0, o.nappy_weight_g - NAPPY_TARE_G)
    }
    day.entries.push({ type: 'output', data: o, time: o.logged_at })
  }
  for (const m of medLogs) {
    const day = getDay(dayKey(m.given_at))
    day.medsGiven += 1
    day.entries.push({ type: 'medication', data: m, time: m.given_at })
  }
  for (const n of notes) {
    const day = getDay(dayKey(n.noted_at))
    day.entries.push({ type: 'note', data: n, time: n.noted_at })
  }

  // Sort entries newest-first within each day
  for (const day of map.values()) {
    day.entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  }

  // Sort days newest-first
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
}

export function DailyBlocksView() {
  const [days, setDays] = useState<DayBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  useEffect(() => {
    getAllLogsData()
      .then(({ fluidLogs, outputLogs, medLogs, notes }) => {
        setDays(buildDays(fluidLogs, outputLogs, medLogs, notes))
      })
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0,1,2].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />)}
      </div>
    )
  }

  if (days.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-400">
        <p className="text-2xl mb-2">📅</p>
        <p className="text-sm">No entries logged yet.</p>
        <p className="text-xs mt-1">Each day will appear here as a tally.</p>
      </div>
    )
  }

  const todayKey = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
        <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-600">
          Daily totals. Nappy tare ({NAPPY_TARE_G}g) subtracted from gross weight. Tap a day to see all entries.
        </p>
      </div>

      <div className="space-y-3">
        {days.map(day => {
          const totalOut = day.cathyMl + day.pottyMl + day.nappyMl
          const isToday = day.date === todayKey
          const isExpanded = expandedDate === day.date

          return (
            <div
              key={day.date}
              className={`bg-white rounded-2xl border transition-all ${isToday ? 'border-nova-200 ring-1 ring-nova-100' : 'border-gray-100'}`}
            >
              <button
                className="w-full text-left p-4"
                onClick={() => setExpandedDate(isExpanded ? null : day.date)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-nova-600' : 'text-gray-400'}`}>
                      {isToday ? 'Today' : day.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'}
                      {day.medsGiven > 0 ? ` · ${day.medsGiven} med${day.medsGiven !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <span className="text-gray-300">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>

                {/* Output first, fluid second */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-xs text-emerald-500 font-medium mb-1">Total out</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {totalOut}<span className="text-xs font-normal text-emerald-400 ml-0.5">ml</span>
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-500 font-medium mb-1">Fluid in</p>
                    <p className="text-xl font-bold text-blue-700">
                      {day.fluidInMl}<span className="text-xs font-normal text-blue-400 ml-0.5">ml</span>
                    </p>
                  </div>
                </div>

                {/* Breakdown chips */}
                {(totalOut > 0 || day.dryNappies > 0 || day.fluidEntries > 0) && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
                    {day.cathyMl > 0 && (
                      <span className="text-xs text-gray-400">
                        🩺 Cathy {day.cathyMl}ml{day.cathyCount > 1 ? ` (×${day.cathyCount})` : ''}
                      </span>
                    )}
                    {day.pottyMl > 0 && (
                      <span className="text-xs text-gray-400">🪣 Potty {day.pottyMl}ml</span>
                    )}
                    {day.nappyMl > 0 && (
                      <span className="text-xs text-gray-400">🩲 Nappy ~{day.nappyMl}ml</span>
                    )}
                    {day.dryNappies > 0 && (
                      <span className="text-xs text-gray-400">🩲 {day.dryNappies} dry</span>
                    )}
                    {day.fluidEntries > 0 && (
                      <span className="text-xs text-gray-400">💧 {day.fluidEntries} drinks</span>
                    )}
                  </div>
                )}
              </button>

              {/* Expanded entries */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    All entries
                  </p>
                  <Timeline
                    entries={day.entries}
                    isLoading={false}
                    onRefresh={() => {}}
                    canDelete={false}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
