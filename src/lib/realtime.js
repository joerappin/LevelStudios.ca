// Supabase Realtime — écoute les changements et met à jour localStorage automatiquement
// Utilisation dans un composant : const tick = useLiveData() — se ré-incrémente à chaque changement distant

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import * as db from './db'

const TABLE_SYNCS = {
  reservations:      () => import('./db').then(m => m.syncAll && supabase.from('reservations').select('*').then(({ data }) => data && localStorage.setItem('ls_reservations', JSON.stringify(data)))),
  projects:          () => supabase.from('projects').select('*').then(({ data }) => data && localStorage.setItem('ls_projects', JSON.stringify(data))),
  messages:          () => supabase.from('messages').select('*').then(({ data }) => data && localStorage.setItem('ls_messages', JSON.stringify((data || []).map(r => ({ ...r.data, id: r.id, created_at: r.created_at, read: r.read, replies: r.replies || [] }))))),
  internal_messages: () => supabase.from('internal_messages').select('*').then(({ data }) => data && localStorage.setItem('ls_internal_messages', JSON.stringify((data || []).map(r => ({ ...r.data, id: r.id, created_at: r.created_at, read: r.read }))))),
  alerts:            () => supabase.from('alerts').select('*').then(({ data }) => data && localStorage.setItem('ls_alerts', JSON.stringify((data || []).map(r => ({ ...r.data, id: r.id, created_at: r.created_at, status: r.status }))))),
  check_ins:         () => supabase.from('check_ins').select('*').then(({ data }) => data && localStorage.setItem('ls_check_ins', JSON.stringify((data || []).map(r => ({ ...r.data, id: r.id, created_at: r.created_at }))))),
  popup_messages:    () => supabase.from('popup_messages').select('*').then(({ data }) => data && localStorage.setItem('ls_popup_messages', JSON.stringify((data || []).map(r => ({ ...r.data, id: r.id, created_at: r.created_at }))))),
  hour_packs:        () => supabase.from('hour_packs').select('*').then(({ data }) => data && localStorage.setItem('ls_hour_packs', JSON.stringify((data || []).map(r => ({ ...r.data, id: r.id, created_at: r.created_at, hours_used: r.hours_used }))))),
  leave_requests:    () => supabase.from('leave_requests').select('*').then(({ data }) => data && localStorage.setItem('ls_leave_requests', JSON.stringify((data || []).map(r => ({ ...r.data, id: r.id, created_at: r.created_at, status: r.status }))))),
  employees:         () => supabase.from('employees').select('*').then(({ data }) => data && localStorage.setItem('ls_employees', JSON.stringify((data || []).map(r => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, roleKey: r.role_key, joined_at: r.joined_at, active: r.active }))))),
  leads:             () => supabase.from('leads').select('*').then(({ data }) => data && localStorage.setItem('ls_leads', JSON.stringify((data || []).map(r => ({ ...r.data, id: r.id, created_at: r.created_at, column: r.column_name, history: r.history || [] }))))),
  mails:             () => supabase.from('mails').select('*').then(({ data }) => data && localStorage.setItem('ls_mails', JSON.stringify((data || []).map(r => ({ ...r.data, id: r.id, created_at: r.created_at, read: r.read, to: r.to || [], cc: r.cc || [], attachments: r.attachments || [], labels: r.labels || [], trashed_by: r.trashed_by || [] }))))),
}

// Hook principal — retourne un compteur qui s'incrémente à chaque changement distant
export function useLiveData() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    // Écoute les événements locaux (dispatché par le canal realtime)
    const handler = () => setTick(t => t + 1)
    window.addEventListener('level-data-update', handler)
    return () => window.removeEventListener('level-data-update', handler)
  }, [])

  return tick
}

// Hook à placer dans AppRoutes — démarre la souscription Realtime globale
export function useRealtimeSync(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('level-studios-global')
      .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
        const table = payload.table
        const syncFn = TABLE_SYNCS[table]
        if (syncFn) {
          try { await syncFn() } catch {}
        }
        window.dispatchEvent(new CustomEvent('level-data-update', { detail: { table, type: payload.eventType } }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [enabled])
}
