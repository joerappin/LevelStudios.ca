import React, { useState, useEffect } from 'react'
import { useReservations } from '../../hooks/useReservations'
import { useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  LayoutDashboard, Users, Calendar, ClipboardList, FolderOpen, Zap,
  MessageSquare, HeadphonesIcon, Megaphone, Tag, Clock, BookOpen,
  Wrench, UserCheck, TrendingUp, AlertCircle, Bell, Plus, CreditCard,
  Timer, BarChart3, CheckCircle2, UserPlus, FlaskConical, Star, DollarSign,
  GitBranch, Medal, Receipt, Grid, Camera, Briefcase, Activity,
  AlertTriangle, ChevronRight, Settings, Film,
} from 'lucide-react'
import Layout from '../../components/Layout'
import { Store } from '../../data/store'
import { createPageUrl, formatPrice } from '../../utils'
import { useApp } from '../../contexts/AppContext'

const NAV = [
  { labelKey: 'nav_dashboard',     path: createPageUrl('Dashboard'),          icon: <LayoutDashboard className="w-4 h-4" /> },
  { separator: true },
  { labelKey: 'nav_accounts',      path: createPageUrl('AdminAccounts'),      icon: <Users className="w-4 h-4" /> },
  { labelKey: 'nav_calendar',      path: createPageUrl('AdminCalendar'),      icon: <Calendar className="w-4 h-4" /> },
  { labelKey: 'nav_reservations',  path: createPageUrl('AdminReservations'),  icon: <ClipboardList className="w-4 h-4" /> },
  { labelKey: 'nav_recette',       path: '/admin/recette',                    icon: <Receipt className="w-4 h-4" /> },
  { labelKey: 'nav_projects',      path: createPageUrl('AdminProjects'),      icon: <FolderOpen className="w-4 h-4" /> },
  { labelKey: 'nav_rushes',        path: createPageUrl('AdminRushes'),        icon: <Zap className="w-4 h-4" /> },
  { labelKey: 'nav_alerts',        path: '/admin/alerts',                     icon: <Bell className="w-4 h-4" /> },
  { separator: true },
  { labelKey: 'nav_messaging',     path: createPageUrl('AdminMessaging'),     icon: <MessageSquare className="w-4 h-4" /> },
  { labelKey: 'nav_sav',           path: createPageUrl('AdminSAV'),           icon: <HeadphonesIcon className="w-4 h-4" /> },
  { label: 'Feedback',             path: '/admin/satisfaction',               icon: <Star className="w-4 h-4" /> },
  { labelKey: 'nav_communication', path: createPageUrl('AdminCommunication'), icon: <Megaphone className="w-4 h-4" /> },
  { labelKey: 'nav_promo',         path: createPageUrl('AdminPromo'),         icon: <Tag className="w-4 h-4" /> },
  { labelKey: 'nav_pricing',       path: createPageUrl('AdminPricing'),       icon: <DollarSign className="w-4 h-4" /> },
  { separator: true },
  { labelKey: 'nav_check',         path: createPageUrl('AdminCheck'),         icon: <Clock className="w-4 h-4" /> },
  { labelKey: 'nav_perf',          path: '/admin/perf',                       icon: <Medal className="w-4 h-4" /> },
  { label: 'RH',                   path: '/admin/rh',                         icon: <Briefcase className="w-4 h-4" /> },
  { labelKey: 'nav_boarding',      path: createPageUrl('AdminBoarding'),      icon: <UserCheck className="w-4 h-4" /> },
  { labelKey: 'nav_manual',        path: createPageUrl('AdminManual'),        icon: <BookOpen className="w-4 h-4" /> },
  { labelKey: 'nav_tool',          path: createPageUrl('AdminTool'),          icon: <Wrench className="w-4 h-4" /> },
  { labelKey: 'nav_beta',          path: '/admin/beta',                       icon: <FlaskConical className="w-4 h-4" /> },
  { labelKey: 'nav_versions',      path: '/admin/versions',                   icon: <GitBranch className="w-4 h-4" /> },
  { separator: true },
  { labelKey: 'nav_index',         path: '/admin/index',                      icon: <Grid className="w-4 h-4" /> },
]
export { NAV as ADMIN_NAV }

