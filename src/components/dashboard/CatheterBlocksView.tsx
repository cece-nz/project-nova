import { useState, useEffect } from 'react'
import { getCatheterBlockData } from '../../lib/db'
import { NAPPY_TARE_G } from '../../utils'
import { format, formatDistanceStrict } from 'date-fns'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Timeline } from './Timeline'
import type { FluidLog, OutputLog, MedicationLog, GeneralNote, LogEntry } from '../../types'

interface Block {
  startedAt: string
  endedAt: string | null
  isCurrent: boolean
  catheterMl: number
  fluidInMl: number
  extraCatheterMl: number
  pottyMl: number
  nappyMl: number
  dryNappies: number
  entries: LogEntry[]
}

function buildBlocks(
  catheterLogs: OutputLog[],
  allFluidLogs: FluidLog[],
  allOutputLogs: OutputLog[],
  allMedLogs: MedicationLog[],
  allNotes: GeneralNote[],
): Block[] {
  if (catheterLogs.length === 0) return []

  return catheterLogs.map((cathLog, i): Block => {
    const start = cathLog.logged_at
    const end = catheterLogs[i + 1]?.logged_at ?? null

    const after = (t: string) => t >= start
    const before = (t: string) => end === null || t < end

    const fluids = allFluidLogs.filter(f => after(f.given_at) && before(f.given_at))
    const outputs = allOutputLogs.filter(o => after(o.logged_at) && before(o.logged_at))
    const meds = allMedLogs.filter(m => after(m.given_at) && before(m.given_at))
    const notes = allNotes.filter(n => after(n.noted_at) && before(n.noted_at))

    const nappyMl = outputs
      .filter(o => !o.nappy_was_dry && o.nappy_weight_g != null)
      .reduce((s, o) => s + Math.max(0, (o.nappy_weight_g ?? 0) - NAPPY_TARE_G), 0)

    const extraCatheterMl = outputs
      .filter(o => o.id !== cathLog.id && (o.catheter_ml ?? 0) > 0)
      .reduce((s, o) => s + (o.catheter_ml ?? 0), 0)

    const entries: LogEntry[] = [
      ...outputs.map((o): LogEntry => ({ type: 'output', data: o, time: o.logged_at })),
      ...fluids.map((f): LogEntry => ({ type: 'fluid', data: f, time: f.given_at })),
      ...meds.map((m): LogEntry => ({ type: 'medication', data: m, time: m.given_at })),
      ...notes.map((n): LogEntry => ({ type: 'note', data: n, time: n.noted_at })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return {
      startedAt: start,
      endedAt: end,
      isCurrent: end === null,
      catheterMl: cathLog.catheter_ml ?? 0,
      fluidInMl: fluids.reduce((s, f) => s + (f.amount_ml ?? 0), 0),
      extraCatheterMl,
      pottyMl: outputs.reduce((s, o) => s + (o.potty_ml ?? 0), 0),
      nappyMl,
      dryNappies: outputs.filter(o => o.nappy_was_dry).length,
      entries,
    }
  }).reverse()
}

export function CatheterBlocksView() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    getCatheterBlockData()
      .then(({ catheterLogs, allFluidLogs, allOutputLogs, allMedLogs, allNotes }) => {
        setBlocks(buildBlocks(catheterLogs, allFluidLogs, allOutputLogs, allMedLogs, allNotes))
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

  if (blocks.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-400">
        <p className="text-2xl mb-2">🩺</p>
        <p className="text-sm">No Cathy outputs logged yet.</p>
        <p className="text-xs mt-1">Each Cathy log starts a new block.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
        <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-600">
          Each block starts when Cathy output is logged. Nappy tare ({NAPPY_TARE_G}g) subtracted from gross weight.
        </p>
      </div>

      <div className="space-y-3">
        {blocks.map((block, i) => {
          const start = new Date(block.startedAt)
          const totalOut = block.catheterMl + block.extraCatheterMl + block.pottyMl + block.nappyMl
          const duration = block.endedAt
            ? formatDistanceStrict(new Date(block.endedAt), start)
            : formatDistanceStrict(new Date(), start)
          const isExpanded = expandedIndex === i

          return (
            <div
              key={i}
              className={`bg-white rounded-2xl border transition-all ${block.isCurrent ? 'border-nova-200 ring-1 ring-nova-100' : 'border-gray-100'}`}
            >
              {/* Clickable header */}
              <button
                className="w-full text-left p-4"
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wide ${block.isCurrent ? 'text-nova-600' : 'text-gray-400'}`}>
                      {block.isCurrent ? 'Current block' : format(start, 'd MMM')}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Cathy {format(start, 'h:mm a')} · {duration}
                      {block.isCurrent ? ' ago' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!block.isCurrent && block.endedAt && (
                      <span className="text-xs text-gray-400">→ {format(new Date(block.endedAt), 'h:mm a')}</span>
                    )}
                    <span className="text-gray-300">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </div>

                {/* In / Out grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-500 font-medium mb-1">Fluid in</p>
                    <p className="text-xl font-bold text-blue-700">
                      {block.fluidInMl}<span className="text-xs font-normal text-blue-400 ml-0.5">ml</span>
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-xs text-emerald-500 font-medium mb-1">Total out</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {totalOut}<span className="text-xs font-normal text-emerald-400 ml-0.5">ml</span>
                    </p>
                  </div>
                </div>

                {/* Output breakdown */}
                {totalOut > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
                    {block.catheterMl > 0 && (
                      <span className="text-xs text-gray-400">🩺 Cathy {block.catheterMl}ml</span>
                    )}
                    {block.extraCatheterMl > 0 && (
                      <span className="text-xs text-gray-400">🩺 +{block.extraCatheterMl}ml</span>
                    )}
                    {block.pottyMl > 0 && (
                      <span className="text-xs text-gray-400">🪣 Potty {block.pottyMl}ml</span>
                    )}
                    {block.nappyMl > 0 && (
                      <span className="text-xs text-gray-400">🩲 Nappy ~{block.nappyMl}ml</span>
                    )}
                    {block.dryNappies > 0 && (
                      <span className="text-xs text-gray-400">🩲 {block.dryNappies} dry</span>
                    )}
                  </div>
                )}
              </button>

              {/* Expanded entries */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    {block.entries.length} {block.entries.length === 1 ? 'entry' : 'entries'} in this block
                  </p>
                  {block.entries.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-2">No other entries in this block.</p>
                  ) : (
                    <Timeline
                      entries={block.entries}
                      isLoading={false}
                      onRefresh={() => {}}
                      canDelete={false}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
