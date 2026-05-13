import { useState, useEffect } from 'react'
import { getAllLogsData } from '../../lib/db'
import { NAPPY_TARE_G } from '../../utils'
import { buildDays, buildBladderBlocksForDay, type DayBlock, type BladderBlock } from '../../lib/dailyBlocks'
import { format } from 'date-fns'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Timeline } from './Timeline'

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
          Daily totals. Tap a day to see what accumulated between each bladder emptying.
          Nappy tare ({NAPPY_TARE_G}g) subtracted from gross weight.
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

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                  <ExpandedDay day={day} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Expanded view: entries grouped between bladder emptyings
// ============================================================

function ExpandedDay({ day }: { day: DayBlock }) {
  const blocks = buildBladderBlocksForDay(day)
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <BladderBlockSection key={i} block={block} />
      ))}
    </div>
  )
}

function BladderBlockSection({ block }: { block: BladderBlock }) {
  const totalOut = block.cathyMl + block.pottyMl + block.nappyMl

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      {/* Sub-block header */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        {block.closingCathy ? (
          <p className="text-sm font-semibold text-gray-700">
            🩺 Bladder emptied · {block.cathyMl}ml
            <span className="text-xs font-normal text-gray-400 ml-1.5">
              at {format(new Date(block.closingCathy.logged_at), 'h:mm a')}
            </span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-gray-500">
            Since last emptying
          </p>
        )}
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {block.startedAt
            ? `since ${format(new Date(block.startedAt), 'h:mm a')}`
            : block.closingCathy ? 'start of day' : ''}
        </span>
      </div>

      {/* Block totals */}
      {(block.fluidInMl > 0 || totalOut - block.cathyMl > 0 || block.dryNappies > 0) && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-3 px-1">
          {block.fluidInMl > 0 && (
            <span className="text-xs text-blue-500 font-medium">In: {block.fluidInMl}ml</span>
          )}
          {block.pottyMl > 0 && (
            <span className="text-xs text-gray-500">🪣 {block.pottyMl}ml</span>
          )}
          {block.nappyMl > 0 && (
            <span className="text-xs text-gray-500">🩲 ~{block.nappyMl}ml</span>
          )}
          {block.dryNappies > 0 && (
            <span className="text-xs text-gray-500">🩲 {block.dryNappies} dry</span>
          )}
        </div>
      )}

      {/* Entries in this window */}
      {block.entries.length === 0 ? (
        <p className="text-xs text-gray-400 italic px-1">No entries in this window.</p>
      ) : (
        <Timeline entries={block.entries} isLoading={false} onRefresh={() => {}} canDelete={false} />
      )}
    </div>
  )
}