const STUDIOS = ['Studio A', 'Studio B', 'Studio C']
const DAILY_HOURS = 12
const BREAKEVEN_PCT = 35
const PAID_STATUSES = ['validee', 'livree', 'tournee', 'post-prod']
const SKIP_STATUSES = ['annulee', 'rembourse']
const DAYS_FR = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const STUDIO_ACCENT = {
  'Studio A': { bar: 'bg-cyan-500',    text: 'text-cyan-400',    border: 'border-cyan-900/50',    bg: 'bg-cyan-950/20'    },
  'Studio B': { bar: 'bg-violet-500',  text: 'text-violet-400',  border: 'border-violet-900/50',  bg: 'bg-violet-950/20'  },
  'Studio C': { bar: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-900/50', bg: 'bg-emerald-950/20' },
}

function getWeekDates() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toYMD(d) { return d.toISOString().split('T')[0] }

function filterByPeriod(reservations, period) {
  const now = new Date()
  return reservations.filter(r => {
    const d = new Date(r.date)
    if (period === 'day')   return toYMD(d) === toYMD(now)
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return d.getFullYear() === now.getFullYear()
  })
}

function availableHours(period) {
  if (period === 'day')   return DAILY_HOURS
  if (period === 'month') return 30 * DAILY_HOURS
  return 365 * DAILY_HOURS
}

function occupancyBarColor(occ) {
  if (occ >= 70) return 'bg-green-500'
  if (occ >= BREAKEVEN_PCT) return 'bg-amber-500'
  return 'bg-red-500'
}

function studioStatusBadge(occ, maintenance) {
  if (maintenance) return { label: 'MAINTENANCE', cls: 'text-orange-400 bg-orange-500/10 border-orange-500/30' }
  if (occ >= 70)   return { label: 'OPTIMAL',     cls: 'text-green-400 bg-green-500/10 border-green-500/30' }
  if (occ >= BREAKEVEN_PCT) return { label: 'ACTIF', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
  if (occ === 0)   return { label: 'INACTIF',     cls: 'text-zinc-500 bg-zinc-800/50 border-zinc-700/30' }
  return           { label: 'FAIBLE',             cls: 'text-red-400 bg-red-500/10 border-red-500/30' }
}

// ─── Instrument KPI card (drag-and-drop) ────────────────────────────────────
function SortableKpiCard({ kpi, onNavigate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: kpi.label })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onNavigate}
      className="relative border border-zinc-800 hover:border-cyan-800/50 bg-zinc-950 hover:bg-cyan-950/10 rounded-xl p-3 transition-all overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-700/40 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-700/40 rounded-tr-xl pointer-events-none" />
      <div className={`mb-2 ${kpi.color}`}>{kpi.icon}</div>
      <div className="text-xl font-mono font-black text-white leading-none mb-1">{kpi.value}</div>
      <div className="text-[8px] font-bold tracking-[0.18em] uppercase text-zinc-600 group-hover:text-zinc-500 leading-tight">{kpi.label}</div>
    </div>
  )
}

// ─── Panel wrapper with corner decorations ───────────────────────────────────
function Panel({ children, className = '' }) {
  return (
    <div className={`relative border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden ${className}`}>
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-700/30 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-700/30 rounded-tr-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-zinc-700/20 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-zinc-700/20 rounded-br-xl pointer-events-none" />
      {children}
    </div>
  )
}

