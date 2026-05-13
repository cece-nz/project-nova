import { useState, useEffect } from 'react'
import { getAllLogsData } from '../../lib/db'
import { buildDays, type DayBlock } from '../../lib/dailyBlocks'
import { format } from 'date-fns'
import { ArrowUpFromLine } from 'lucide-react'

interface Props {
  refreshKey?: number
  onClick?: () => void
}

export function TodayOutputCard({ refreshKey, onClick }: Props) {
  const [today, setToday] = useState<DayBlock | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const todayKey = format(new Date(), 'yyyy-MM-dd')
    getAllLogsData()
      .then(({ fluidLogs, outputLogs, medLogs, notes }) => {
        const days = buildDays(fluidLogs, outputLogs, medLogs, notes)
        setToday(days.find(d => d.date === todayKey) ?? null)
      })
      .finally(() => setIsLoading(false))
  }, [refreshKey])

  if (isLoading) {
    return <div className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
  }

  const cathyMl = today?.cathyMl ?? 0
  const pottyMl = today?.pottyMl ?? 0
  const nappyMl = today?.nappyMl ?? 0
  const totalOut = cathyMl + pottyMl + nappyMl

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full text-left rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white relative overflow-hidden ${onClick ? 'active:scale-[0.98] transition-all' : ''}`}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <ArrowUpFromLine size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
            {format(new Date(), 'EEE d MMM')} · Output so far
          </p>
          <p className="text-3xl font-bold leading-tight mt-0.5">
            {totalOut}<span className="text-base font-normal text-white/80 ml-1">ml</span>
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            <span className="text-xs text-white/80">🩺 Cathy {cathyMl}ml</span>
            <span className="text-xs text-white/80">🩲 Nappy ~{nappyMl}ml</span>
            <span className="text-xs text-white/80">🪣 Potty {pottyMl}ml</span>
          </div>
        </div>
      </div>
    </button>
  )
}
