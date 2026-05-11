import { useCountdown } from '../../hooks/useCountdown'
import { formatTime } from '../../utils'
import { AlertTriangle, Clock } from 'lucide-react'

interface CountdownCardProps {
  refreshKey?: number
  onLogOutput: () => void
  onViewHistory?: () => void
}

export function CountdownCard({ refreshKey, onLogOutput, onViewHistory }: CountdownCardProps) {
  const { isOverdue, label, percentage, lastOutputAt, isLoading } = useCountdown(refreshKey)

  const circumference = 2 * Math.PI * 42 // radius 42
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div
      className={`rounded-3xl p-5 text-white relative overflow-hidden transition-all duration-500 ${
        isOverdue
          ? 'bg-gradient-to-br from-red-500 to-rose-600'
          : percentage > 75
          ? 'bg-gradient-to-br from-amber-500 to-orange-500'
          : 'bg-gradient-to-br from-nova-500 to-purple-600'
      }`}
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 -bottom-12 w-40 h-40 rounded-full bg-white/5" />

      <div className="relative flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" className="-rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {isOverdue ? (
              <AlertTriangle size={28} className="text-white animate-pulse" />
            ) : (
              <Clock size={24} className="text-white" />
            )}
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">
            Last Cathy
          </p>
          {isLoading ? (
            <p className="text-white font-semibold text-lg">Loading...</p>
          ) : (
            <>
              <p className="text-white font-bold text-xl leading-tight">{label}</p>
              {lastOutputAt && (
                <p className="text-white/70 text-xs mt-1">
                  Last done at {formatTime(lastOutputAt)}
                </p>
              )}
            </>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={onLogOutput}
              className="bg-white/20 hover:bg-white/30 active:bg-white/10 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              Log now →
            </button>
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/80 text-sm px-3 py-2 rounded-xl transition-all active:scale-95"
              >
                History
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