function PanelHeader({ tag, label, action, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-cyan-500">◆ {tag}</span>
        {label && <span className="text-[9px] tracking-widest uppercase text-zinc-600">{label}</span>}
      </div>
      {action && (
        <button onClick={action} className="text-[9px] font-bold tracking-widest uppercase text-zinc-600 hover:text-cyan-400 transition-colors">
          {actionLabel} →
        </button>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  useApp()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [clockTime, setClockTime] = useState(new Date())
  const { reservations: allRes } = useReservations({ interval: 60000 })
  const [accounts, setAccounts] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [employees, setEmployees] = useState([])
  const [trashedEmails, setTrashedEmails] = useState(new Set())
  const [projects, setProjects] = useState([])
  const [savMessages, setSavMessages] = useState([])
  const [internalMsgs, setInternalMsgs] = useState([])
  const [alerts, setAlerts] = useState([])
  const [studioMaint, setStudioMaint] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ls_studio_maintenance')) || {} } catch { return {} }
  })

  useEffect(() => {
    const t = setInterval(() => setClockTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setCheckIns(Store.getCheckIns())
    setEmployees(Store.getEmployees())
    try { setProjects(Store.getProjects()) } catch {}
    try { setSavMessages(Store.getMessages()) } catch {}
    try { setInternalMsgs(Store.getInternalMessages()) } catch {}
    try { setAlerts(Store.getAlerts()) } catch {}
    Promise.all([
      fetch('/api/accounts.php').then(r => r.json()).catch(() => Store.getAccounts()),
      fetch('/api/accounts.php?trash=1').then(r => r.json()).catch(() => []),
    ]).then(([active, trashed]) => {
      setAccounts(active)
      setTrashedEmails(new Set(trashed.map(a => a.email)))
    })
  }, [])

  // ─── Computed data ────────────────────────────────────────────────────────
  const activeRes    = allRes.filter(r => !trashedEmails.has(r.client_email))
  const filtered     = filterByPeriod(activeRes, period)
  const countable    = filtered.filter(r => !SKIP_STATUSES.includes(r.status))
  const paid         = countable.filter(r => PAID_STATUSES.includes(r.status))
  const pending      = countable.filter(r => r.status === 'a_payer')
  const ca           = paid.reduce((s, r) => s + (r.price || 0), 0)
  const totalHours   = countable.reduce((s, r) => s + (r.duration || 0), 0)
  const totalPersons = countable.reduce((s, r) => s + (r.persons || 0), 0)
  const activeClients = accounts.filter(a => a.type === 'client' && !a.suspended && !trashedEmails.has(a.email)).length

  const studioStats = STUDIOS.map(studio => {
    const res     = countable.filter(r => r.studio === studio)
    const hours   = res.reduce((s, r) => s + (r.duration || 0), 0)
    const revenue = res.filter(r => PAID_STATUSES.includes(r.status)).reduce((s, r) => s + (r.price || 0), 0)
    const avail   = availableHours(period)
    const occ     = avail > 0 ? Math.min(100, Math.round((hours / avail) * 100)) : 0
    return { studio, hours, revenue, occ, sessions: res.length }
  })

  const ratedRes  = activeRes.filter(r => r.rating)
  const avgRating = ratedRes.length > 0 ? ratedRes.reduce((s, r) => s + r.rating, 0) / ratedRes.length : 0

  const weekDates    = getWeekDates()
  const weekMap      = {}
  activeRes.forEach(r => { weekMap[r.date] = (weekMap[r.date] || []).concat(r) })
  const today        = toYMD(new Date())
  const todayCheckins = checkIns.filter(c => c.date === today)
  const todaySessions = activeRes.filter(r => r.date === today && !SKIP_STATUSES.includes(r.status))
  const activeProjects = projects.filter(p => !['termine', 'completed', 'done'].includes(p.status) && !p.deleted)
  const openSAV       = savMessages.filter(m => !['closed', 'resolu', 'resolved'].includes(m.status) && !m.deleted)
  const unreadMsgs    = internalMsgs.filter(m => !m.read_admin)
  const activeAlerts  = alerts.filter(a => !a.resolved && !a.archived)

  const systemStatus = activeAlerts.length > 0 || pending.length > 5
    ? 'ALERTE'
    : pending.length > 0 ? 'ATTENTION' : 'OPÉRATIONNEL'
  const systemStyle = systemStatus === 'ALERTE'
    ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : systemStatus === 'ATTENTION'
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-green-400 bg-green-500/10 border-green-500/30'
  const systemDot = systemStatus === 'ALERTE' ? 'bg-red-400' : systemStatus === 'ATTENTION' ? 'bg-amber-400' : 'bg-green-400'

  // ─── KPI definitions ─────────────────────────────────────────────────────
  const kpis = [
    { label: "Chiffre d'affaires", value: formatPrice(ca),    icon: <TrendingUp className="w-4 h-4" />,   color: 'text-green-400',  path: createPageUrl('AdminReservations') },
    { label: 'Sessions payées',    value: paid.length,        icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-cyan-400',   path: createPageUrl('AdminReservations') },
    { label: 'En attente',         value: pending.length,     icon: <CreditCard className="w-4 h-4" />,   color: pending.length > 0 ? 'text-amber-400' : 'text-zinc-600', path: createPageUrl('AdminReservations') },
    { label: 'Heures réservées',   value: `${totalHours}h`,   icon: <Timer className="w-4 h-4" />,        color: 'text-violet-400', path: createPageUrl('AdminReservations') },
    { label: 'Clients actifs',     value: activeClients,      icon: <Users className="w-4 h-4" />,        color: 'text-purple-400', path: createPageUrl('AdminAccounts') },
    { label: 'Total réservations', value: countable.length,   icon: <ClipboardList className="w-4 h-4" />,color: 'text-blue-400',   path: createPageUrl('AdminReservations') },
    { label: 'Personnes vues',     value: totalPersons,       icon: <Camera className="w-4 h-4" />,       color: 'text-pink-400',   path: createPageUrl('AdminReservations') },
  ]

  const [kpiOrder, setKpiOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ls_kpi_order')) || null } catch { return null }
  })
  const orderedKpis = kpiOrder ? kpiOrder.map(i => kpis[i]).filter(Boolean) : kpis
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = orderedKpis.findIndex(k => k.label === active.id)
    const newIdx = orderedKpis.findIndex(k => k.label === over.id)
    const newOrder = arrayMove(orderedKpis, oldIdx, newIdx)
    const indices = newOrder.map(k => kpis.findIndex(x => x.label === k.label))
    setKpiOrder(indices)
    localStorage.setItem('ls_kpi_order', JSON.stringify(indices))
  }

  const toggleMaintenance = (studio) => {
    const updated = { ...studioMaint, [studio]: !studioMaint[studio] }
    setStudioMaint(updated)
    localStorage.setItem('ls_studio_maintenance', JSON.stringify(updated))
  }

  const timeStr = clockTime.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const dateStr = clockTime.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()

  const COMMANDS = [
    { label: '+ RÉSERVATION',   icon: <Plus className="w-3.5 h-3.5" />,          action: () => navigate('/admin/reservations', { state: { openCreate: true } }),  color: 'text-cyan-400',    hover: 'hover:border-cyan-700/60 hover:bg-cyan-950/20'    },
    { label: '+ COMPTE',        icon: <UserPlus className="w-3.5 h-3.5" />,       action: () => navigate('/admin/accounts', { state: { openModal: 'choice' } }),   color: 'text-blue-400',    hover: 'hover:border-blue-700/60 hover:bg-blue-950/20'    },
    { label: '+ CODE PROMO',    icon: <Tag className="w-3.5 h-3.5" />,            action: () => navigate('/admin/promo', { state: { openAdd: true } }),             color: 'text-green-400',   hover: 'hover:border-green-700/60 hover:bg-green-950/20'  },
    { label: '+ COMMUNICATION', icon: <Megaphone className="w-3.5 h-3.5" />,      action: () => navigate('/admin/communication', { state: { openAdd: true } }),    color: 'text-orange-400',  hover: 'hover:border-orange-700/60 hover:bg-orange-950/20'},
    { label: 'CALENDRIER',      icon: <Calendar className="w-3.5 h-3.5" />,       action: () => navigate(createPageUrl('AdminCalendar')),                           color: 'text-violet-400',  hover: 'hover:border-violet-700/60 hover:bg-violet-950/20'},
    { label: 'KANBAN',          icon: <FolderOpen className="w-3.5 h-3.5" />,     action: () => navigate(createPageUrl('AdminProjects')),                           color: 'text-purple-400',  hover: 'hover:border-purple-700/60 hover:bg-purple-950/20'},
    { label: 'RUSHES',          icon: <Film className="w-3.5 h-3.5" />,           action: () => navigate(createPageUrl('AdminRushes')),                             color: 'text-pink-400',    hover: 'hover:border-pink-700/60 hover:bg-pink-950/20'   },
    { label: 'FACTURATION',     icon: <Receipt className="w-3.5 h-3.5" />,        action: () => navigate('/admin/recette'),                                         color: 'text-emerald-400', hover: 'hover:border-emerald-700/60 hover:bg-emerald-950/20'},
    { label: 'TARIFS',          icon: <DollarSign className="w-3.5 h-3.5" />,     action: () => navigate(createPageUrl('AdminPricing')),                            color: 'text-yellow-400',  hover: 'hover:border-yellow-700/60 hover:bg-yellow-950/20'},
    { label: 'SAV',             icon: <HeadphonesIcon className="w-3.5 h-3.5" />, action: () => navigate(createPageUrl('AdminSAV')),                                color: 'text-red-400',     hover: 'hover:border-red-700/60 hover:bg-red-950/20'     },
    { label: 'POINTAGE',        icon: <Clock className="w-3.5 h-3.5" />,          action: () => navigate(createPageUrl('AdminCheck')),                              color: 'text-teal-400',    hover: 'hover:border-teal-700/60 hover:bg-teal-950/20'   },
    { label: 'PERFORMANCES',    icon: <BarChart3 className="w-3.5 h-3.5" />,      action: () => navigate('/admin/perf'),                                            color: 'text-amber-400',   hover: 'hover:border-amber-700/60 hover:bg-amber-950/20' },
    { label: 'SATISFACTION',    icon: <Star className="w-3.5 h-3.5" />,           action: () => navigate('/admin/satisfaction'),                                    color: 'text-rose-400',    hover: 'hover:border-rose-700/60 hover:bg-rose-950/20'   },
    { label: 'ALERTES',         icon: <Bell className="w-3.5 h-3.5" />,           action: () => navigate('/admin/alerts'),                                          color: 'text-zinc-400',    hover: 'hover:border-zinc-600 hover:bg-zinc-800/50'      },
  ]

  const sessionStatusStyle = (status) => {
    if (status === 'tournee' || status === 'post-prod') return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/30'
    if (status === 'validee')  return 'text-green-400 bg-green-950/40 border-green-800/30'
    if (status === 'a_payer')  return 'text-amber-400 bg-amber-950/40 border-amber-800/30'
    if (status === 'livree')   return 'text-blue-400 bg-blue-950/40 border-blue-800/30'
    return 'text-zinc-500 bg-zinc-800 border-zinc-700'
  }
  const sessionStatusLabel = (status) => {
    const map = { tournee: 'EN COURS', 'post-prod': 'POST-PROD', validee: 'CONFIRMÉE', a_payer: 'À PAYER', livree: 'LIVRÉE', absente: 'ABSENT' }
    return map[status] || (status || '').toUpperCase()
  }

  return (
    <Layout navItems={NAV} title="Dashboard">
      <div className="space-y-3">

        {/* ── MISSION CONTROL HEADER ─────────────────────────────────────── */}
        <Panel>
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Brand + status */}
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${systemDot} animate-pulse flex-shrink-0`} />
                <div>
                  <div className="text-[8px] font-bold tracking-[0.3em] uppercase text-zinc-600">LEVEL STUDIOS</div>
                  <div className="text-white font-bold text-sm leading-tight tracking-wide">Mission Control</div>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg border ${systemStyle}`}>
                <Activity className="w-3 h-3" />
                {systemStatus}
              </div>
              {avgRating > 0 && (
                <button onClick={() => navigate('/admin/satisfaction')}
                  className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15 transition-all"
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {avgRating.toFixed(1)} / 5
                  <span className="opacity-60 font-normal">· {ratedRes.length} avis</span>
                </button>
              )}
              {/* Live counters */}
              <div className="flex items-center gap-1.5">
                {activeAlerts.length > 0 && (
                  <button onClick={() => navigate('/admin/alerts')}
                    className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-all"
                  ><Bell className="w-3 h-3" /> {activeAlerts.length}</button>
                )}
                {openSAV.length > 0 && (
                  <button onClick={() => navigate(createPageUrl('AdminSAV'))}
                    className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/15 transition-all"
                  ><HeadphonesIcon className="w-3 h-3" /> {openSAV.length} SAV</button>
                )}
                {unreadMsgs.length > 0 && (
                  <button onClick={() => navigate(createPageUrl('AdminMessaging'))}
                    className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/15 transition-all"
                  ><MessageSquare className="w-3 h-3" /> {unreadMsgs.length}</button>
                )}
              </div>
            </div>
            {/* Clock */}
            <div className="text-right">
              <div className="font-mono text-2xl font-black text-cyan-400 leading-none tabular-nums">{timeStr}</div>
              <div className="text-[8px] tracking-[0.15em] text-zinc-600 mt-0.5">{dateStr}</div>
            </div>
          </div>
        </Panel>

        {/* ── ALERT BANNER ──────────────────────────────────────────────────── */}
        {pending.length > 0 && (
          <button onClick={() => navigate(createPageUrl('AdminReservations'))}
            className="w-full border border-amber-800/50 bg-amber-950/20 rounded-xl px-5 py-2.5 flex items-center justify-between hover:bg-amber-950/30 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">
                {pending.length} réservation{pending.length > 1 ? 's' : ''} en attente de paiement
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:text-amber-400 transition-colors" />
          </button>
        )}

        {/* ── TIMELINE SEMAINE ──────────────────────────────────────────────── */}
        <Panel>
          <div className="p-4">
            <PanelHeader tag="TIMELINE" label="SEMAINE EN COURS" action={() => navigate(createPageUrl('AdminCalendar'))} actionLabel="CALENDRIER" />
            <div className="grid grid-cols-7 gap-2">
              {DAYS_FR.map((d, i) => {
                const date    = weekDates[i]
                const ymd     = toYMD(date)
                const dayRes  = weekMap[ymd] || []
                const isToday = ymd === today
                const barPct  = Math.min(100, (dayRes.length / 6) * 100)
                return (
                  <div key={i} onClick={() => navigate(createPageUrl('AdminCalendar'))} className="cursor-pointer group">
                    <div className={`rounded-xl p-2.5 text-center transition-all relative overflow-hidden ${
                      isToday
                        ? 'bg-cyan-950/60 border border-cyan-700/60'
                        : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600'
                    }`}>
                      {isToday && <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />}
                      <div className={`text-[8px] font-bold tracking-[0.18em] mb-1 ${isToday ? 'text-cyan-400' : 'text-zinc-600'}`}>{d}</div>
                      <div className={`text-sm font-mono font-black ${isToday ? 'text-white' : 'text-zinc-400'}`}>{date.getDate()}</div>
                      <div className="mt-2 h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isToday ? 'bg-cyan-500' : dayRes.length > 0 ? 'bg-zinc-500 group-hover:bg-zinc-400' : ''}`}
                          style={{ width: `${barPct}%` }} />
                      </div>
                      <div className={`text-[9px] font-mono font-bold mt-1 ${dayRes.length > 0 ? (isToday ? 'text-cyan-400' : 'text-zinc-400') : 'text-zinc-700'}`}>
                        {dayRes.length > 0 ? dayRes.length : '—'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Panel>

        {/* ── INSTRUMENTS KPI ───────────────────────────────────────────────── */}
        <Panel>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-cyan-500">◆ INSTRUMENTS</span>
                <span className="text-[9px] tracking-widest uppercase text-zinc-600">MÉTRIQUES</span>
              </div>
              <div className="flex items-center rounded-lg border border-zinc-800 overflow-hidden">
                {[['day','JOUR'],['month','MOIS'],['year','ANNÉE']].map(([p, label]) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-[9px] font-bold tracking-wider transition-colors border-r border-zinc-800 last:border-0 ${
                      period === p ? 'bg-cyan-950/60 text-cyan-400' : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >{label}</button>
                ))}
              </div>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedKpis.map(k => k.label)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {orderedKpis.map(k => (
                    <SortableKpiCard key={k.label} kpi={k} onNavigate={() => navigate(k.path)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </Panel>

        {/* ── STUDIOS + CREW + SESSIONS ─────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-3">

          {/* Studios */}
          <Panel>
            <div className="p-4">
              <PanelHeader tag="STUDIOS" label="STATUS TEMPS RÉEL" action={() => navigate(createPageUrl('AdminReservations'))} actionLabel="RÉSERVATIONS" />
              <div className="flex flex-col gap-3">
                {studioStats.map(s => {
                  const ac   = STUDIO_ACCENT[s.studio]
                  const maint = studioMaint[s.studio]
                  const badge = studioStatusBadge(s.occ, maint)
                  return (
                    <div key={s.studio} className={`border rounded-xl p-4 transition-all ${ac.border} ${ac.bg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${maint ? 'bg-orange-400' : s.occ > 0 ? 'bg-green-400 animate-pulse' : 'bg-zinc-700'}`} />
                          <span className={`font-mono font-black text-sm tracking-wider ${ac.text}`}>{s.studio.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${badge.cls}`}>{badge.label}</span>
                          <button
                            onClick={() => toggleMaintenance(s.studio)}
                            title={maint ? 'Sortir de maintenance' : 'Mettre en maintenance'}
                            className={`p-1 rounded border transition-all ${maint ? 'border-orange-600/60 text-orange-400 bg-orange-950/30' : 'border-zinc-700/50 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600'}`}
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] tracking-widest uppercase text-zinc-600">OCCUPATION</span>
                          <span className={`text-[9px] font-mono font-bold ${maint ? 'text-orange-400' : s.occ >= 70 ? 'text-green-400' : s.occ >= BREAKEVEN_PCT ? 'text-amber-400' : 'text-red-400'}`}>
                            {maint ? '— MAINT.' : `${s.occ}%`}
                          </span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full relative">
                          <div className={`h-full rounded-full transition-all ${maint ? 'bg-orange-500/60' : occupancyBarColor(s.occ)}`}
                            style={{ width: maint ? '100%' : `${s.occ}%` }} />
                          <div className="absolute top-0 h-full w-px bg-zinc-500/50" style={{ left: `${BREAKEVEN_PCT}%` }} title={`Seuil ${BREAKEVEN_PCT}%`} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[['HEURES', `${s.hours}h`], ['SESSIONS', s.sessions], ['RECETTE', formatPrice(s.revenue)]].map(([lbl, val]) => (
                          <div key={lbl}>
                            <div className="text-[7px] tracking-widest uppercase text-zinc-600 mb-0.5">{lbl}</div>
                            <div className={`font-mono text-sm font-bold ${ac.text}`}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Panel>

          {/* Right column: Crew + Sessions today + Projects */}
          <div className="flex flex-col gap-3">

            {/* Crew manifest */}
            <Panel>
              <div className="p-4">
                <PanelHeader tag="ÉQUIPAGE" label="PRÉSENCE DU JOUR" action={() => navigate(createPageUrl('AdminCheck'))} actionLabel="POINTAGE" />
                {todayCheckins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-7 gap-2">
                    <Clock className="w-7 h-7 text-zinc-800" />
                    <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-700">Aucun pointage aujourd'hui</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {todayCheckins.map(c => {
                      const emp    = employees.find(e => e.email === c.employee_email)
                      const name   = c.employee_name || emp?.name || '?'
                      const active = !c.check_out
                      return (
                        <div key={c.id} onClick={() => navigate(createPageUrl('AdminCheck'))}
                          className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2.5 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-green-400 animate-pulse' : 'bg-zinc-700'}`} />
                            <div className="w-7 h-7 rounded-lg bg-violet-900/50 border border-violet-800/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-violet-300 text-[10px] font-bold">{name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">{name}</div>
                              <div className="text-[8px] tracking-widest uppercase text-zinc-600">↑ {c.check_in}</div>
                            </div>
                          </div>
                          {active
                            ? <span className="text-[8px] font-bold tracking-wider px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">EN POSTE</span>
                            : <span className="text-[8px] font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500">↓ {c.check_out}</span>
                          }
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Panel>

            {/* Today's sessions */}
            <Panel>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-cyan-500">◆ SESSIONS</span>
                    <span className="text-[9px] tracking-widest uppercase text-zinc-600">AUJOURD'HUI</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-cyan-400">{todaySessions.length}</span>
                </div>
                {todaySessions.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-700">Aucune session programmée</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {todaySessions.slice(0, 5).map(r => (
                      <div key={r.id} onClick={() => navigate(createPageUrl('AdminReservations'))}
                        className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-mono text-zinc-600 flex-shrink-0">{r.start_time || '--:--'}</span>
                          <span className="text-[10px] font-semibold text-zinc-300 group-hover:text-white truncate transition-colors">{r.client_name}</span>
                          <span className="text-[8px] text-zinc-600 flex-shrink-0 hidden sm:block">{r.studio}</span>
                        </div>
                        <span className={`text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 ml-2 ${sessionStatusStyle(r.status)}`}>
                          {sessionStatusLabel(r.status)}
                        </span>
                      </div>
                    ))}
                    {todaySessions.length > 5 && (
                      <button onClick={() => navigate(createPageUrl('AdminReservations'))}
                        className="text-[9px] tracking-widest uppercase text-zinc-600 hover:text-cyan-400 transition-colors text-center py-1"
                      >+ {todaySessions.length - 5} autres →</button>
                    )}
                  </div>
                )}
              </div>
            </Panel>

            {/* Active projects shortcut */}
            {activeProjects.length > 0 && (
              <button onClick={() => navigate(createPageUrl('AdminProjects'))}
                className="border border-violet-900/40 bg-violet-950/20 hover:bg-violet-950/30 rounded-xl px-4 py-3 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <FolderOpen className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-violet-400">{activeProjects.length} projet{activeProjects.length > 1 ? 's' : ''} actif{activeProjects.length > 1 ? 's' : ''}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-violet-700 group-hover:text-violet-400 transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* ── COMMAND CENTER ────────────────────────────────────────────────── */}
        <Panel>
          <div className="p-4">
            <PanelHeader tag="COMMANDES" label="ACCÈS RAPIDE" />
            <div className="flex flex-wrap gap-2">
              {COMMANDS.map((cmd, i) => (
                <button key={i} onClick={cmd.action}
                  className={`flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg transition-all text-[9px] font-bold tracking-wider ${cmd.color} ${cmd.hover}`}
                >
                  {cmd.icon}
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </Panel>

      </div>
    </Layout>
  )
}
