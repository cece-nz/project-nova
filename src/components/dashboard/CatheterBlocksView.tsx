import { useState, useEffect } from 'react'
import { getCatheterBlockData } from '../../lib/db'
import { NAPPY_TARE_G } from '../../utils'
import { format, formatDistanceStrict } from 'date-fns'
import { Info } from 'lucide-react'
import type { FluidLog, OutputLog } from '../../types'

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
}

function buildBlocks(
  catheterLogs: OutputLog[],
  allFluidLogs: FluidLog[],
  allOutputLogs: OutputLog[],
): Block[] {
  if (catheterLogs.length === 0) return []

  return catheterLogs.map((cathLog, i): Block => {
    const start = cathLog.logged_at
    const end = catheterLogs[i + 1]?.logged_at ?? null

    const after = (t: string) => t >= start
    const before = (t: string) => end === null || t < end

    const fluids = allFluidLogs.filter(f => after(f.given_at) && before(f.given_at))
    const outputs = allOutputLogs.filter(o => after(o.logged_at) && before(o.logged_at))

    const nappyMl = outputs
      .filter(o => !o.nappy_was_dry && o.nappy_weight_g != null)
      .reduce((s, o) => s + Math.max(0, (o.nappy_weight_g ?? 0) - NAPPY_TARE_G), 0)

    // any additional catheter logs within this block (shouldn't normally happen, but handle it)
    const extraCatheterMl = outputs
      .filter(o => o.id !== cathLog.id && (o.catheter_ml ?? 0) > 0)
      .reduce((s, o) => s + (o.catheter_ml ?? 0), 0)

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
    }
  }).reverse()
}

export function CatheterBlocksView() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCatheterBlockData()
      .then(({ catheterLogs, allFluidLogs, allOutputLogs }) => {
        setBlocks(buildBlocks(catheterLogs, allFluidLogs, allOutputLogs))
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
        <p className="text-sm">No catheter outputs logged yet.</p>
        <p className="text-xs mt-1">Each catheter log starts a new block.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
        <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-600">
          Each block starts when catheter output is logged. Nappy tare ({NAPPY_TARE_G}g) subtracted from gross weight.
        </p>
      </div>

      <div className="space-y-3">
        {blocks.map((block, i) => {
          const start = new Date(block.startedAt)
          const totalOut = block.catheterMl + block.extraCatheterMl + block.pottyMl + block.nappyMl
          const duration = block.endedAt
            ? formatDistanceStrict(new Date(block.endedAt), start)
            : formatDistanceStrict(new Date(), start)

          return (
            <div
              key={i}
              className={`bg-white rounded-2xl border p-4 ${block.isCurrent ? 'border-nova-200 ring-1 ring-nova-100' : 'border-gray-100'}`}
            >
              {/* Block header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wide ${block.isCurrent ? 'text-nova-600' : 'text-gray-400'}`}>
                    {block.isCurrent ? 'Current block' : format(start, 'd MMM')}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Catheter emptied {format(start, 'h:mm a')} · {duration}
                    {block.isCurrent ? ' ago' : ''}
                  </p>
                </div>
                {!block.isCurrent && block.endedAt && (
                  <span className="text-xs text-gray-400">→ {format(new Date(block.endedAt), 'h:mm a')}</span>
                )}
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
                    <span className="text-xs text-gray-400">🩺 Catheter {block.catheterMl}ml</span>
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
