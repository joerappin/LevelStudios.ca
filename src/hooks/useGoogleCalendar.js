import { useState, useEffect, useCallback } from 'react'
import * as GCal from '../services/googleCalendarService'
import { Store } from '../data/store'

export function useGoogleCalendar() {
  const [connected, setConnected] = useState(GCal.isConnected)
  const [tokenExpired, setTokenExpired] = useState(false)

  useEffect(() => {
    const tryInit = () => {
      if (!window.google?.accounts?.oauth2) return false
      GCal.init({
        onSuccess: () => { setConnected(true); setTokenExpired(false) },
        onError: () => {},
        onStateChange: () => setConnected(GCal.isConnected()),
      })
      return true
    }

    if (!tryInit()) {
      const id = setInterval(() => { if (tryInit()) clearInterval(id) }, 300)
      return () => clearInterval(id)
    }
  }, [])

  const connect    = useCallback(() => GCal.connect(), [])
  const disconnect = useCallback(() => { GCal.disconnect(); setConnected(false); setTokenExpired(false) }, [])

  const handleError = useCallback((err) => {
    if (err?.code === 'token_expired') { setConnected(false); setTokenExpired(true) }
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
