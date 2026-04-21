import { useState, useEffect, useCallback, useRef } from 'react'
import * as GCal from '../services/googleCalendarService'
import { Store } from '../data/store'

const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useGoogleCalendar() {
  const [connected, setConnected]     = useState(GCal.isConnected)
  const [tokenExpired, setTokenExpired] = useState(false)
  const pollRef = useRef(null)

  // ─── Init GIS ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const tryInit = () => {
      if (!window.google?.accounts?.oauth2) return false
      GCal.init({
        onSuccess:     () => { setConnected(true); setTokenExpired(false) },
        onError:       () => {},
        onStateChange: () => setConnected(GCal.isConnected()),
      })
      return true
    }
    if (!tryInit()) {
      const id = setInterval(() => { if (tryInit()) clearInterval(id) }, 300)
      return () => clearInterval(id)
    }
  }, [])

  // ─── Error handler ─────────────────────────────────────────────────────────

  const handleError = useCallback((err) => {
    if (err?.code === 'token_expired') { setConnected(false); setTokenExpired(true) }
  }, [])

  // ─── Google → App sync ─────────────────────────────────────────────────────

  const syncFromGoogle = useCallback(async () => {
    if (!GCal.isConnected()) return
    try {
      const now    = new Date()
      const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days ahead
      const events = await GCal.getEvents(now, future)

      // Build a set of known google_event_ids already in the app
      const existing     = Store.getAllReservations()
      const knownGIds    = new Set(existing.map(r => r.google_event_id).filter(Boolean))

      for (const event of events) {
        // Skip cancelled events
        if (event.status === 'cancelled') continue
        // Skip events created by the app (they already have a reservation)
        if (event.extendedProperties?.private?.levelstudios_id) continue
        // Skip all-day events (no dateTime, only date)
        if (!event.start?.dateTime) continue
        // Skip already imported events
        if (knownGIds.has(event.id)) continue

        const reservation = GCal.parseGoogleEvent(event)
        Store.addReservation(reservation)
      }
    } catch (err) { handleError(err) }
  }, [handleError])

  // ─── Start/stop polling when connection changes ─────────────────────────────

  useEffect(() => {
    if (connected) {
      syncFromGoogle()
      pollRef.current = setInterval(syncFromGoogle, POLL_INTERVAL)
    }
    return () => { clearInterval(pollRef.current) }
  }, [connected, syncFromGoogle])

  // ─── App → Google sync ─────────────────────────────────────────────────────

  const connect    = useCallback(() => GCal.connect(), [])
  const disconnect = useCallback(() => {
    GCal.disconnect()
    setConnected(false)
    setTokenExpired(false)
    clearInterval(pollRef.current)
  }, [])

  const syncCreate = useCallback(async (reservation) => {
    if (!GCal.isConnected()) return
    try {
      const googleEventId = await GCal.createEvent(reservation)
      if (googleEventId) Store.updateReservation(reservation.id, { google_event_id: googleEventId })
    } catch (err) { handleError(err) }
  }, [handleError])

  const syncUpdate = useCallback(async (reservation) => {
    if (!GCal.isConnected()) return
    try {
      const googleEventId = await GCal.updateEvent(reservation.google_event_id, reservation)
      if (googleEventId && !reservation.google_event_id) {
        Store.updateReservation(reservation.id, { google_event_id: googleEventId })
      }
    } catch (err) { handleError(err) }
  }, [handleError])

  const syncDelete = useCallback(async (reservation) => {
    if (!GCal.isConnected() || !reservation?.google_event_id) return
    try { await GCal.deleteEvent(reservation.google_event_id) } catch (err) { handleError(err) }
  }, [handleError])

  return { connected, tokenExpired, connect, disconnect, syncCreate, syncUpdate, syncDelete }
}
