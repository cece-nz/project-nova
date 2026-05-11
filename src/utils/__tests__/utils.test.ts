import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCountdownInfo, formatTime, formatDate, NAPPY_TARE_G, FLUID_TYPES, NOTE_CATEGORIES } from '../index'

describe('getCountdownInfo', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns overdue when no last output', () => {
    const result = getCountdownInfo(null)
    expect(result.isOverdue).toBe(true)
    expect(result.label).toBe('No record — check now')
    expect(result.percentage).toBe(100)
  })

  it('returns remaining time within the 4h window', () => {
    vi.setSystemTime(new Date('2025-05-11T10:00:00Z'))
    const lastAt = new Date('2025-05-11T08:00:00Z').toISOString()
    const result = getCountdownInfo(lastAt)
    expect(result.isOverdue).toBe(false)
    expect(result.percentage).toBe(50)
    expect(result.label).toMatch(/2h 0m remaining/)
  })

  it('returns overdue when past 4h window', () => {
    vi.setSystemTime(new Date('2025-05-11T13:30:00Z'))
    const lastAt = new Date('2025-05-11T08:00:00Z').toISOString()
    const result = getCountdownInfo(lastAt)
    expect(result.isOverdue).toBe(true)
    expect(result.label).toMatch(/Overdue by/)
  })

  it('percentage is capped at 100 when overdue', () => {
    vi.setSystemTime(new Date('2025-05-11T20:00:00Z'))
    const lastAt = new Date('2025-05-11T08:00:00Z').toISOString()
    const result = getCountdownInfo(lastAt)
    expect(result.percentage).toBe(100)
  })

  it('percentage is 0 immediately after logging', () => {
    const now = new Date('2025-05-11T10:00:00Z')
    vi.setSystemTime(now)
    const result = getCountdownInfo(now.toISOString())
    expect(result.percentage).toBe(0)
    expect(result.isOverdue).toBe(false)
  })
})

describe('formatTime', () => {
  it('formats ISO string to 12h time', () => {
    expect(formatTime('2025-05-11T14:30:00.000Z')).toMatch(/\d+:\d+ [AP]M/)
  })
})

describe('formatDate', () => {
  it('formats ISO string to readable date', () => {
    const result = formatDate('2025-05-11T00:00:00.000Z')
    expect(result).toMatch(/\w+ \d+ \w+/)
  })
})

describe('constants', () => {
  it('NAPPY_TARE_G is 50', () => {
    expect(NAPPY_TARE_G).toBe(50)
  })

  it('FLUID_TYPES has expected values', () => {
    const values = FLUID_TYPES.map(f => f.value)
    expect(values).toContain('water')
    expect(values).toContain('milk')
    expect(values).toContain('formula')
  })

  it('NOTE_CATEGORIES has expected values', () => {
    const values = NOTE_CATEGORIES.map(c => c.value)
    expect(values).toContain('general')
    expect(values).toContain('health')
    expect(values).toContain('behaviour')
  })
})
