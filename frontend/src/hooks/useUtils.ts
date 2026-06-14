import { useState, useEffect, useCallback } from 'react'

export function useSSE(url: string) {
  const [data, setData] = useState<any>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const es = new EventSource(url)
    es.onopen = () => setConnected(true)
    es.onmessage = e => {
      try { setData(JSON.parse(e.data)) } catch { setData(e.data) }
    }
    es.onerror = () => { setConnected(false); es.close() }
    return () => es.close()
  }, [url])

  return { data, connected }
}

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function usePagination() {
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const next = useCallback(() => setPage(p => p + 1), [])
  const prev = useCallback(() => setPage(p => Math.max(1, p - 1)), [])
  const reset = useCallback(() => setPage(1), [])
  return { page, limit, next, prev, reset }
}
