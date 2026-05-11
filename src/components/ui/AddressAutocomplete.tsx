import { useState, useRef, useEffect } from 'react'
import { useNominatim } from '../../hooks/useNominatim'
import { MapPin, Loader2 } from 'lucide-react'

export interface AddressValue {
  address: string
  latitude: number | null
  longitude: number | null
}

interface AddressAutocompleteProps {
  value: string
  onChange: (val: AddressValue) => void
  placeholder?: string
  required?: boolean
}

export function AddressAutocomplete({ value, onChange, placeholder = 'Start typing an address…', required }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [hasSelected, setHasSelected] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  const { results, isLoading } = useNominatim(hasSelected ? '' : query)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleSelect = (r: { display_name: string; lat: string; lon: string }) => {
    setQuery(r.display_name)
    setHasSelected(true)
    setIsOpen(false)
    onChange({
      address: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    })
  }

  const handleType = (v: string) => {
    setQuery(v)
    setHasSelected(false)
    setIsOpen(true)
    // No coords yet — pass the raw string up so submission still works if no result selected
    onChange({ address: v, latitude: null, longitude: null })
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => handleType(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          placeholder={placeholder}
          required={required}
          className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-nova-300 focus:border-nova-300"
        />
        {isLoading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.map(r => (
            <button
              type="button"
              key={r.place_id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-nova-50 border-b border-gray-100 last:border-0"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      {query.trim().length > 0 && query.trim().length < 3 && (
        <p className="mt-1 text-xs text-gray-400">Type 3+ characters to search</p>
      )}
    </div>
  )
}
