const CALENDAR_ID = 'f199f2899b15df6880648254217b1598362bf1c9bb9949f3acc3aef3404c999e@group.calendar.google.com'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const TOKEN_KEY    = 'ls_gcal_token'
const EXPIRY_KEY   = 'ls_gcal_expiry'

let _tokenClient = null
let _onStateChange = null

// ─── Token storage (sessionStorage: cleared on tab close) ────────────────────

function getToken() {
  const t = sessionStorage.getItem(TOKEN_KEY)
  const e = Number(sessionStorage.getItem(EXPIRY_KEY) || 0)
  if (!t || Date.now() > e) { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(EXPIRY_KEY); return null }
  return t
}

function saveToken(token, expiresIn) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + (expiresIn - 60) * 1000))
  _onStateChange?.()
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(EXPIRY_KEY)
  _onStateChange?.()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function isConnected() { return !!getToken() }

export function init({ onSuccess, onError, onStateChange }) {
  _onStateChange = onStateChange
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) { onError?.('Client ID Google non configuré dans .env'); return }
  if (!window.google?.accounts?.oauth2) { onError?.('Google Identity Services non chargé'); return }

  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: (resp) => {
      if (resp.error) { onError?.(resp.error); return }
      saveToken(resp.access_token, resp.expires_in)
      onSuccess?.()
    },
  })
}

export function connect() { _tokenClient?.requestAccessToken({ prompt: '' }) }

export function disconnect() {
  const t = getToken()
  if (t) window.google?.accounts?.oauth2?.revoke(t)
  clearToken()
}

// ─── Event builder ────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  a_payer: 'À payer', en_attente: 'En attente', validee: 'Validée',
  tournee: 'Tournée', 'post-prod': 'Post-production', livree: 'Livrée',
  annulee: 'Annulée', rembourse: 'Remboursée', absent: 'Absent',
}

const STATUS_COLOR = {
  validee: '2', livree: '7', tournee: '6', 'post-prod': '1',
  annulee: '4', rembourse: '4', absent: '6',
}

function endTime(r) {
  if (r.end_time) return r.end_time
  const [h, m] = r.start_time.split(':').map(Number)
  const mins = h * 60 + m + (Number(r.duration) || 1) * 60
  return `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function buildEvent(r) {
  const name = (r.client_name?.trim()) || `${r.client_first_name || ''} ${r.client_last_name || ''}`.trim()
  return {
    summary: `${r.studio || 'Studio'} — ${name}`,
    location: `Level Studios — ${r.studio || ''}`,
    description: [
      `Formule : ${r.service || ''}`,
      `Statut : ${STATUS_LABEL[r.status] || r.status || ''}`,
      `Prix : ${r.price || 0} CAD`,
      `Personnes : ${r.persons || 1}`,
      r.additional_services?.length ? `Options : ${r.additional_services.join(', ')}` : '',
      r.company ? `Société : ${r.company}` : '',
      r.client_email ? `Email : ${r.client_email}` : '',
      `ID : ${r.id}`,
    ].filter(Boolean).join('\n'),
    start: { dateTime: `${r.date}T${r.start_time}:00`, timeZone: 'America/Toronto' },
    end:   { dateTime: `${r.date}T${endTime(r)}:00`,   timeZone: 'America/Toronto' },
    colorId: STATUS_COLOR[r.status] || '1',
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const token = getToken()
  if (!token) throw Object.assign(new Error('not_authenticated'), { code: 'not_authenticated' })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}${path}`,
    {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body != null ? JSON.stringify(body) : undefined,
    }
  )
  if (res.status === 401) { clearToken(); throw Object.assign(new Error('token_expired'), { code: 'token_expired' }) }
  if (res.status === 204) return null
  if (!res.ok) throw new Error(`api_error_${res.status}`)
  return res.json()
}

export async function createEvent(reservation) {
  const r = await api('POST', '/events', buildEvent(reservation))
  return r?.id || null
}

export async function updateEvent(googleEventId, reservation) {
  if (!googleEventId) return createEvent(reservation)
  const r = await api('PUT', `/events/${googleEventId}`, buildEvent(reservation))
  return r?.id || null
}

export async function deleteEvent(googleEventId) {
  if (!googleEventId) return
  await api('DELETE', `/events/${googleEventId}`)
}
