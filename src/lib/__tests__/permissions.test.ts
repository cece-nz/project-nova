import { describe, it, expect } from 'vitest'
import { can } from '../permissions'

describe('can.deleteEntry', () => {
  it('allows admin', () => expect(can.deleteEntry('admin')).toBe(true))
  it('blocks medical', () => expect(can.deleteEntry('medical')).toBe(false))
  it('blocks helper', () => expect(can.deleteEntry('helper')).toBe(false))
  it('blocks undefined', () => expect(can.deleteEntry(undefined)).toBe(false))
})

describe('can.logEntry', () => {
  it('allows admin', () => expect(can.logEntry('admin')).toBe(true))
  it('allows helper', () => expect(can.logEntry('helper')).toBe(true))
  it('blocks medical', () => expect(can.logEntry('medical')).toBe(false))
})

describe('can.manageAdmin', () => {
  it('allows admin', () => expect(can.manageAdmin('admin')).toBe(true))
  it('blocks helper', () => expect(can.manageAdmin('helper')).toBe(false))
  it('blocks medical', () => expect(can.manageAdmin('medical')).toBe(false))
})

describe('can.viewAppointmentDetail', () => {
  it('allows admin', () => expect(can.viewAppointmentDetail('admin')).toBe(true))
  it('allows medical', () => expect(can.viewAppointmentDetail('medical')).toBe(true))
  it('blocks helper', () => expect(can.viewAppointmentDetail('helper')).toBe(false))
})

describe('can.editDailySummary', () => {
  it('allows admin', () => expect(can.editDailySummary('admin')).toBe(true))
  it('blocks medical', () => expect(can.editDailySummary('medical')).toBe(false))
  it('blocks helper', () => expect(can.editDailySummary('helper')).toBe(false))
})

describe('can.viewAppointments', () => {
  it('allows admin', () => expect(can.viewAppointments('admin')).toBe(true))
  it('allows medical', () => expect(can.viewAppointments('medical')).toBe(true))
  it('blocks helper', () => expect(can.viewAppointments('helper')).toBe(false))
})

describe('can.viewPersonNotes', () => {
  it('allows admin', () => expect(can.viewPersonNotes('admin')).toBe(true))
  it('blocks medical', () => expect(can.viewPersonNotes('medical')).toBe(false))
  it('blocks helper', () => expect(can.viewPersonNotes('helper')).toBe(false))
})

describe('can.exportData', () => {
  it('allows admin', () => expect(can.exportData('admin')).toBe(true))
  it('allows medical', () => expect(can.exportData('medical')).toBe(true))
  it('blocks helper', () => expect(can.exportData('helper')).toBe(false))
})
