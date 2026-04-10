export function createPageUrl(pageName) {
  const routes = {
    'Home': '/',
    'Contact': '/contact',
    'Reservation': '/reservation',
    'NewReservation': '/reservation',
    'Dashboard': '/admin/dashboard',
    'AdminAccounts': '/admin/accounts',
    'AdminCalendar': '/admin/calendar',
    'AdminReservations': '/admin/reservations',
    'AdminProjects': '/admin/projects',
    'AdminRushes': '/admin/rushes',
    'AdminMessaging': '/admin/messaging',
    'AdminSAV': '/admin/sav',
    'AdminCommunication': '/admin/communication',
    'AdminPromo': '/admin/promo',
    'AdminCheck': '/admin/check',
    'AdminBoarding': '/admin/boarding',
    'AdminManual': '/admin/manual',
    'AdminTool': '/admin/tool',
    'AdminPricing': '/admin/pricing',
    'EmployeeDashboard': '/employee/dashboard',
    'EmployeeProjects': '/employee/projects',
    'EmployeeMessaging': '/employee/messaging',
    'EmployeeCheck': '/employee/check',
    'EmployeeCalendar': '/employee/calendar',
    'EmployeeLeave': '/employee/leave',
    'ClientDashboard': '/client/dashboard',
    'ClientAccount': '/client/account',
    'ClientReservations': '/client/reservations',
    'ClientLibrary': '/client/library',
    'ClientSubscription': '/client/subscription',
    'ClientContact': '/client/contact',
  }
  return routes[pageName] || '/'
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  })
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency', currency: 'CAD', maximumFractionDigits: 0
  }).format(amount)
}

export function generateId(prefix) {
  const num = Math.floor(Math.random() * 90000) + 10000
  return `${prefix}${num}`
}

// ── Offres — code couleur unifié ─────────────────────────────────────────
export const TIER_CONFIG = {
  ARGENT: { cls: 'bg-zinc-400/20 text-zinc-300 border border-zinc-500/30',  label: 'ARGENT' },
  GOLD:   { cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', label: 'GOLD' },
}
export function getTierConfig(service) {
  const s = (service || '').toUpperCase()
  return s.includes('GOLD') ? TIER_CONFIG.GOLD : TIER_CONFIG.ARGENT
}

// ── Statuts réservation — code couleur unifié ─────────────────────────────
export const STATUS_CONFIG = {
  a_payer:     { label_fr: 'À payer',     label_en: 'Unpaid',      cls: 'bg-amber-500/20 text-amber-400' },
  en_attente:  { label_fr: 'En attente',  label_en: 'Pending',     cls: 'bg-amber-500/20 text-amber-400' },
  validee:     { label_fr: 'Confirmée',   label_en: 'Confirmed',   cls: 'bg-green-500/20 text-green-400' },
  tournee:     { label_fr: 'En tournage', label_en: 'In progress', cls: 'bg-violet-500/20 text-violet-400' },
  'post-prod': { label_fr: 'Post-prod',   label_en: 'Post-prod',   cls: 'bg-blue-500/20 text-blue-400' },
  livree:      { label_fr: 'Livrée',      label_en: 'Delivered',   cls: 'bg-cyan-500/20 text-cyan-400' },
  annulee:     { label_fr: 'Annulée',     label_en: 'Cancelled',   cls: 'bg-red-500/20 text-red-400' },
}
