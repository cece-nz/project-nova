import { useState, useEffect } from 'react'
import { getFourHourlyData } from '../../lib/db'
import { NAPPY_TARE_G } from '../../utils'
import { Info } from 'lucide-react'
import type { FluidLog, OutputLog } from '../../types'

const BLOCKS = [
  { label: '00:00–04:00', startH: 0, endH: 4 },
  { label: '04:00–08:00', startH: 4, endH: 8 },
  { label: '08:00–12:00', startH: 8, endH: 12 },
  { label: '12:00–16:00', startH: 12, endH: 16 },
  { label: '16:00–20:00', startH: 16, endH: 20 },
  { label: '20:00–00:00', startH: 20, endH: 24 },
]

function nappyOutputMl(weightG: number | null): number {
  if (!weightG) return 0
  return Math.max(0, weightG - NAPPY_TARE_G)
}

function inBlock(isoString: string, startH: number, endH: number): boolean {
  const h = new Date(isoString).getHours()
  return h >= startH && h < endH
}

interface BlockData {
  label: string
  startH: number
  fluidMl: number
  catheterMl: number
  pottyMl: number
  nappyMl: number
  nappyCount: number
  nappyDryCount: number
  hasData: boolean
}

function processBlocks(fluidLogs: FluidLog[], outputLogs: OutputLog[]): BlockData[] {
  return BLOCKS.map(block => {
    const fluids = fluidLogs.filter(f => inBlock(f.given_at, block.startH, block.endH))
    const outputs = outputLogs.filter(o => inBlock(o.logged_at, block.startH, block.endH))

    const fluidMl = fluids.reduce((s, f) => s + (f.amount_ml || 0), 0)
    const catheterMl = outputs.reduce((s, o) => s + (o.catheter_ml || 0), 0)
    const pottyMl = outputs.reduce((s, o) => s + (o.potty_ml || 0), 0)
    const nappyMl = outputs
      .filter(o => !o.nappy_was_dry)
      .reduce((s, o) => s + nappyOutputMl(o.nappy_weight_g), 0)
    const nappyCount = outputs.filter(o => !o.nappy_was_dry && o.nappy_weight_g != null).length
    const nappyDryCount = outputs.filter(o => o.nappy_was_dry).length

    return {
      label: block.label,
      startH: block.startH,
      fluidMl,
      catheterMl,
      pottyMl,
      nappyMl,
      nappyCount,
      nappyDryCount,
      hasData: fluids.length > 0 || outputs.length > 0,
    }
  })
}

export function FourHourlySummary() {
  const [fluidLogs, setFluidLogs] = useState<FluidLog[]>([])
  const [outputLogs, setOutputLogs] = useState<OutputLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getFourHourlyData()
      .then(({ fluidLogs: f, outputLogs: o }) => { setFluidLogs(f); setOutputLogs(o) })
      .finally(() => setIsLoading(false))
  }, [])

  const currentHour = new Date().getHours()
  const currentBlockIdx = BLOCKS.findIndex(b => currentHour >= b.startH && currentHour < b.endH)

  const blocks = processBlocks(fluidLogs, outputLogs)
  const totalIn = blocks.reduce((s, b) => s + b.fluidMl, 0)
  const totalOut = blocks.reduce((s, b) => s + b.catheterMl + b.pottyMl + b.nappyMl, 0)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0,1,2].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fluid Balance — Today</h2>

      {/* Nappy tare note */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
        <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-600">
          Nappy tare weight ({NAPPY_TARE_G}g) subtracted from gross nappy weight to calculate output.
        </p>
      </div>

      {/* Day totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-xs font-medium text-blue-500 uppercase tracking-wide mb-1">Total In</p>
          <p className="text-2xl font-bold text-blue-700">{totalIn}</p>
          <p className="text-xs text-blue-400">ml</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-xs font-medium text-emerald-500 uppercase tracking-wide mb-1">Total Out</p>
          <p className="text-2xl font-bold text-emerald-700">{totalOut}</p>
          <p className="text-xs text-emerald-400">ml</p>
        </div>
      </div>

      {/* 4-hour blocks */}
      <div className="space-y-2">
        {blocks.map((block, i) => {
          const isCurrent = i === currentBlockIdx
          const totalOut = block.catheterMl + block.pottyMl + block.nappyMl
          const balance = block.fluidMl - totalOut

          if (!block.hasData && !isCurrent) return null

          return (
            <div
              key={block.label}
              className={`bg-white rounded-2xl border p-4 ${isCurrent ? 'border-nova-200 ring-1 ring-nova-100' : 'border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-wide ${isCurrent ? 'text-nova-600' : 'text-gray-400'}`}>
                  {block.label}{isCurrent ? ' · now' : ''}
                </span>
                {block.hasData && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    balance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {balance >= 0 ? '+' : ''}{balance}ml
                  </span>
                )}
              </div>

              {block.hasData ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* Fluid in */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Fluid in</p>
                    <p className="text-lg font-bold text-blue-600">{block.fluidMl}<span className="text-xs font-normal text-gray-400 ml-0.5">ml</span></p>
                  </div>

                  {/* Output */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Output</p>
                    <p className="text-lg font-bold text-emerald-600">{totalOut}<span className="text-xs font-normal text-gray-400 ml-0.5">ml</span></p>
                    <div className="space-y-0.5 mt-1">
                      {block.catheterMl > 0 && (
                        <p className="text-xs text-gray-400">Catheter {block.catheterMl}ml</p>
                      )}
                      {block.pottyMl > 0 && (
                        <p className="text-xs text-gray-400">Potty {block.pottyMl}ml</p>
                      )}
                      {block.nappyCount > 0 && (
                        <p className="text-xs text-gray-400">Nappy ~{block.nappyMl}ml</p>
                      )}
                      {block.nappyDryCount > 0 && (
                        <p className="text-xs text-gray-400">{block.nappyDryCount} dry nappy{block.nappyDryCount > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300 italic">No entries yet</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
