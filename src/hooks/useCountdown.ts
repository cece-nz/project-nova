import { useState, useEffect } from 'react'
import { getLastCatheterOutput } from '../lib/db'
import { getCountdownInfo } from '../utils'

export interface CountdownState {
  isOverdue: boolean
  label: string
  percentage: number
  lastOutputAt: string | null
  isLoading: boolean
}

export function useCountdown(refreshKey?: number) {
  const [state, setState] = useState<CountdownState>({
    isOverdue: false,
    label: 'Loading...',
    percentage: 0,
    lastOutputAt: null,
    isLoading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function fetchLast() {
      try {
        const last = await getLastCatheterOutput()
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            lastOutputAt: last?.logged_at || null,
            isLoading: false,
          }))
        }
      } catch {
        if (!cancelled) setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    fetchLast()
    return () => { cancelled = true }
  }, [refreshKey])

  // Update display every 30 seconds
  useEffect(() => {
    function update() {
      const info = getCountdownInfo(state.lastOutputAt)
      setState(prev => ({ ...prev, ...info }))
    }
    update()
    const interval = setInterval(update, 30_000)
    return () => clearInterval(interval)
  }, [state.lastOutputAt])

  return state
}
