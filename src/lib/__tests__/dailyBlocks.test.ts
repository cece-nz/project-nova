import { describe, it, expect } from 'vitest'
import { buildDays, buildCathyBlocksForDay } from '../dailyBlocks'
import type { FluidLog, OutputLog, MedicationLog, GeneralNote } from '../../types'

function fluid(id: string, given_at: string, amount_ml: number, fluid_type: 'water' | 'milk' = 'water'): FluidLog {
  return { id, amount_ml, fluid_type, given_at, carer_id: null, notes: null, created_at: given_at }
}

function output(id: string, logged_at: string, opts: Partial<Omit<OutputLog, 'id' | 'logged_at'>> = {}): OutputLog {
  return {
    id, logged_at,
    nappy_weight_g: opts.nappy_weight_g ?? null,
    nappy_was_dry: opts.nappy_was_dry ?? false,
    catheter_ml: opts.catheter_ml ?? null,
    potty_ml: opts.potty_ml ?? null,
    carer_id: null, notes: null, created_at: logged_at,
  }
}

describe('buildDays', () => {
  it('returns empty when no logs', () => {
    expect(buildDays([], [], [], [])).toEqual([])
  })

  it('aggregates fluid intake per day', () => {
    const days = buildDays([
      fluid('f1', '2026-05-13T08:00:00Z', 200),
      fluid('f2', '2026-05-13T14:00:00Z', 150),
      fluid('f3', '2026-05-12T10:00:00Z', 100),
    ], [], [], [])

    expect(days).toHaveLength(2)
    expect(days[0].date).toBe('2026-05-13')
    expect(days[0].fluidInMl).toBe(350)
    expect(days[0].fluidEntries).toBe(2)
    expect(days[1].date).toBe('2026-05-12')
    expect(days[1].fluidInMl).toBe(100)
  })

  it('subtracts nappy tare (50g) from gross weight', () => {
    const days = buildDays([], [
      output('o1', '2026-05-13T08:00:00Z', { nappy_weight_g: 150 }),  // 150 - 50 = 100ml
      output('o2', '2026-05-13T12:00:00Z', { nappy_weight_g: 200 }),  // 200 - 50 = 150ml
      output('o3', '2026-05-13T16:00:00Z', { nappy_was_dry: true }),
    ], [], [])

    expect(days[0].nappyMl).toBe(250)
    expect(days[0].dryNappies).toBe(1)
  })

  it('counts cathy events and sums ml', () => {
    const days = buildDays([], [
      output('o1', '2026-05-13T08:00:00Z', { catheter_ml: 200 }),
      output('o2', '2026-05-13T12:00:00Z', { catheter_ml: 150 }),
      output('o3', '2026-05-13T16:00:00Z', { potty_ml: 50 }),  // not a cathy
    ], [], [])

    expect(days[0].cathyMl).toBe(350)
    expect(days[0].cathyCount).toBe(2)
    expect(days[0].pottyMl).toBe(50)
  })

  it('sorts days newest-first', () => {
    const days = buildDays([
      fluid('f1', '2026-05-10T08:00:00Z', 100),
      fluid('f2', '2026-05-13T08:00:00Z', 100),
      fluid('f3', '2026-05-12T08:00:00Z', 100),
    ], [], [], [])

    expect(days.map(d => d.date)).toEqual(['2026-05-13', '2026-05-12', '2026-05-10'])
  })

  it('counts meds given that day', () => {
    const meds: MedicationLog[] = [
      { id: 'm1', medication_id: null, medication_name: 'Oxybutynin', dose_given: '5ml',
        given_at: '2026-05-13T08:00:00Z', carer_id: null, notes: null, created_at: '2026-05-13T08:00:00Z' },
      { id: 'm2', medication_id: null, medication_name: 'Oxybutynin', dose_given: '5ml',
        given_at: '2026-05-13T14:00:00Z', carer_id: null, notes: null, created_at: '2026-05-13T14:00:00Z' },
    ]
    const days = buildDays([], [], meds, [])
    expect(days[0].medsGiven).toBe(2)
  })

  it('includes notes in entries list', () => {
    const notes: GeneralNote[] = [
      { id: 'n1', noted_at: '2026-05-13T10:00:00Z', content: 'Slept well', category: 'sleep',
        carer_id: null, created_at: '2026-05-13T10:00:00Z' },
    ]
    const days = buildDays([], [], [], notes)
    expect(days[0].entries).toHaveLength(1)
    expect(days[0].entries[0].type).toBe('note')
  })
})

describe('buildCathyBlocksForDay', () => {
  it('returns a single block when no cathy that day', () => {
    const days = buildDays([fluid('f1', '2026-05-13T10:00:00Z', 200)], [], [], [])
    const blocks = buildCathyBlocksForDay(days[0])
    expect(blocks).toHaveLength(1)
    expect(blocks[0].cathy).toBeNull()
    expect(blocks[0].fluidInMl).toBe(200)
  })

  it('groups entries between consecutive cathy events', () => {
    const days = buildDays([
      fluid('f1', '2026-05-13T09:00:00Z', 100),  // before cathy at 10
      fluid('f2', '2026-05-13T11:00:00Z', 200),  // after cathy at 10, before cathy at 14
      fluid('f3', '2026-05-13T15:00:00Z', 150),  // after cathy at 14
    ], [
      output('c1', '2026-05-13T10:00:00Z', { catheter_ml: 200 }),
      output('c2', '2026-05-13T14:00:00Z', { catheter_ml: 250 }),
    ], [], [])

    const blocks = buildCathyBlocksForDay(days[0])

    // Newest cathy first, then older, then 'before first cathy'
    expect(blocks).toHaveLength(3)
    expect(blocks[0].cathy?.id).toBe('c2')
    expect(blocks[0].fluidInMl).toBe(150)
    expect(blocks[1].cathy?.id).toBe('c1')
    expect(blocks[1].fluidInMl).toBe(200)
    expect(blocks[2].cathy).toBeNull()
    expect(blocks[2].fluidInMl).toBe(100)
  })

  it('excludes the cathy log itself from its block entries', () => {
    const days = buildDays([], [
      output('c1', '2026-05-13T10:00:00Z', { catheter_ml: 200 }),
      output('p1', '2026-05-13T11:00:00Z', { potty_ml: 50 }),
    ], [], [])

    const blocks = buildCathyBlocksForDay(days[0])
    expect(blocks).toHaveLength(1)
    expect(blocks[0].entries.find(e => e.data.id === 'c1')).toBeUndefined()
    expect(blocks[0].entries.find(e => e.data.id === 'p1')).toBeDefined()
    expect(blocks[0].pottyMl).toBe(50)
  })
})
