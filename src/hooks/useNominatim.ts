import { useState, useEffect } from 'react'

export interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  place_id: number
}

export function useNominatim(query: string, debounceMs = 350) {
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 3) {
      setResults([])
      return
    }

    setIsLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(trimmed)}`
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        })
        if (!res.ok) throw new Error('Nominatim error')
        const data = (await res.json()) as NominatimResult[]
        setResults(data)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([])
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, debounceMs])

  return { results, isLoading }
}
