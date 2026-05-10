import { useState } from 'react'
import { logNote } from '../../lib/db'
import { useAuth } from '../../hooks/useAuth'
import { toLocalIso, fromLocalIso, NOTE_CATEGORIES } from '../../utils'
import { Field, Input, Textarea, SubmitButton, ChipGroup } from '../ui/FormElements'
import type { NoteCategory } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  onSuccess: () => void
}

export function NoteForm({ onSuccess }: Props) {
  const { carer } = useAuth()
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<NoteCategory>('general')
  const [notedAt, setNotedAt] = useState(toLocalIso())
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carer || !content.trim()) return

    setIsLoading(true)
    try {
      await logNote(
        { content: content.trim(), category, noted_at: fromLocalIso(notedAt) },
        carer.id
      )
      toast.success('Note saved ✓')
      onSuccess()
    } catch {
      toast.error('Failed to save note')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Category">
        <ChipGroup
          options={NOTE_CATEGORIES as unknown as { value: NoteCategory; label: string; emoji?: string }[]}
          value={category}
          onChange={setCategory}
        />
      </Field>

      <Field label="Note">
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your note here..."
          rows={4}
          required
          autoFocus
        />
      </Field>

      <Field label="Time">
        <Input
          type="datetime-local"
          value={notedAt}
          onChange={e => setNotedAt(e.target.value)}
          required
        />
      </Field>

      <SubmitButton
        isLoading={isLoading}
        label="Save Note"
        color="bg-amber-500 hover:bg-amber-600"
      />
    </form>
  )
}
