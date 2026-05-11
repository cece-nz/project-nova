import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { AppointmentsWidget } from '../AppointmentsWidget'
import type { Appointment } from '../../../types'

vi.mock('../../../lib/appointments', () => ({
  getUpcomingAppointments: vi.fn(),
}))

import { getUpcomingAppointments } from '../../../lib/appointments'

const tomorrow = new Date(Date.now() + 86400000).toISOString()

const mockAppts: Appointment[] = [
  {
    id: 'appt-1',
    title: 'Urology checkup',
    medical_staff_id: null,
    appointment_date: tomorrow,
    duration_minutes: 30,
    mode: 'in_person',
    location: 'RCH',
    status: 'upcoming',
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

describe('AppointmentsWidget', () => {
  beforeEach(() => {
    vi.mocked(getUpcomingAppointments).mockResolvedValue([])
  })

  it('shows no appointments message when empty', async () => {
    render(<AppointmentsWidget onClick={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('No upcoming appointments')).toBeInTheDocument()
    })
  })

  it('shows appointment count and next appointment', async () => {
    vi.mocked(getUpcomingAppointments).mockResolvedValue(mockAppts)
    render(<AppointmentsWidget onClick={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('1 appointment booked')).toBeInTheDocument()
      expect(screen.getByText(/Urology checkup/)).toBeInTheDocument()
      expect(screen.getByText(/Tomorrow/)).toBeInTheDocument()
    })
  })

  it('calls onClick when tapped', async () => {
    const onClick = vi.fn()
    vi.mocked(getUpcomingAppointments).mockResolvedValue(mockAppts)
    render(<AppointmentsWidget onClick={onClick} />)
    await waitFor(() => screen.getByText('1 appointment booked'))
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
