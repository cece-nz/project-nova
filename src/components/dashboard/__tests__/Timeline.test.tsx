import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Timeline } from '../Timeline'
import type { LogEntry } from '../../../types'

vi.mock('../../../lib/db', () => ({
  deleteEntry: vi.fn().mockResolvedValue(undefined),
}))

const medEntry: LogEntry = {
  type: 'medication',
  time: '2025-05-11T08:00:00Z',
  data: {
    id: 'med-1', medication_id: null, medication_name: 'Oxybutynin',
    dose_given: '5ml', given_at: '2025-05-11T08:00:00Z',
    carer_id: null, notes: null, created_at: '2025-05-11T08:00:00Z',
  },
}

const fluidEntry: LogEntry = {
  type: 'fluid',
  time: '2025-05-11T09:00:00Z',
  data: {
    id: 'fluid-1', amount_ml: 200, fluid_type: 'water',
    given_at: '2025-05-11T09:00:00Z', carer_id: null, notes: null,
    created_at: '2025-05-11T09:00:00Z',
  },
}

const outputEntry: LogEntry = {
  type: 'output',
  time: '2025-05-11T10:00:00Z',
  data: {
    id: 'out-1', logged_at: '2025-05-11T10:00:00Z',
    catheter_ml: 150, potty_ml: 50, nappy_weight_g: null,
    nappy_was_dry: false, carer_id: null, notes: null,
    created_at: '2025-05-11T10:00:00Z',
  },
}

const noteEntry: LogEntry = {
  type: 'note',
  time: '2025-05-11T11:00:00Z',
  data: {
    id: 'note-1', noted_at: '2025-05-11T11:00:00Z',
    content: 'Nova seemed happy today', category: 'general',
    carer_id: null, created_at: '2025-05-11T11:00:00Z',
  },
}

describe('Timeline', () => {
  it('shows loading skeletons', () => {
    const { container } = render(
      <Timeline entries={[]} isLoading={true} onRefresh={vi.fn()} canDelete={false} />
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('shows empty state when no entries', () => {
    render(<Timeline entries={[]} isLoading={false} onRefresh={vi.fn()} canDelete={false} />)
    expect(screen.getByText(/No entries yet today/i)).toBeInTheDocument()
  })

  it('renders medication entry', () => {
    render(<Timeline entries={[medEntry]} isLoading={false} onRefresh={vi.fn()} canDelete={false} />)
    expect(screen.getByText('Oxybutynin')).toBeInTheDocument()
    expect(screen.getByText('5ml')).toBeInTheDocument()
  })

  it('renders fluid entry with amount', () => {
    render(<Timeline entries={[fluidEntry]} isLoading={false} onRefresh={vi.fn()} canDelete={false} />)
    expect(screen.getByText('200ml fluid')).toBeInTheDocument()
    expect(screen.getByText('Water')).toBeInTheDocument()
  })

  it('renders output entry using Cathy label (not Catheter)', () => {
    render(<Timeline entries={[outputEntry]} isLoading={false} onRefresh={vi.fn()} canDelete={false} />)
    expect(screen.getByText(/Cathy 150ml/)).toBeInTheDocument()
    expect(screen.queryByText(/Catheter/)).not.toBeInTheDocument()
  })

  it('renders note content', () => {
    render(<Timeline entries={[noteEntry]} isLoading={false} onRefresh={vi.fn()} canDelete={false} />)
    expect(screen.getByText(/Nova seemed happy today/)).toBeInTheDocument()
  })

  it('does not show delete button when canDelete is false', () => {
    render(<Timeline entries={[medEntry]} isLoading={false} onRefresh={vi.fn()} canDelete={false} />)
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows edit button when onEdit is provided', () => {
    const onEdit = vi.fn()
    render(
      <Timeline entries={[medEntry]} isLoading={false} onRefresh={vi.fn()} canDelete={true} onEdit={onEdit} />
    )
    const pencilButtons = document.querySelectorAll('button')
    expect(pencilButtons.length).toBeGreaterThan(1)
  })

  it('calls onEdit with correct entry when edit is clicked', () => {
    const onEdit = vi.fn()
    render(
      <Timeline entries={[medEntry]} isLoading={false} onRefresh={vi.fn()} canDelete={true} onEdit={onEdit} />
    )
    // First button in entry is edit (pencil), second is delete
    const buttons = document.querySelectorAll('.p-1')
    fireEvent.click(buttons[0])
    expect(onEdit).toHaveBeenCalledWith(medEntry)
  })

  it('renders multiple entries', () => {
    render(
      <Timeline
        entries={[medEntry, fluidEntry, outputEntry, noteEntry]}
        isLoading={false}
        onRefresh={vi.fn()}
        canDelete={false}
      />
    )
    expect(screen.getByText('Oxybutynin')).toBeInTheDocument()
    expect(screen.getByText('200ml fluid')).toBeInTheDocument()
    expect(screen.getByText('Output check')).toBeInTheDocument()
    expect(screen.getByText('Note')).toBeInTheDocument()
  })
})
