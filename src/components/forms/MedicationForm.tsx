import { useState, useEffect } from 'react'
import { getMedications, logMedicationWithName, updateMedicationLog } from '../../lib/db'
import { useAuth } from '../../hooks/useAuth'
import { toLocalIso, fromLocalIso } from '../../utils'
import { Field, Input, Textarea, Select, SubmitButton } from '../ui/FormElements'
import type { Medication, MedicationLog } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  onSuccess: () => void
  initial?: MedicationLog
}

export function MedicationForm({ onSuccess, initial }: Props) {
  const { carer } = useAuth()
  const [medications, setMedications] = useState<Medication[]>([])
  const [selectedMed, setSelectedMed] = useState(initial?.medication_id ?? '')
  const [medName, setMedName] = useState(initial?.medication_name ?? '')
  const [dose, setDose] = useState(initial?.dose_given ?? '')
  const [givenAt, setGivenAt] = useState(initial ? toLocalIso(new Date(initial.given_at)) : toLocalIso())
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    getMedications().then(meds => {
      setMedications(meds)
      if (!initial && meds.length > 0) {
        setSelectedMed(meds[0].id)
        setMedName(meds[0].name)
        setDose(meds[0].dose)
      }
    })
  }, [initial])

  const handleMedChange = (id: string) => {
    setSelectedMed(id)
    const med = medications.find(m => m.id === id)
    if (med) { setMedName(med.name); setDose(med.dose) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer) return
    setIsLoading(true)
    try {
      if (initial) {
        await updateMedicationLog(initial.id, {
          medication_name: medName,
          dose_given: dose,
          given_at: fromLocalIso(givenAt),
          notes: notes || null,
        })
        toast.success('Entry updated ✓')
      } else {
        const med = medications.find(m => m.id === selectedMed)
        await logMedicationWithName(
          { medication_id: selectedMed, medication_name: med?.name ?? medName, dose_given: dose, given_at: fromLocalIso(givenAt), notes },
          carer.id
        )
        toast.success(`${medName} logged ✓`)
      }
      onSuccess()
    } catch {
      toast.error(initial ? 'Failed to update' : 'Failed to log medication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {initial ? (
        <Field label="Medication name">
          <Input value={medName} onChange={e => setMedName(e.target.value)} required />
        </Field>
      ) : (
        <Field label="Medication">
          <Select value={selectedMed} onChange={e => handleMedChange(e.target.value)} required>
            {medications.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Dose given" hint="Pre-filled from medication — change if needed">
        <Input value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 5ml" required />
      </Field>

      <Field label="Time given">
        <Input type="datetime-local" value={givenAt} onChange={e => setGivenAt(e.target.value)} required />
      </Field>

      <Field label="Notes (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations..." rows={2} />
      </Field>

      <SubmitButton
        isLoading={isLoading}
        label={initial ? 'Save changes' : 'Log Medication'}
        color="bg-purple-500 hover:bg-purple-600"
      />
    </form>
  )
}
