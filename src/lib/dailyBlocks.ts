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
// Bladder-emptying sub-blocks (used inside an expanded day)
//
// Each cathy log CLOSES a window — the output drained at that
// moment represents what accumulated since the previous emptying.
// So the block "Bladder emptied at 2pm" contains the fluids, potty
// and nappy entries that happened BEFORE that cathy (back to the
// previous cathy or start of day).
// ============================================================

export interface BladderBlock {
  closingCathy: OutputLog | null   // the cathy that closed this window (null = trailing, no emptying yet)
  startedAt: string | null         // when this window opened (previous cathy time, or null = start of day)
  cathyMl: number                  // ml drained at the closing cathy
  fluidInMl: number                // intake within the window
  pottyMl: number                  // potty output within the window
  nappyMl: number                  // nappy output within the window (tare-adjusted)
  dryNappies: number
  entries: LogEntry[]              // entries in this window, newest-first
}

export function buildBladderBlocksForDay(day: DayBlock): BladderBlock[] {
  const chrono = [...day.entries].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  )

  const cathyLogs = chrono
    .filter(e => e.type === 'output' && ((e.data as OutputLog).catheter_ml ?? 0) > 0)
    .map(e => e.data as OutputLog)

  // No cathy that day → single trailing block with everything
  if (cathyLogs.length === 0) {
    return [makeBlock(null, null, day.entries)]
  }

  const blocks: BladderBlock[] = []

  // Trailing block: entries AFTER the day's last cathy (window not yet closed)
  const lastCathy = cathyLogs[cathyLogs.length - 1]
  const trailing = chrono.filter(e => e.time > lastCathy.logged_at)
  if (trailing.length > 0) {
    blocks.push(makeBlock(null, lastCathy.logged_at, [...trailing].reverse()))
  }

  // Each cathy closes a window from the previous cathy (or day start) to itself.
  // The closing cathy entry IS included in the window so any potty/nappy
  // recorded on the same row gets counted.
  for (let i = cathyLogs.length - 1; i >= 0; i--) {
    const cathy = cathyLogs[i]
    const prevCathyTime = cathyLogs[i - 1]?.logged_at ?? null
    const closeTime = cathy.logged_at

    const inWindow = chrono.filter(e => {
      if (prevCathyTime && e.time <= prevCathyTime) return false   // exclude prev cathy + earlier
      if (e.time > closeTime) return false                          // exclude later
      return true
    })

    blocks.push(makeBlock(cathy, prevCathyTime, [...inWindow].reverse()))
  }

  return blocks
}

function makeBlock(closingCathy: OutputLog | null, startedAt: string | null, entries: LogEntry[]): BladderBlock {
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
    closingCathy,
    startedAt,
    cathyMl: closingCathy?.catheter_ml ?? 0,
    fluidInMl, pottyMl, nappyMl, dryNappies,
    entries,
  }
}
