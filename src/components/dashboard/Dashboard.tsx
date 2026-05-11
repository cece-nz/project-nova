import { useState, useEffect, useCallback } from 'react'
import { CountdownCard } from './CountdownCard'
import { LastMedCard } from './LastMedCard'
import { AppointmentsWidget } from './AppointmentsWidget'
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
import { AppointmentList } from '../appointments/AppointmentList'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../lib/permissions'
import { getTodayEntries, getDailyStats } from '../../lib/db'
import { format } from 'date-fns'
import { LogOut, LayoutList, BarChart2, Settings, CalendarDays } from 'lucide-react'
import type { LogEntry, DailyStats, MedicationLog, FluidLog, OutputLog, GeneralNote } from '../../types'

type Tab = 'today' | 'summary' | 'appointments' | 'admin'

interface SummaryNav {
  subTab: 'blocks' | 'inputs'
  typeFilter?: string
}

const MODAL_TITLES: Record<LogType, string> = {
  medication: '💊 Log Medication',
  fluid: '💧 Log Fluid',
  output: '📋 Output Check',
  note: '📝 Add Note',
}

const EDIT_TITLES: Record<LogType, string> = {
  medication: '✏️ Edit Medication',
  fluid: '✏️ Edit Fluid',
  output: '✏️ Edit Output',
  note: '✏️ Edit Note',
}

export function Dashboard() {
  const { carer, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [summaryNav, setSummaryNav] = useState<SummaryNav | null>(null)
  const [openModal, setOpenModal] = useState<LogType | null>(null)
  const [editEntry, setEditEntry] = useState<LogEntry | null>(null)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [isLoadingEntries, setIsLoadingEntries] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1)
    setIsLoadingEntries(true)
    setIsLoadingStats(true)
    getTodayEntries().then(setEntries).finally(() => setIsLoadingEntries(false))
    getDailyStats().then(setStats).finally(() => setIsLoadingStats(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const goToSummary = (nav: SummaryNav) => {
    setSummaryNav(nav)
    setActiveTab('summary')
  }

  const handleLogSuccess = () => { setOpenModal(null); refresh() }
  const handleEditSuccess = () => { setEditEntry(null); refresh() }
  const handleModalClose = () => { setOpenModal(null); setEditEntry(null) }

  const modalType: LogType | null = editEntry ? (editEntry.type as LogType) : openModal
  const modalTitle = editEntry
    ? EDIT_TITLES[editEntry.type as LogType]
    : (openModal ? MODAL_TITLES[openModal] : '')

  const tabs = [
    { id: 'today' as Tab, label: 'Today', icon: LayoutList },
    { id: 'summary' as Tab, label: 'Summary', icon: BarChart2 },
    { id: 'appointments' as Tab, label: 'Appts', icon: CalendarDays },
    ...(can.manageAdmin(carer?.role) ? [{ id: 'admin' as Tab, label: 'Admin', icon: Settings }] : []),
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
            {carer && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: carer.color }}
              >
                {carer.name[0].toUpperCase()}
              </div>
            )}
            <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 flex gap-1 pb-3 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'summary') setSummaryNav(null) }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-nova-100 text-nova-700' : 'text-gray-500 hover:text-gray-700'
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
            <CountdownCard
              refreshKey={refreshKey}
              onLogOutput={() => setOpenModal('output')}
              onViewHistory={() => goToSummary({ subTab: 'inputs', typeFilter: 'output' })}
            />
            <LastMedCard
              refreshKey={refreshKey}
              onViewHistory={() => goToSummary({ subTab: 'inputs', typeFilter: 'medication' })}
            />
            <StatsBar
              stats={stats}
              isLoading={isLoadingStats}
              onOutputClick={() => goToSummary({ subTab: 'inputs', typeFilter: 'output' })}
              onFluidClick={() => goToSummary({ subTab: 'inputs', typeFilter: 'fluid' })}
              onMedClick={() => goToSummary({ subTab: 'inputs', typeFilter: 'medication' })}
            />
            <AppointmentsWidget onClick={() => setActiveTab('appointments')} />
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Today's log</h2>
              <Timeline
                entries={entries}
                isLoading={isLoadingEntries}
                onRefresh={refresh}
                canDelete={can.deleteEntry(carer?.role)}
                onEdit={can.deleteEntry(carer?.role) ? setEditEntry : undefined}
              />
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <DailySummaryView
            key={summaryNav ? `${summaryNav.subTab}-${summaryNav.typeFilter}` : 'default'}
            initialSubTab={summaryNav?.subTab}
            initialTypeFilter={summaryNav?.typeFilter}
            onEdit={can.deleteEntry(carer?.role) ? setEditEntry : undefined}
          />
        )}
        {activeTab === 'appointments' && <AppointmentList />}
        {activeTab === 'admin' && can.manageAdmin(carer?.role) && <AdminPanel />}
      </main>

      {activeTab === 'today' && can.logEntry(carer?.role) && (
        <ActionBar onLog={setOpenModal} />
      )}

      <Modal isOpen={modalType !== null} onClose={handleModalClose} title={modalTitle}>
        {modalType === 'medication' && (
          <MedicationForm
            onSuccess={editEntry ? handleEditSuccess : handleLogSuccess}
            initial={editEntry?.type === 'medication' ? (editEntry.data as MedicationLog) : undefined}
          />
        )}
        {modalType === 'fluid' && (
          <FluidForm
            onSuccess={editEntry ? handleEditSuccess : handleLogSuccess}
            initial={editEntry?.type === 'fluid' ? (editEntry.data as FluidLog) : undefined}
          />
        )}
        {modalType === 'output' && (
          <OutputForm
            onSuccess={editEntry ? handleEditSuccess : handleLogSuccess}
            initial={editEntry?.type === 'output' ? (editEntry.data as OutputLog) : undefined}
          />
        )}
        {modalType === 'note' && (
          <NoteForm
            onSuccess={editEntry ? handleEditSuccess : handleLogSuccess}
            initial={editEntry?.type === 'note' ? (editEntry.data as GeneralNote) : undefined}
          />
        )}
      </Modal>
    </div>
  )
}
