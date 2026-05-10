import { useState, useEffect } from 'react'
import { getDailySummary, saveDailySummary, getDailyStats } from '../../lib/db'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import { Textarea, SubmitButton } from '../ui/FormElements'
import toast from 'react-hot-toast'
import type { DailySummary, DailyStats } from '../../types'

interface Props {
  date?: Date
}

export function DailySummaryView({ date = new Date() }: Props) {
  const { carer } = useAuth()
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    Promise.all([getDailySummary(date), getDailyStats(date)])
      .then(([s, st]) => {
        setSummary(s)
        setStats(st)
        if (s) setContent(s.content)
      })
      .finally(() => setIsLoading(false))
  }, [date])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return
    setIsSaving(true)
    try {
      const saved = await saveDailySummary(content, carer.id, date)
      setSummary(saved)
      toast.success('Summary saved ✓')
    } catch {
      toast.error('Failed to save summary')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="animate-pulse h-40 bg-gray-100 rounded-2xl" />

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-800">
        Summary for {format(date, 'EEEE d MMMM')}
      </h3>

      {/* Auto stats */}
      {stats && (
        <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-1.5 text-gray-600">
          <p className="font-semibold text-gray-800 mb-2">📊 Auto-generated stats</p>
          <p>💧 Total fluid in: <strong>{stats.totalFluidMl}ml</strong> ({stats.fluidEntries} entries)</p>
          <p>🩺 Catheter out: <strong>{stats.totalCatheterMl}ml</strong></p>
          <p>🪣 Potty: <strong>{stats.totalPottyMl}ml</strong></p>
          <p>🩲 Nappy weight: <strong>{stats.totalNappyG}g</strong></p>
          <p>💊 Medications given: <strong>{stats.medicationsGiven}</strong></p>
          <p>📋 Output checks: <strong>{stats.outputEntries}</strong></p>
        </div>
      )}

      {/* Manual notes */}
      <form onSubmit={handleSave}>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Daily notes &amp; observations
        </label>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="How was Nova's day overall? Any concerns or highlights to note for the next shift..."
          rows={5}
        />
        <SubmitButton
          isLoading={isSaving}
          label={summary ? 'Update Summary' : 'Save Summary'}
          loadingLabel="Saving..."
        />
      </form>

      {summary && (
        <p className="text-xs text-gray-400 text-center">
          Last updated by {(summary.carer as { name: string } | undefined)?.name || 'unknown'} at{' '}
          {format(new Date(summary.updated_at), 'h:mm a')}
        </p>
      )}
    </div>
  )
}
