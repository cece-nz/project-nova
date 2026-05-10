import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'

interface FieldProps {
  label: string
  children: ReactNode
  hint?: string
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm
        focus:outline-none focus:ring-2 focus:ring-nova-300 focus:border-nova-400 focus:bg-white
        transition-all placeholder:text-gray-400 ${className}`}
    />
  )
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm
        focus:outline-none focus:ring-2 focus:ring-nova-300 focus:border-nova-400 focus:bg-white
        transition-all placeholder:text-gray-400 resize-none ${className}`}
    />
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm
        focus:outline-none focus:ring-2 focus:ring-nova-300 focus:border-nova-400 focus:bg-white
        transition-all ${className}`}
    >
      {children}
    </select>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all ${
        checked
          ? 'border-nova-400 bg-nova-50'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div
        className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${
          checked ? 'bg-nova-500' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
            checked ? 'right-1' : 'left-1'
          }`}
        />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  )
}

interface SubmitButtonProps {
  isLoading: boolean
  label: string
  loadingLabel?: string
  color?: string
}

export function SubmitButton({ isLoading, label, loadingLabel = 'Saving...', color = 'bg-nova-500 hover:bg-nova-600' }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`w-full py-4 rounded-2xl text-white font-semibold text-base ${color}
        disabled:opacity-60 active:scale-98 transition-all mt-2`}
    >
      {isLoading ? loadingLabel : label}
    </button>
  )
}

interface ChipGroupProps<T extends string> {
  options: { value: T; label: string; emoji?: string }[]
  value: T
  onChange: (value: T) => void
}

export function ChipGroup<T extends string>({ options, value, onChange }: ChipGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
            value === opt.value
              ? 'bg-nova-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {opt.emoji && <span className="mr-1">{opt.emoji}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// Large number input with +/- buttons (great for mobile)
interface NumberInputProps {
  value: string
  onChange: (v: string) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  placeholder?: string
}

export function NumberInput({ value, onChange, step = 10, min = 0, max = 9999, unit, placeholder }: NumberInputProps) {
  const num = parseInt(value) || 0

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(String(Math.max(min, num - step)))}
        className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 font-bold text-xl flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
      >
        −
      </button>
      <div className="flex-1 relative">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min}
          max={max}
          placeholder={placeholder || '0'}
          className="w-full text-center px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-lg font-semibold
            focus:outline-none focus:ring-2 focus:ring-nova-300 focus:border-nova-400"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{unit}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(String(Math.min(max, num + step)))}
        className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 font-bold text-xl flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
      >
        +
      </button>
    </div>
  )
}
