import { useState } from 'react'
import { logFluid, updateFluidLog } from '../../lib/db'
import { useAuth } from '../../hooks/useAuth'
import { toLocalIso, fromLocalIso, FLUID_TYPES } from '../../utils'
import { Field, Input, Textarea, SubmitButton, ChipGroup, NumberInput } from '../ui/FormElements'
import type { FluidLog, FluidType } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  onSuccess: () => void
  initial?: FluidLog
}

export function FluidForm({ onSuccess, initial }: Props) {
  const { carer } = useAuth()
  const [amountMl, setAmountMl] = useState(initial ? String(initial.amount_ml) : '100')
  const [fluidType, setFluidType] = useState<FluidType>(initial?.fluid_type ?? 'water')
  const [givenAt, setGivenAt] = useState(initial ? toLocalIso(new Date(initial.given_at)) : toLocalIso())
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return
    setIsLoading(true)
    try {
      if (initial) {
        await updateFluidLog(initial.id, {
          amount_ml: parseInt(amountMl),
          fluid_type: fluidType,
          given_at: fromLocalIso(givenAt),
          notes: notes || null,
        })
        toast.success('Entry updated ✓')
      } else {
        await logFluid({ amount_ml: amountMl, fluid_type: fluidType, given_at: fromLocalIso(givenAt), notes }, carer.id)
        toast.success(`${amountMl}ml logged ✓`)
      }
      onSuccess()
    } catch {
      toast.error(initial ? 'Failed to update' : 'Failed to log fluid')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Amount">
        <NumberInput value={amountMl} onChange={setAmountMl} step={10} min={0} max={2000} unit="ml" />
      </Field>

      <Field label="Type">
        <ChipGroup
          options={FLUID_TYPES as unknown as { value: FluidType; label: string; emoji?: string }[]}
          value={fluidType}
          onChange={setFluidType}
        />
      </Field>

      <Field label="Time">
        <Input type="datetime-local" value={givenAt} onChange={e => setGivenAt(e.target.value)} required />
      </Field>

      <Field label="Notes (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations..." rows={2} />
      </Field>

      <SubmitButton
        isLoading={isLoading}
        label={initial ? 'Save changes' : 'Log Fluid'}
        color="bg-blue-500 hover:bg-blue-600"
      />
    </form>
  )
}
