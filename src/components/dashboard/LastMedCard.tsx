import { useState, useEffect } from 'react'
import { getLastMedication } from '../../lib/db'
import { differenceInMinutes, differenceInHours, format } from 'date-fns'
import { Pill } from 'lucide-react'
import type { MedicationLog } from '../../types'

export function LastMedCard({ refreshKey, onViewHistory }: { refreshKey: number; onViewHistory?: () => void }) {
  const [lastMed, setLastMed] = useState<MedicationLog | null | undefined>(undefined)

  useEffect(() => {
    getLastMedication().then(setLastMed)
    const id = setInterval(() => getLastMedication().then(setLastMed), 60_000)
    return () => clearInterval(id)
  }, [refreshKey])

  if (lastMed === undefined) {
    return <div className="bg-white rounded-2xl border border-gray-100 p-4 h-20 animate-pulse" />
  }

  if (!lastMed) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Pill size={18} className="text-gray-300" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last medication</p>
          <p className="text-sm text-gray-400 mt-0.5">None logged yet</p>
        </div>
      </div>
    )
  }

  const givenAt = new Date(lastMed.given_at)
  const now = new Date()
  const totalMinutes = differenceInMinutes(now, givenAt)
  const hours = differenceInHours(now, givenAt)
  const minutes = totalMinutes - hours * 60

  const timeLabel =
    hours === 0
      ? `${minutes}m ago`
      : minutes === 0
      ? `${hours}h ago`
      : `${hours}h ${minutes}m ago`

  return (
    <button
      onClick={onViewHistory}
      disabled={!onViewHistory}
      className={`w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 text-left ${onViewHistory ? 'active:scale-95 transition-all hover:border-nova-200' : ''}`}
    >
      <div className="w-10 h-10 rounded-xl bg-nova-50 flex items-center justify-center flex-shrink-0">
        <Pill size={18} className="text-nova-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last medication</p>
        <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{lastMed.medication_name}</p>
        {lastMed.dose_given && (
          <p className="text-xs text-gray-400 truncate">{lastMed.dose_given}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-nova-600 leading-tight">{timeLabel}</p>
        <p className="text-xs text-gray-400">{format(givenAt, 'h:mm a')}</p>
      </div>
    </button>
  )
}
