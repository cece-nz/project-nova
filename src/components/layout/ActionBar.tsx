import { Pill, Droplets, Activity, FileText } from 'lucide-react'
import { useState } from 'react'

export type LogType = 'medication' | 'fluid' | 'output' | 'note'

interface ActionBarProps {
  onLog: (type: LogType) => void
}

export function ActionBar({ onLog }: ActionBarProps) {
  const [expanded, setExpanded] = useState(false)

  const actions = [
    {
      type: 'output' as LogType,
      label: 'Output',
      icon: Activity,
      color: 'bg-emerald-500 text-white',
      ring: 'ring-emerald-200',
    },
    {
      type: 'fluid' as LogType,
      label: 'Fluid',
      icon: Droplets,
      color: 'bg-blue-500 text-white',
      ring: 'ring-blue-200',
    },
    {
      type: 'medication' as LogType,
      label: 'Medication',
      icon: Pill,
      color: 'bg-purple-500 text-white',
      ring: 'ring-purple-200',
    },
    {
      type: 'note' as LogType,
      label: 'Note',
      icon: FileText,
      color: 'bg-amber-500 text-white',
      ring: 'ring-amber-200',
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Expanded action buttons */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setExpanded(false)}
        />
      )}

      <div className="relative z-40 bg-white border-t border-gray-100 px-4 pb-safe pt-3">
        {expanded ? (
          <div className="animate-slide-up grid grid-cols-4 gap-3 mb-3">
            {actions.map(action => {
              const Icon = action.icon
              return (
                <button
                  key={action.type}
                  onClick={() => {
                    setExpanded(false)
                    onLog(action.type)
                  }}
                  className={`flex flex-col items-center gap-2 py-3 rounded-2xl ${action.color} ring-4 ${action.ring} active:scale-95 transition-all`}
                >
                  <Icon size={22} />
                  <span className="text-xs font-semibold">{action.label}</span>
                </button>
              )
            })}
          </div>
        ) : (
          /* Quick row when collapsed */
          <div className="flex gap-2 mb-1">
            {actions.map(action => {
              const Icon = action.icon
              return (
                <button
                  key={action.type}
                  onClick={() => onLog(action.type)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl ${action.color} active:scale-95 transition-all`}
                >
                  <Icon size={16} />
                  <span className="text-xs font-semibold">{action.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
