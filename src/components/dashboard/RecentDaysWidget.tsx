import { useState, useEffect } from 'react'
import { getAllLogsData } from '../../lib/db'
import { buildDays, type DayBlock } from '../../lib/dailyBlocks'
import { format } from 'date-fns'

interface Props {
  refreshKey?: number
  onClickDay: (date: string) => void
}

export function RecentDaysWidget({ refreshKey, onClickDay }: Props) {
  const [days, setDays] = useState<DayBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getAllLogsData()
      .then(({ fluidLogs, outputLogs, medLogs, notes }) => {
        // Exclude today (already shown in TodayOutputCard); take next 3
        const todayKey = format(new Date(), 'yyyy-MM-dd')
        setDays(buildDays(fluidLogs, outputLogs, medLogs, notes).filter(d => d.date !== todayKey).slice(0, 3))
      })
      .finally(() => setIsLoading(false))
  }, [refreshKey])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />)}
      </div>
    )
  }

  if (days.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Last few days</h2>
      <div className="space-y-2">
        {days.map(day => {
          const totalOut = day.cathyMl + day.pottyMl + day.nappyMl
          return (
            <button
              key={day.date}
              onClick={() => onClickDay(day.date)}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 p-3 active:scale-[0.98] transition-all hover:border-nova-200"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{day.label}</p>
                <span className="text-xs text-gray-300">→</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 rounded-lg p-2">
                  <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wide">Out</p>
                  <p className="text-base font-bold text-emerald-700 leading-tight">
                    {totalOut}<span className="text-xs font-normal text-emerald-400">ml</span>
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">In</p>
                  <p className="text-base font-bold text-blue-700 leading-tight">
                    {day.fluidInMl}<span className="text-xs font-normal text-blue-400">ml</span>
                  </p>
                </div>
              </div>
              {(day.cathyCount > 0 || day.dryNappies > 0) && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {day.cathyMl > 0 && (
                    <span className="text-xs text-gray-400">
                      🩺 {day.cathyMl}ml{day.cathyCount > 1 ? ` (×${day.cathyCount})` : ''}
                    </span>
                  )}
                  {day.pottyMl > 0 && <span className="text-xs text-gray-400">🪣 {day.pottyMl}ml</span>}
                  {day.nappyMl > 0 && <span className="text-xs text-gray-400">🩲 ~{day.nappyMl}ml</span>}
                  {day.dryNappies > 0 && <span className="text-xs text-gray-400">🩲 {day.dryNappies} dry</span>}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
