import { format } from 'date-fns'
import { NAPPY_TARE_G } from '../utils'
import type { FluidLog, OutputLog, MedicationLog, GeneralNote, LogEntry } from '../types'

export interface DayBlock {
  date: string         // 'yyyy-MM-dd'
  label: string        // 'Mon 13 May 2026'
  cathyMl: number
  pottyMl: number
  nappyMl: number
  cathyCount: number
  dryNappies: number
  fluidInMl: number
  fluidEntries: number
  medsGiven: number
  entries: LogEntry[]  // sorted newest-first
}

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

export function buildDays(
  fluidLogs: FluidLog[],
  outputLogs: OutputLog[],
  medLogs: MedicationLog[],
  notes: GeneralNote[],
): DayBlock[] {
  const map = new Map<string, DayBlock>()

  const getDay = (key: string): DayBlock => {
    let day = map.get(key)
    if (!day) {
      day = {
        date: key,
        label: format(new Date(key + 'T12:00:00'), 'EEE d MMM yyyy'),
        cathyMl: 0, pottyMl: 0, nappyMl: 0,
        cathyCount: 0, dryNappies: 0,
        fluidInMl: 0, fluidEntries: 0, medsGiven: 0,
        entries: [],
      }
      map.set(key, day)
    }
    return day
  }

  for (const f of fluidLogs) {
    const day = getDay(dayKey(f.given_at))
    day.fluidInMl += f.amount_ml ?? 0
    day.fluidEntries += 1
    day.entries.push({ type: 'fluid', data: f, time: f.given_at })
  }
  for (const o of outputLogs) {
    const day = getDay(dayKey(o.logged_at))
    if ((o.catheter_ml ?? 0) > 0) {
      day.cathyMl += o.catheter_ml ?? 0
      day.cathyCount += 1
    }
    day.pottyMl += o.potty_ml ?? 0
    if (o.nappy_was_dry) {
      day.dryNappies += 1
    } else if (o.nappy_weight_g != null) {
      day.nappyMl += Math.max(0, o.nappy_weight_g - NAPPY_TARE_G)
    }
    day.entries.push({ type: 'output', data: o, time: o.logged_at })
  }
  for (const m of medLogs) {
    const day = getDay(dayKey(m.given_at))
    day.medsGiven += 1
    day.entries.push({ type: 'medication', data: m, time: m.given_at })
  }
  for (const n of notes) {
    const day = getDay(dayKey(n.noted_at))
    day.entries.push({ type: 'note', data: n, time: n.noted_at })
  }

  for (const day of map.values()) {
    day.entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
}

// ============================================================
// Cathy sub-blocks (used inside an expanded day)
// ============================================================

export interface CathyBlock {
  cathy: OutputLog | null   // null = entries before the first cathy of the day
  endedAt: string | null    // when the next cathy ends this window (ISO)
  cathyMl: number           // cathy_ml of this block's anchor cathy
  fluidInMl: number         // fluids logged after this cathy, before the next
  pottyMl: number
  nappyMl: number
  dryNappies: number
  entries: LogEntry[]       // entries in this window, newest-first
}

export function buildCathyBlocksForDay(day: DayBlock): CathyBlock[] {
  // Work with chronological (oldest-first) entries for ranges
  const chrono = [...day.entries].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  )

  const cathyEntries = chrono.filter(
    e => e.type === 'output' && ((e.data as OutputLog).catheter_ml ?? 0) > 0
  )
  const cathyLogs = cathyEntries.map(e => e.data as OutputLog)

  // If no cathy that day, return a single block containing everything
  if (cathyLogs.length === 0) {
    return [makeBlock(null, null, day.entries)]
  }

  const blocks: CathyBlock[] = []

  // Iterate newest cathy first
  for (let i = cathyLogs.length - 1; i >= 0; i--) {
    const cathy = cathyLogs[i]
    const start = cathy.logged_at
    const end = cathyLogs[i + 1]?.logged_at ?? null

    const inWindow = chrono.filter(e => {
      if (e.time < start) return false
      if (e.type === 'output' && (e.data as OutputLog).id === cathy.id) return false
      if (end && e.time >= end) return false
      return true
    })

    blocks.push(makeBlock(cathy, end, [...inWindow].reverse()))
  }

  // Entries before the first cathy of the day go last
  const firstCathyTime = cathyLogs[0].logged_at
  const preEntries = chrono.filter(e => e.time < firstCathyTime)
  if (preEntries.length > 0) {
    blocks.push(makeBlock(null, firstCathyTime, [...preEntries].reverse()))
  }

  return blocks
}

function makeBlock(cathy: OutputLog | null, endedAt: string | null, entries: LogEntry[]): CathyBlock {
  let fluidInMl = 0
  let pottyMl = 0
  let nappyMl = 0
  let dryNappies = 0
  for (const e of entries) {
    if (e.type === 'fluid') {
      fluidInMl += (e.data as FluidLog).amount_ml ?? 0
    } else if (e.type === 'output') {
      const o = e.data as OutputLog
      pottyMl += o.potty_ml ?? 0
      if (o.nappy_was_dry) dryNappies += 1
      else if (o.nappy_weight_g != null) nappyMl += Math.max(0, o.nappy_weight_g - NAPPY_TARE_G)
    }
  }
  return {
    cathy,
    endedAt,
    cathyMl: cathy?.catheter_ml ?? 0,
    fluidInMl, pottyMl, nappyMl, dryNappies,
    entries,
  }
}
