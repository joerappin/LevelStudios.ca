// LocalStorage-based data store simulating backend entities

const KEYS = {
  reservations: 'ls_reservations',
  projects: 'ls_projects',
  messages: 'ls_messages',
  internalMessages: 'ls_internal_messages',
  employees: 'ls_employees',
  leaveRequests: 'ls_leave_requests',
  hourPacks: 'ls_hour_packs',
  tokens: 'ls_tokens',
  promoCodes: 'ls_promo_codes',
  popupMessages: 'ls_popup_messages',
  checkIns: 'ls_check_ins',
  accounts: 'ls_accounts',
  pwdTokens: 'ls_pwd_tokens',
  alerts: 'ls_alerts',
}

function getAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch { return [] }
}

function saveAll(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

function generateId(prefix = 'ID') {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}

function generateResId() {
  const existing = new Set(
    (() => { try { return JSON.parse(localStorage.getItem('ls_reservations') || '[]').map(r => r.id) } catch { return [] } })()
  )
  let id
  do { id = String(Math.floor(10000 + Math.random() * 90000)) } while (existing.has(id))
  return id
}

// ─── Pricing — stored OUTSIDE KEYS so seed resets never wipe it ─────────────
const PRICE_KEY = 'ls_custom_prices'

const DEFAULT_PRICES = {
  services: [
    { id: 'ARGENT', label: 'Offre Argent (/ heure)', price: 221 },
    { id: 'GOLD',   label: 'Offre Gold (/ heure)',   price: 587 },
  ],
  options: [
    { id: 'Photo',            label: 'Photo',                        group: 'Base',           price: 44  },
    { id: 'Short',            label: 'Short vidéo',                  group: 'Base',           price: 44  },
    { id: 'Miniature',        label: 'Miniature',                    group: 'Base',           price: 44  },
    { id: 'Live',             label: 'Live stream',                  group: 'Live',           price: 662 },
    { id: 'BriefingLive',     label: 'Briefing live (obligatoire)',  group: 'Live',           price: 118 },
    { id: 'Replay',           label: 'Replay',                       group: 'Live',           price: 74  },
    { id: 'CommunityManager', label: 'Community manager',            group: 'Accompagnement', price: 147 },
    { id: 'Coaching',         label: 'Coaching',                     group: 'Accompagnement', price: 588 },
  ],
}

// ─── Seed version — increment to force a full re-seed ───────────────────────
const SEED_VERSION = '8'

// Clear all demo data on version change
function seedIfEmpty() {
  if (localStorage.getItem('_seed_v') !== SEED_VERSION) {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
    localStorage.removeItem('level_studio_user')
    localStorage.setItem('_seed_v', SEED_VERSION)
  }
}

seedIfEmpty()

// Generic CRUD operations
export const Store = {
  // Reservations
  getReservations: () => getAll(KEYS.reservations),
  addReservation: (data) => {
    const items = getAll(KEYS.reservations)
    const item = { id: generateResId(), created_at: new Date().toISOString(), ...data }
    items.unshift(item)
    saveAll(KEYS.reservations, items)
    return item
  },
  updateReservation: (id, data) => {
    const items = getAll(KEYS.reservations)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.reservations, items) }
    return items[idx]
  },
  deleteReservation: (id) => {
    const items = getAll(KEYS.reservations).filter(i => i.id !== id)
    saveAll(KEYS.reservations, items)
  },

  // Projects
  getProjects: () => getAll(KEYS.projects),
  addProject: (data) => {
    const items = getAll(KEYS.projects)
    const item = { id: generateId('PROJ'), created_at: new Date().toISOString(), files: [], ...data }
    items.unshift(item)
    saveAll(KEYS.projects, items)
    return item
  },
  updateProject: (id, data) => {
    const items = getAll(KEYS.projects)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.projects, items) }
    return items[idx]
  },

  // Messages (SAV)
  getMessages: () => getAll(KEYS.messages),
  addMessage: (data) => {
    const items = getAll(KEYS.messages)
    const item = { id: generateId('MSG'), created_at: new Date().toISOString(), read: false, replies: [], ...data }
    items.unshift(item)
    saveAll(KEYS.messages, items)
    return item
  },
  updateMessage: (id, data) => {
    const items = getAll(KEYS.messages)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.messages, items) }
  },
  deleteMessage: (id) => {
    saveAll(KEYS.messages, getAll(KEYS.messages).filter(i => i.id !== id))
  },
  purgeOldMessages: () => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    saveAll(KEYS.messages, getAll(KEYS.messages).filter(m => new Date(m.created_at).getTime() > cutoff))
  },

  // Internal Messages
  getInternalMessages: () => getAll(KEYS.internalMessages),
  addInternalMessage: (data) => {
    const items = getAll(KEYS.internalMessages)
    const item = { id: generateId('IMSG'), created_at: new Date().toISOString(), read: false, ...data }
    items.unshift(item)
    saveAll(KEYS.internalMessages, items)
    return item
  },
  updateInternalMessage: (id, data) => {
    const items = getAll(KEYS.internalMessages)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.internalMessages, items) }
  },

  // Employees
  getEmployees: () => getAll(KEYS.employees),
  addEmployee: (data) => {
    const items = getAll(KEYS.employees)
    const item = { id: `LVL2${Math.floor(Math.random() * 90000) + 10000}`, ...data }
    items.push(item)
    saveAll(KEYS.employees, items)
    return item
  },
  updateEmployee: (id, data) => {
    const items = getAll(KEYS.employees)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.employees, items) }
  },

  // Leave Requests
  getLeaveRequests: () => getAll(KEYS.leaveRequests),
  addLeaveRequest: (data) => {
    const items = getAll(KEYS.leaveRequests)
    const item = { id: generateId('LEAVE'), created_at: new Date().toISOString(), status: 'pending', ...data }
    items.unshift(item)
    saveAll(KEYS.leaveRequests, items)
    return item
  },
  updateLeaveRequest: (id, data) => {
    const items = getAll(KEYS.leaveRequests)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.leaveRequests, items) }
  },

  // Hour Packs
  getHourPacks: () => getAll(KEYS.hourPacks),
  addHourPack: (data) => {
    const items = getAll(KEYS.hourPacks)
    const item = { id: generateId('PACK'), created_at: new Date().toISOString(), hours_used: 0, ...data }
    items.unshift(item)
    saveAll(KEYS.hourPacks, items)
    return item
  },
  updateHourPack: (id, data) => {
    const items = getAll(KEYS.hourPacks)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.hourPacks, items) }
  },

  // Promo Codes
  getPromoCodes: () => getAll(KEYS.promoCodes),
  addPromoCode: (data) => {
    const items = getAll(KEYS.promoCodes)
    const item = { id: generateId('PROMO'), created_at: new Date().toISOString(), uses: 0, ...data }
    items.unshift(item)
    saveAll(KEYS.promoCodes, items)
    return item
  },
  updatePromoCode: (id, data) => {
    const items = getAll(KEYS.promoCodes)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.promoCodes, items) }
  },
  deletePromoCode: (id) => {
    saveAll(KEYS.promoCodes, getAll(KEYS.promoCodes).filter(i => i.id !== id))
  },

  // Popup Messages
  getPopupMessages: () => getAll(KEYS.popupMessages),
  addPopupMessage: (data) => {
    const items = getAll(KEYS.popupMessages)
    const item = { id: generateId('POP'), created_at: new Date().toISOString(), ...data }
    items.unshift(item)
    saveAll(KEYS.popupMessages, items)
    return item
  },
  deletePopupMessage: (id) => {
    saveAll(KEYS.popupMessages, getAll(KEYS.popupMessages).filter(i => i.id !== id))
  },

  // Check-ins
  getCheckIns: () => getAll(KEYS.checkIns),
  addCheckIn: (data) => {
    const items = getAll(KEYS.checkIns)
    const item = { id: generateId('CHK'), created_at: new Date().toISOString(), ...data }
    items.unshift(item)
    saveAll(KEYS.checkIns, items)
    return item
  },
  updateCheckIn: (id, data) => {
    const items = getAll(KEYS.checkIns)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.checkIns, items) }
  },

  validatePromoCode: (code) => {
    const codes = getAll(KEYS.promoCodes)
    const promo = codes.find(c => c.code === code && c.active)
    if (!promo) return null
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) return null
    if (promo.max_uses && promo.uses >= promo.max_uses) return null
    return promo
  },

  // Accounts (admin-created, pending password setup)
  getAccounts: () => getAll(KEYS.accounts),
  addAccount: (data) => {
    const items = getAll(KEYS.accounts)
    const item = { id: generateId('ACC'), created_at: new Date().toISOString(), pending: true, ...data }
    items.push(item)
    saveAll(KEYS.accounts, items)
    return item
  },
  updateAccount: (id, data) => {
    const items = getAll(KEYS.accounts)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.accounts, items) }
    return items[idx]
  },
  findAccountByEmail: (email) => {
    return getAll(KEYS.accounts).find(a => a.email === email) || null
  },
  findAccountByEmailAndPassword: (email, password) => {
    return getAll(KEYS.accounts).find(a => a.email === email && a.password === password && !a.pending) || null
  },
  deleteAccount: (id) => {
    saveAll(KEYS.accounts, getAll(KEYS.accounts).filter(a => a.id !== id))
  },

  // Alerts
  getAlerts: () => getAll(KEYS.alerts),
  addAlert: (data) => {
    const items = getAll(KEYS.alerts)
    const item = { id: generateId('ALT'), created_at: new Date().toISOString(), status: 'sent', ...data }
    items.unshift(item)
    saveAll(KEYS.alerts, items)
    return item
  },
  updateAlert: (id, data) => {
    const items = getAll(KEYS.alerts)
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; saveAll(KEYS.alerts, items) }
  },

  // Password setup tokens
  createPwdToken: (accountId, email, name, type) => {
    const tokens = JSON.parse(localStorage.getItem(KEYS.pwdTokens) || '{}')
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72h
    tokens[token] = { accountId, email, name, type, expiresAt }
    localStorage.setItem(KEYS.pwdTokens, JSON.stringify(tokens))
    return token
  },
  validatePwdToken: (token) => {
    const tokens = JSON.parse(localStorage.getItem(KEYS.pwdTokens) || '{}')
    const data = tokens[token]
    if (!data) return null
    if (new Date(data.expiresAt) < new Date()) return null
    return data
  },
  consumePwdToken: (token) => {
    const tokens = JSON.parse(localStorage.getItem(KEYS.pwdTokens) || '{}')
    delete tokens[token]
    localStorage.setItem(KEYS.pwdTokens, JSON.stringify(tokens))
  },

  // Pricing — persists independently of seed version
  getPrices: () => {
    try {
      const s = localStorage.getItem(PRICE_KEY)
      return s ? JSON.parse(s) : DEFAULT_PRICES
    } catch { return DEFAULT_PRICES }
  },
  setPrices: (data) => localStorage.setItem(PRICE_KEY, JSON.stringify(data)),
  resetPrices: () => localStorage.removeItem(PRICE_KEY),
  getDefaultPrices: () => DEFAULT_PRICES,

  // Restore accounts from server files (called on app startup to recover from localStorage wipe)
  restoreAccountsFromServer: async () => {
    try {
      const [workersRes, clientsRes] = await Promise.all([
        fetch('/api/workers').catch(() => null),
        fetch('/api/clients').catch(() => null),
      ])
      const workers = workersRes?.ok ? await workersRes.json() : []
      const clients = clientsRes?.ok ? await clientsRes.json() : []

      const accounts = getAll(KEYS.accounts)
      const employees = getAll(KEYS.employees)
      let accountsChanged = false
      let employeesChanged = false

      for (const w of workers) {
        if (!accounts.find(a => a.email === w.email)) {
          accounts.push({ ...w, pending: true })
          accountsChanged = true
        }
        if (!employees.find(e => e.email === w.email)) {
          employees.push({ id: w.id, email: w.email, name: w.name, role: w.role, roleKey: w.roleKey, phone: w.phone || '', joined_at: w.created_at?.split('T')[0] || '', active: true })
          employeesChanged = true
        }
      }
      for (const c of clients) {
        if (!accounts.find(a => a.email === c.email)) {
          accounts.push({ ...c, pending: true })
          accountsChanged = true
        }
      }

      if (accountsChanged) saveAll(KEYS.accounts, accounts)
      if (employeesChanged) saveAll(KEYS.employees, employees)
    } catch {}
  },

  // Video review comments
  getVideoComments: () => {
    try { return JSON.parse(localStorage.getItem('ls_video_comments') || '[]') } catch { return [] }
  },
  addVideoComment: (comment) => {
    const list = (() => { try { return JSON.parse(localStorage.getItem('ls_video_comments') || '[]') } catch { return [] } })()
    list.push(comment)
    localStorage.setItem('ls_video_comments', JSON.stringify(list))
  },
  deleteVideoComment: (id) => {
    try {
      const list = JSON.parse(localStorage.getItem('ls_video_comments') || '[]').filter(c => c.id !== id)
      localStorage.setItem('ls_video_comments', JSON.stringify(list))
    } catch {}
  },

  // Video review status
  getVideoStatus: (resId, fileName) => {
    try {
      const data = JSON.parse(localStorage.getItem('ls_video_statuses') || '{}')
      return data[`${resId}__${fileName}`] || null
    } catch { return null }
  },
  setVideoStatus: (resId, fileName, status, retourCount) => {
    try {
      const data = JSON.parse(localStorage.getItem('ls_video_statuses') || '{}')
      const key = `${resId}__${fileName}`
      data[key] = { ...(data[key] || {}), status, retourCount }
      localStorage.setItem('ls_video_statuses', JSON.stringify(data))
    } catch {}
  },

  getRetourPhase: (resId, fileName) => {
    try {
      const data = JSON.parse(localStorage.getItem('ls_video_statuses') || '{}')
      return data[`${resId}__${fileName}`]?.retourPhase || null
    } catch { return null }
  },
  setRetourPhase: (resId, fileName, phase) => {
    try {
      const data = JSON.parse(localStorage.getItem('ls_video_statuses') || '{}')
      const key = `${resId}__${fileName}`
      data[key] = { ...(data[key] || {}), retourPhase: phase }
      localStorage.setItem('ls_video_statuses', JSON.stringify(data))
    } catch {}
  },

  // Feature flags (Beta settings)
  getFeatureFlags: () => {
    try {
      const defaults = {
        subscription_tab: true,
        library_tab: true,
        dashboard_pack_hours: true,
        dashboard_buy_pack: true,
        online_booking: true,
        promo_codes: true,
        popup_communication: true,
        employee_checkin: true,
      }
      const stored = JSON.parse(localStorage.getItem('ls_feature_flags') || '{}')
      return { ...defaults, ...stored }
    } catch { return {} }
  },
  setFeatureFlag: (key, value) => {
    try {
      const data = JSON.parse(localStorage.getItem('ls_feature_flags') || '{}')
      data[key] = value
      localStorage.setItem('ls_feature_flags', JSON.stringify(data))
    } catch {}
  },

  // Video version (V1/V2/V3)
  getVideoVersion: (resId, fileName) => {
    try {
      const data = JSON.parse(localStorage.getItem('ls_video_versions') || '{}')
      return data[`${resId}__${fileName}`] || null
    } catch { return null }
  },
  setVideoVersion: (resId, fileName, version) => {
    try {
      const data = JSON.parse(localStorage.getItem('ls_video_versions') || '{}')
      data[`${resId}__${fileName}`] = version
      localStorage.setItem('ls_video_versions', JSON.stringify(data))
    } catch {}
  },

  // Video visibility settings (admin/chef)
  getVideoSettings: (resId, fileName) => {
    try {
      const data = JSON.parse(localStorage.getItem('ls_video_settings') || '{}')
      return data[`${resId}__${fileName}`] || { allowDownload: true, visibleToClient: true, showWatermark: false }
    } catch { return { allowDownload: true, visibleToClient: true } }
  },
  setVideoSettings: (resId, fileName, settings) => {
    try {
      const data = JSON.parse(localStorage.getItem('ls_video_settings') || '{}')
      data[`${resId}__${fileName}`] = settings
      localStorage.setItem('ls_video_settings', JSON.stringify(data))
    } catch {}
  },
}
