const CALENDAR_ID = 'f199f2899b15df6880648254217b1598362bf1c9bb9949f3acc3aef3404c999e@group.calendar.google.com'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const TOKEN_KEY  = 'ls_gcal_token'
const EXPIRY_KEY = 'ls_gcal_expiry'

let _tokenClient   = null
let _onStateChange = null

// ─── Token ────────────────────────────────────────────────────────────────────

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
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '562981400783-gviei84p2ajqvl9m453uba2qm3efnplt.apps.googleusercontent.com'
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
export function connect()    { _tokenClient?.requestAccessToken({ prompt: 'select_account' }) }
export function disconnect() {
  const t = getToken()
  if (t) window.google?.accounts?.oauth2?.revoke(t)
  clearToken()
}

// ─── RM ID (Google-imported reservations) ────────────────────────────────────

function generateRMId() {
  const existing = new Set(
    (() => { try { return JSON.parse(localStorage.getItem('ls_reservations') || '[]').map(r => r.id) } catch { return [] } })()
  )
  let id
  do { id = `RM${Math.floor(10000 + Math.random() * 90000)}` } while (existing.has(id))
  return id
}

export function isGoogleImport(reservation) {
  return reservation?.source === 'google_calendar' || String(reservation?.id || '').startsWith('RM')
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

function calcEndTime(r) {
  if (r.end_time) return r.end_time
  const [h, m] = r.start_time.split(':').map(Number)
  const mins = h * 60 + m + (Number(r.duration) || 1) * 60
  return `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function buildEvent(r) {
  const name = r.client_name?.trim() || `${r.client_first_name || ''} ${r.client_last_name || ''}`.trim()
  const lines = [
    `Formule : ${r.service || ''}`,
    `Statut : ${STATUS_LABEL[r.status] || r.status || ''}`,
    `Prix : ${r.price || 0} CAD`,
    `Personnes : ${r.persons || 1}`,
    r.additional_services?.length ? `Options : ${r.additional_services.join(', ')}` : '',
    r.company      ? `Société : ${r.company}`      : '',
    r.client_email ? `Email : ${r.client_email}`   : '',
    `ID : ${r.id}`,
    isGoogleImport(r) ? 'Réservation Manuel' : '',
  ].filter(Boolean)

  return {
    summary:  `${r.studio || 'Studio'} — ${name}`,
    location: `Level Studios — ${r.studio || ''}`,
    description: lines.join('\n'),
    start: { dateTime: `${r.date}T${r.start_time}:00`,      timeZone: 'America/Toronto' },
    end:   { dateTime: `${r.date}T${calcEndTime(r)}:00`,     timeZone: 'America/Toronto' },
    colorId: STATUS_COLOR[r.status] || '1',
    extendedProperties: { private: { levelstudios_id: String(r.id) } },
  }
}

// ─── API ──────────────────────────────────────────────────────────────────────

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

// ─── Fetch from Google Calendar ───────────────────────────────────────────────

export async function getEvents(timeMin, timeMax) {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(),
    singleEvents: 'true', orderBy: 'startTime', maxResults: '250',
  })
  const r = await api('GET', `/events?${params}`)
  return r?.items || []
}

export function parseGoogleEvent(event) {
  const summary    = event.summary || 'Réservation'
  const match      = summary.match(/^(Studio\s+\S+)\s*[—–-]\s*(.+)$/)
  const studio     = match ? match[1] : 'Studio A'
  const clientName = match ? match[2].trim() : summary
  const startDT    = event.start?.dateTime || ''
  const endDT      = event.end?.dateTime   || ''
  const date       = startDT.substring(0, 10)
  const startTime  = startDT.substring(11, 16)
  const endTime    = endDT.substring(11, 16)
  const durationH  = startTime && endTime
    ? Math.max(1, parseInt(endTime.split(':')[0]) - parseInt(startTime.split(':')[0]))
    : 1

  return {
    id:                  generateRMId(),
    client_name:         clientName,
    client_email:        '',
    studio,
    date,
    start_time:          startTime || '10:00',
    end_time:            endTime   || '11:00',
    duration:            durationH,
    service:             'ARGENT',
    price:               0,
    persons:             1,
    status:              'en_attente',
    additional_services: [],
    manual:              false,
    source:              'google_calendar',
    google_event_id:     event.id,
  }
}
