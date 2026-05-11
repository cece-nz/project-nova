import { Pill, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import type { DailyStats } from '../../types'

interface StatsBarProps {
  stats: DailyStats | null
  isLoading: boolean
  onOutputClick?: () => void
  onFluidClick?: () => void
  onMedClick?: () => void
}

export function StatsBar({ stats, isLoading, onOutputClick, onFluidClick, onMedClick }: StatsBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map(i => (
          <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Cathy out',
      value: stats ? `${stats.totalCatheterMl}ml` : '—',
      sub: stats ? `Potty: ${stats.totalPottyMl}ml` : '',
      icon: ArrowUpFromLine,
      color: 'bg-emerald-50 text-emerald-700',
      iconColor: 'text-emerald-400',
      onClick: onOutputClick,
    },
    {
      label: 'Fluid in',
      value: stats ? `${stats.totalFluidMl}ml` : '—',
      sub: stats ? `${stats.fluidEntries} entries` : '',
      icon: ArrowDownToLine,
      color: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-400',
      onClick: onFluidClick,
    },
    {
      label: 'Meds',
      value: stats ? `${stats.medicationsGiven}` : '—',
      sub: 'given today',
      icon: Pill,
      color: 'bg-nova-50 text-nova-700',
      iconColor: 'text-nova-400',
      onClick: onMedClick,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <button
            key={card.label}
            onClick={card.onClick}
            disabled={!card.onClick}
            className={`rounded-2xl p-3 text-left transition-all ${card.color} ${card.onClick ? 'active:scale-95 hover:brightness-95 cursor-pointer' : 'cursor-default'}`}
          >
            <Icon size={16} className={`${card.iconColor} mb-2`} />
            <p className="text-lg font-bold leading-none">{card.value}</p>
            <p className="text-xs mt-1 opacity-70">{card.label}</p>
            {card.sub && <p className="text-xs opacity-50">{card.sub}</p>}
          </button>
        )
      })}
    </div>
  )
}
