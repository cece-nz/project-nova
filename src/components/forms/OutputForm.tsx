import { useState } from 'react'
import { logOutput } from '../../lib/db'
import { useAuth } from '../../hooks/useAuth'
import { toLocalIso, fromLocalIso } from '../../utils'
import { Field, Input, Textarea, SubmitButton, Toggle, NumberInput } from '../ui/FormElements'
import toast from 'react-hot-toast'

interface Props {
  onSuccess: () => void
}

export function OutputForm({ onSuccess }: Props) {
  const { carer } = useAuth()
  const [loggedAt, setLoggedAt] = useState(toLocalIso())
  const [nappyDry, setNappyDry] = useState(false)
  const [nappyWeight, setNappyWeight] = useState('')
  const [catheterMl, setCatheterMl] = useState('')
  const [pottyMl, setPottyMl] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return

    setIsLoading(true)
    try {
      await logOutput(
        {
          logged_at: fromLocalIso(loggedAt),
          nappy_was_dry: nappyDry,
          nappy_weight_g: nappyWeight,
          catheter_ml: catheterMl,
          potty_ml: pottyMl,
          notes,
        },
        carer.id
      )
      toast.success('Output logged ✓')
      onSuccess()
    } catch {
      toast.error('Failed to log output')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Time">
        <Input
          type="datetime-local"
          value={loggedAt}
          onChange={e => setLoggedAt(e.target.value)}
          required
        />
      </Field>

      {/* Nappy */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">🩲 Nappy</p>
        <div className="bg-gray-50 rounded-2xl p-3 space-y-3">
          <Toggle
            checked={nappyDry}
            onChange={setNappyDry}
            label="Nappy was dry"
          />
          {!nappyDry && (
            <Field label="Nappy weight" hint="Weigh the wet nappy in grams">
              <NumberInput
                value={nappyWeight}
                onChange={setNappyWeight}
                step={10}
                min={0}
                max={2000}
                unit="g"
                placeholder="0"
              />
            </Field>
          )}
        </div>
      </div>

      {/* Catheter */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">🩺 Catheter</p>
        <div className="bg-gray-50 rounded-2xl p-3">
          <Field label="Amount drained" hint="Leave blank if catheter was not emptied">
            <NumberInput
              value={catheterMl}
              onChange={setCatheterMl}
              step={10}
              min={0}
              max={2000}
              unit="ml"
              placeholder="0"
            />
          </Field>
        </div>
      </div>

      {/* Potty */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">🪣 Potty</p>
        <div className="bg-gray-50 rounded-2xl p-3">
          <Field label="Amount" hint="Leave blank if nothing in potty">
            <NumberInput
              value={pottyMl}
              onChange={setPottyMl}
              step={5}
              min={0}
              max={1000}
              unit="ml"
              placeholder="0"
            />
          </Field>
        </div>
      </div>

      <Field label="Notes (optional)">
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Colour, consistency, anything unusual..."
          rows={2}
        />
      </Field>

      <SubmitButton
        isLoading={isLoading}
        label="Log Output"
        color="bg-emerald-500 hover:bg-emerald-600"
      />
    </form>
  )
}
