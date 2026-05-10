import { useState, useEffect, useCallback } from 'react'
import { CountdownCard } from './CountdownCard'
import { StatsBar } from './StatsBar'
import { Timeline } from './Timeline'
import { ActionBar, type LogType } from '../layout/ActionBar'
import { Modal } from '../ui/Modal'
import { MedicationForm } from '../forms/MedicationForm'
import { FluidForm } from '../forms/FluidForm'
import { OutputForm } from '../forms/OutputForm'
import { NoteForm } from '../forms/NoteForm'
import { DailySummaryView } from './DailySummaryView'
import { AdminPanel } from './AdminPanel'
import { useAuth } from '../../hooks/useAuth'
import { getTodayEntries, getDailyStats } from '../../lib/db'
import { format } from 'date-fns'
import { LogOut, LayoutList, BarChart2, Settings } from 'lucide-react'
import type { LogEntry, DailyStats } from '../../types'

type Tab = 'today' | 'summary' | 'admin'

const MODAL_TITLES: Record<LogType, string> = {
  medication: '💊 Log Medication',
  fluid: '💧 Log Fluid',
  output: '📋 Output Check',
  note: '📝 Add Note',
}

export function Dashboard() {
  const { carer, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [openModal, setOpenModal] = useState<LogType | null>(null)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [isLoadingEntries, setIsLoadingEntries] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1)
    setIsLoadingEntries(true)
    setIsLoadingStats(true)

    getTodayEntries()
      .then(setEntries)
      .finally(() => setIsLoadingEntries(false))

    getDailyStats()
      .then(setStats)
      .finally(() => setIsLoadingStats(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleLogSuccess = () => {
    setOpenModal(null)
    refresh()
  }

  const tabs = [
    { id: 'today' as Tab, label: 'Today', icon: LayoutList },
    { id: 'summary' as Tab, label: 'Summary', icon: BarChart2 },
    ...(carer?.role === 'admin' ? [{ id: 'admin' as Tab, label: 'Admin', icon: Settings }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌟</span>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">Nova Care</h1>
              <p className="text-xs text-gray-400">{format(new Date(), 'EEE d MMM')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Carer avatar */}
            {carer && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: carer.color }}
              >
                {carer.name[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 flex gap-1 pb-3">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-nova-100 text-nova-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 pt-4 pb-36">
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Countdown */}
            <CountdownCard
              refreshKey={refreshKey}
              onLogOutput={() => setOpenModal('output')}
            />

            {/* Stats */}
            <StatsBar stats={stats} isLoading={isLoadingStats} />

            {/* Timeline */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Today's log
              </h2>
              <Timeline
                entries={entries}
                isLoading={isLoadingEntries}
                onRefresh={refresh}
                isAdmin={carer?.role === 'admin'}
              />
            </div>
          </div>
        )}

        {activeTab === 'summary' && <DailySummaryView />}
        {activeTab === 'admin' && carer?.role === 'admin' && <AdminPanel />}
      </main>

      {/* Action bar (today tab only) */}
      {activeTab === 'today' && (
        <ActionBar onLog={setOpenModal} />
      )}

      {/* Modals */}
      <Modal
        isOpen={openModal !== null}
        onClose={() => setOpenModal(null)}
        title={openModal ? MODAL_TITLES[openModal] : ''}
      >
        {openModal === 'medication' && <MedicationForm onSuccess={handleLogSuccess} />}
        {openModal === 'fluid' && <FluidForm onSuccess={handleLogSuccess} />}
        {openModal === 'output' && <OutputForm onSuccess={handleLogSuccess} />}
        {openModal === 'note' && <NoteForm onSuccess={handleLogSuccess} />}
      </Modal>
    </div>
  )
}
