import { useState } from 'react'
import { logOutput, updateOutputLog } from '../../lib/db'
import { useAuth } from '../../hooks/useAuth'
import { toLocalIso, fromLocalIso, NAPPY_TARE_G } from '../../utils'
import { Field, Input, Textarea, SubmitButton, Toggle, NumberInput } from '../ui/FormElements'
import type { OutputLog } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  onSuccess: () => void
  initial?: OutputLog
}

export function OutputForm({ onSuccess, initial }: Props) {
  const { carer } = useAuth()
  const [loggedAt, setLoggedAt] = useState(initial ? toLocalIso(new Date(initial.logged_at)) : toLocalIso())
  const [nappyDry, setNappyDry] = useState(initial?.nappy_was_dry ?? false)
  const [nappyWeight, setNappyWeight] = useState(initial?.nappy_weight_g != null ? String(initial.nappy_weight_g) : '')
  const [catheterMl, setCatheterMl] = useState(initial?.catheter_ml != null ? String(initial.catheter_ml) : '')
  const [pottyMl, setPottyMl] = useState(initial?.potty_ml != null ? String(initial.potty_ml) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return
    setIsLoading(true)
    try {
      const payload = {
        logged_at: fromLocalIso(loggedAt),
        nappy_was_dry: nappyDry,
        nappy_weight_g: nappyDry ? null : (nappyWeight ? parseInt(nappyWeight) : null),
        catheter_ml: catheterMl ? parseInt(catheterMl) : null,
        potty_ml: pottyMl ? parseInt(pottyMl) : null,
        notes: notes || null,
      }
      if (initial) {
        await updateOutputLog(initial.id, payload)
        toast.success('Entry updated ✓')
      } else {
        await logOutput(
          { logged_at: payload.logged_at, nappy_was_dry: nappyDry, nappy_weight_g: nappyWeight, catheter_ml: catheterMl, potty_ml: pottyMl, notes },
          carer.id
        )
        toast.success('Output logged ✓')
      }
      onSuccess()
    } catch {
      toast.error(initial ? 'Failed to update' : 'Failed to log output')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Time">
        <Input type="datetime-local" value={loggedAt} onChange={e => setLoggedAt(e.target.value)} required />
      </Field>

      {/* Nappy */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">🩲 Nappy</p>
        <div className="bg-gray-50 rounded-2xl p-3 space-y-3">
          <Toggle checked={nappyDry} onChange={setNappyDry} label="Nappy was dry" />
          {!nappyDry && (
            <Field label="Nappy weight" hint={`Weigh the wet nappy — empty nappy is ~${NAPPY_TARE_G}g`}>
              <NumberInput value={nappyWeight} onChange={setNappyWeight} step={10} min={0} max={2000} unit="g" placeholder="0" />
            </Field>
          )}
        </div>
      </div>

      {/* Catheter */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">🩺 Catheter</p>
        <div className="bg-gray-50 rounded-2xl p-3">
          <Field label="Amount drained" hint="Leave blank if catheter was not emptied">
            <NumberInput value={catheterMl} onChange={setCatheterMl} step={10} min={0} max={2000} unit="ml" placeholder="0" />
          </Field>
        </div>
      </div>

      {/* Potty */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">🪣 Potty</p>
        <div className="bg-gray-50 rounded-2xl p-3">
          <Field label="Amount" hint="Leave blank if nothing in potty">
            <NumberInput value={pottyMl} onChange={setPottyMl} step={5} min={0} max={1000} unit="ml" placeholder="0" />
          </Field>
        </div>
      </div>

      <Field label="Notes (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Colour, consistency, anything unusual..." rows={2} />
      </Field>

      <SubmitButton
        isLoading={isLoading}
        label={initial ? 'Save changes' : 'Log Output'}
        color="bg-emerald-500 hover:bg-emerald-600"
      />
    </form>
  )
}
