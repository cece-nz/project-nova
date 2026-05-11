import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { Carer } from '../types'

// Minimal carer fixtures
export const mockAdmin: Carer = {
  id: 'admin-1',
  name: 'Admin',
  pin_hash: '$2a$10$hash',
  role: 'admin',
  color: '#6366f1',
  created_at: '2025-01-01T00:00:00Z',
  is_active: true,
}

export const mockHelper: Carer = {
  id: 'helper-1',
  name: 'Helper',
  pin_hash: '$2a$10$hash',
  role: 'helper',
  color: '#10b981',
  created_at: '2025-01-01T00:00:00Z',
  is_active: true,
}

export const mockMedical: Carer = {
  id: 'medical-1',
  name: 'Dr Smith',
  pin_hash: '$2a$10$hash',
  role: 'medical',
  color: '#3b82f6',
  created_at: '2025-01-01T00:00:00Z',
  is_active: true,
}

// Re-export RTL utilities
export * from '@testing-library/react'

// Custom render (add providers here if needed in future)
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, options)
}
