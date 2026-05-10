import { format, formatDistanceToNow, addHours, isPast } from 'date-fns'

export function formatTime(isoString: string): string {
  return format(new Date(isoString), 'h:mm a')
}

export function formatDate(isoString: string): string {
  return format(new Date(isoString), 'EEE d MMM')
}

export function formatDateTime(isoString: string): string {
  return format(new Date(isoString), 'EEE d MMM, h:mm a')
}

export function timeAgo(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true })
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function toLocalIso(date: Date = new Date()): string {
  // Returns datetime-local compatible string
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromLocalIso(localIso: string): string {
  return new Date(localIso).toISOString()
}

/** Returns time remaining until 4h after last output, or null if overdue */
export function getCountdownInfo(lastOutputAt: string | null): {
  isOverdue: boolean
  label: string
  percentage: number // 0-100, how much of 4h window has elapsed
  nextDueAt: Date | null
} {
  if (!lastOutputAt) {
    return { isOverdue: true, label: 'No record — check now', percentage: 100, nextDueAt: null }
  }

  const last = new Date(lastOutputAt)
  const nextDue = addHours(last, 4)
  const now = new Date()
  const totalMs = 4 * 60 * 60 * 1000
  const elapsedMs = now.getTime() - last.getTime()
  const percentage = Math.min(100, Math.round((elapsedMs / totalMs) * 100))

  if (isPast(nextDue)) {
    const overdueMins = Math.floor((now.getTime() - nextDue.getTime()) / 60000)
    const h = Math.floor(overdueMins / 60)
    const m = overdueMins % 60
    const label = h > 0 ? `Overdue by ${h}h ${m}m` : `Overdue by ${m}m`
    return { isOverdue: true, label, percentage: 100, nextDueAt: nextDue }
  }

  const remainingMs = nextDue.getTime() - now.getTime()
  const remainingMins = Math.ceil(remainingMs / 60000)
  const h = Math.floor(remainingMins / 60)
  const m = remainingMins % 60
  const label = h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`

  return { isOverdue: false, label, percentage, nextDueAt: nextDue }
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const FLUID_TYPES = [
  { value: 'water', label: 'Water', emoji: '💧' },
  { value: 'milk', label: 'Milk', emoji: '🥛' },
  { value: 'formula', label: 'Formula', emoji: '🍼' },
  { value: 'juice', label: 'Juice', emoji: '🧃' },
  { value: 'other', label: 'Other', emoji: '🥤' },
] as const

export const NOTE_CATEGORIES = [
  { value: 'general', label: 'General', emoji: '📝' },
  { value: 'health', label: 'Health', emoji: '🏥' },
  { value: 'behaviour', label: 'Behaviour', emoji: '😊' },
  { value: 'sleep', label: 'Sleep', emoji: '😴' },
  { value: 'food', label: 'Food', emoji: '🍽️' },
] as const

export const NAPPY_TARE_G = 50

export const CARER_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
]
