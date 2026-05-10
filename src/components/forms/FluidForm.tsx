import { useState } from 'react'
import { logFluid } from '../../lib/db'
import { useAuth } from '../../hooks/useAuth'
import { toLocalIso, fromLocalIso, FLUID_TYPES } from '../../utils'
import { Field, Input, Textarea, SubmitButton, ChipGroup, NumberInput } from '../ui/FormElements'
import type { FluidType } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  onSuccess: () => void
}

export function FluidForm({ onSuccess }: Props) {
  const { carer } = useAuth()
  const [amountMl, setAmountMl] = useState('100')
  const [fluidType, setFluidType] = useState<FluidType>('water')
  const [givenAt, setGivenAt] = useState(toLocalIso())
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return

    setIsLoading(true)
    try {
      await logFluid(
        { amount_ml: amountMl, fluid_type: fluidType, given_at: fromLocalIso(givenAt), notes },
        carer.id
      )
      toast.success(`${amountMl}ml logged ✓`)
      onSuccess()
    } catch {
      toast.error('Failed to log fluid')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Amount">
        <NumberInput
          value={amountMl}
          onChange={setAmountMl}
          step={10}
          min={0}
          max={2000}
          unit="ml"
        />
      </Field>

      <Field label="Type">
        <ChipGroup
          options={FLUID_TYPES as unknown as { value: FluidType; label: string; emoji?: string }[]}
          value={fluidType}
          onChange={setFluidType}
        />
      </Field>

      <Field label="Time">
        <Input
          type="datetime-local"
          value={givenAt}
          onChange={e => setGivenAt(e.target.value)}
          required
        />
      </Field>

      <Field label="Notes (optional)">
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any observations..."
          rows={2}
        />
      </Field>

      <SubmitButton
        isLoading={isLoading}
        label="Log Fluid"
        color="bg-blue-500 hover:bg-blue-600"
      />
    </form>
  )
}
