import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatsBar } from '../StatsBar'
import type { DailyStats } from '../../../types'

const mockStats: DailyStats = {
  totalFluidMl: 450,
  fluidEntries: 3,
  totalCatheterMl: 200,
  totalPottyMl: 80,
  totalNappyG: 120,
  outputEntries: 2,
  medicationsGiven: 4,
  lastOutputAt: '2025-05-11T10:00:00Z',
}

describe('StatsBar', () => {
  it('renders loading skeletons when isLoading', () => {
    const { container } = render(<StatsBar stats={null} isLoading={true} />)
    const pulseEls = container.querySelectorAll('.animate-pulse')
    expect(pulseEls.length).toBe(3)
  })

  it('renders stat values from props', () => {
    render(<StatsBar stats={mockStats} isLoading={false} />)
    expect(screen.getByText('450ml')).toBeInTheDocument()
    expect(screen.getByText('200ml')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows Cathy out label (not Catheter)', () => {
    render(<StatsBar stats={mockStats} isLoading={false} />)
    expect(screen.getByText('Cathy out')).toBeInTheDocument()
    expect(screen.queryByText(/catheter/i)).not.toBeInTheDocument()
  })

  it('shows dash when stats are null', () => {
    render(<StatsBar stats={null} isLoading={false} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(3)
  })

  it('calls onOutputClick when output card is tapped', () => {
    const handler = vi.fn()
    render(<StatsBar stats={mockStats} isLoading={false} onOutputClick={handler} />)
    fireEvent.click(screen.getByText('Cathy out').closest('button')!)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('calls onFluidClick when fluid card is tapped', () => {
    const handler = vi.fn()
    render(<StatsBar stats={mockStats} isLoading={false} onFluidClick={handler} />)
    fireEvent.click(screen.getByText('Fluid in').closest('button')!)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('calls onMedClick when med card is tapped', () => {
    const handler = vi.fn()
    render(<StatsBar stats={mockStats} isLoading={false} onMedClick={handler} />)
    fireEvent.click(screen.getByText('Meds').closest('button')!)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('output card appears before fluid card in DOM', () => {
    const { container } = render(<StatsBar stats={mockStats} isLoading={false} />)
    const html = container.innerHTML
    const outputIdx = html.indexOf('Cathy out')
    const fluidIdx = html.indexOf('Fluid in')
    expect(outputIdx).toBeGreaterThan(-1)
    expect(fluidIdx).toBeGreaterThan(-1)
    expect(outputIdx).toBeLessThan(fluidIdx)
  })
})
