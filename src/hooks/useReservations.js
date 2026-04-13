import { useState, useEffect, useCallback, useRef } from 'react'
import { Store } from '../data/store'

/**
 * Fetches reservations from the file API and polls every `interval` ms.
 * The PHP / Vite file system is the source of truth — localStorage is just a warm cache.
 *
 * @param {object}  opts
 * @param {string}  opts.clientEmail   – filter to a single client (optional)
 * @param {boolean} opts.includeTrash  – include soft-deleted reservations (default false)
 * @param {number}  opts.interval      – polling interval in ms (default 30 000)
 */
export function useReservations({ clientEmail, includeTrash = false, interval = 30000 } = {}) {
  const [reservations, setReservations] = useState(
    () => {
      const base = includeTrash ? Store.getAllReservations() : Store.getReservations()
      return clientEmail ? base.filter(r => r.client_email === clientEmail) : base
    }
  )
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const url = new URL('/api/reservations.php', window.location.origin)
      if (clientEmail)    url.searchParams.set('client_email',    clientEmail)
      if (includeTrash)   url.searchParams.set('include_trashed', '1')

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('api-error')
      const data = await res.json()

      // File system is source of truth — purge localStorage of any reservation
      // not returned by the API (deleted files, orphans, etc.)
      const fileIds = new Set(data.map(r => String(r.id)))
      const cached = Store.getAllReservations()

      if (clientEmail) {
        // For a per-client fetch: replace all LS entries for this client with fresh PHP data
        const others = cached.filter(r => r.client_email !== clientEmail)
        localStorage.setItem('ls_reservations', JSON.stringify([...others, ...data]))
      } else {
        // Global fetch: keep only file-backed entries + soft-deleted (trashed) LS entries
        const trashedOnly = cached.filter(r => r.trashed && !fileIds.has(String(r.id)))
        localStorage.setItem('ls_reservations', JSON.stringify([...data, ...trashedOnly]))
      }

      setReservations(data)
    } catch {
      // Network down → fall back to localStorage cache
      const base = includeTrash ? Store.getAllReservations() : Store.getReservations()
      setReservations(clientEmail ? base.filter(r => r.client_email === clientEmail) : base)
    } finally {
      setLoading(false)
    }
  }, [clientEmail, includeTrash])

  useEffect(() => {
    load()
    if (interval > 0) {
      timerRef.current = setInterval(load, interval)
      return () => clearInterval(timerRef.current)
    }
  }, [load, interval])

  return { reservations, reload: load, loading }
}
