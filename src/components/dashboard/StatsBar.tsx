import { Droplets, Pill, Activity } from 'lucide-react'
import type { DailyStats } from '../../types'

interface StatsBarProps {
  stats: DailyStats | null
  isLoading: boolean
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
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
      label: 'Fluid in',
      value: stats ? `${stats.totalFluidMl}ml` : '—',
      sub: stats ? `${stats.fluidEntries} entries` : '',
      icon: Droplets,
      color: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Catheter out',
      value: stats ? `${stats.totalCatheterMl}ml` : '—',
      sub: stats ? `Potty: ${stats.totalPottyMl}ml` : '',
      icon: Activity,
      color: 'bg-emerald-50 text-emerald-700',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Medications',
      value: stats ? `${stats.medicationsGiven}` : '—',
      sub: 'given today',
      icon: Pill,
      color: 'bg-nova-50 text-nova-700',
      iconColor: 'text-nova-400',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <div key={card.label} className={`rounded-2xl p-3 ${card.color}`}>
            <Icon size={16} className={`${card.iconColor} mb-2`} />
            <p className="text-lg font-bold leading-none">{card.value}</p>
            <p className="text-xs mt-1 opacity-70">{card.label}</p>
            {card.sub && <p className="text-xs opacity-50">{card.sub}</p>}
          </div>
        )
      })}
    </div>
  )
}
