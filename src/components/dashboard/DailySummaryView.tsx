import { useState, useEffect } from 'react'
import { getDailySummary, saveDailySummary } from '../../lib/db'
import { CatheterBlocksView } from './CatheterBlocksView'
import { LogHistory } from './LogHistory'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../lib/permissions'
import { format } from 'date-fns'
import { Textarea, SubmitButton } from '../ui/FormElements'
import toast from 'react-hot-toast'
import type { DailySummary, LogEntry } from '../../types'

type SubTab = 'blocks' | 'inputs'

interface DailySummaryViewProps {
  onEdit?: (entry: LogEntry) => void
  initialSubTab?: SubTab
  initialTypeFilter?: string
}

export function DailySummaryView({ onEdit, initialSubTab, initialTypeFilter }: DailySummaryViewProps) {
  const { carer } = useAuth()
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab ?? 'blocks')
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getDailySummary(new Date())
      .then(s => { setSummary(s); if (s) setContent(s.content) })
      .finally(() => setIsLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return
    setIsSaving(true)
    try {
      const saved = await saveDailySummary(content, carer.id, new Date())
      setSummary(saved)
      toast.success('Notes saved ✓')
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab pills */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('blocks')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            subTab === 'blocks'
              ? 'bg-nova-100 text-nova-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          🩺 Blocks
        </button>
        <button
          onClick={() => setSubTab('inputs')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            subTab === 'inputs'
              ? 'bg-nova-100 text-nova-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          📋 All inputs
        </button>
      </div>

      {subTab === 'blocks' && (
        <div className="space-y-6">
          <CatheterBlocksView />

          {/* Admin daily notes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Daily notes — {format(new Date(), 'EEE d MMM')}
            </h3>

            {isLoading ? (
              <div className="animate-pulse h-24 bg-gray-100 rounded-2xl" />
            ) : can.editDailySummary(carer?.role) ? (
              <form onSubmit={handleSave}>
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="How was Nova's day overall? Any concerns or highlights..."
                  rows={4}
                />
                <SubmitButton
                  isLoading={isSaving}
                  label={summary ? 'Update notes' : 'Save notes'}
                  loadingLabel="Saving..."
                />
              </form>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {summary?.content || <span className="text-gray-400 italic">No notes for today.</span>}
              </div>
            )}

            {summary && (
              <p className="text-xs text-gray-400 text-center">
                Last updated by {(summary.carer as { name: string } | undefined)?.name || 'unknown'}{' '}
                at {format(new Date(summary.updated_at), 'h:mm a')}
              </p>
            )}
          </div>
        </div>
      )}

      {subTab === 'inputs' && (
        <LogHistory onEdit={onEdit} initialTypeFilter={initialTypeFilter} />
      )}
    </div>
  )
}
