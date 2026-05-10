import { useState, useEffect } from 'react'
import { getMedications, logMedicationWithName } from '../../lib/db'
import { useAuth } from '../../hooks/useAuth'
import { toLocalIso, fromLocalIso } from '../../utils'
import { Field, Input, Textarea, Select, SubmitButton } from '../ui/FormElements'
import type { Medication } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  onSuccess: () => void
}

export function MedicationForm({ onSuccess }: Props) {
  const { carer } = useAuth()
  const [medications, setMedications] = useState<Medication[]>([])
  const [selectedMed, setSelectedMed] = useState('')
  const [dose, setDose] = useState('')
  const [givenAt, setGivenAt] = useState(toLocalIso())
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    getMedications().then(meds => {
      setMedications(meds)
      if (meds.length > 0) {
        setSelectedMed(meds[0].id)
        setDose(meds[0].dose)
      }
    })
  }, [])

  const handleMedChange = (id: string) => {
    setSelectedMed(id)
    const med = medications.find(m => m.id === id)
    if (med) setDose(med.dose)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return
    const med = medications.find(m => m.id === selectedMed)
    if (!med) return

    setIsLoading(true)
    try {
      await logMedicationWithName(
        {
          medication_id: selectedMed,
          medication_name: med.name,
          dose_given: dose,
          given_at: fromLocalIso(givenAt),
          notes,
        },
        carer.id
      )
      toast.success(`${med.name} logged ✓`)
      onSuccess()
    } catch {
      toast.error('Failed to log medication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Medication">
        <Select value={selectedMed} onChange={e => handleMedChange(e.target.value)} required>
          {medications.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
      </Field>

      <Field label="Dose given" hint="Pre-filled from medication — change if needed">
        <Input
          value={dose}
          onChange={e => setDose(e.target.value)}
          placeholder="e.g. 5ml"
          required
        />
      </Field>

      <Field label="Time given">
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
        label="Log Medication"
        color="bg-purple-500 hover:bg-purple-600"
      />
    </form>
  )
}
