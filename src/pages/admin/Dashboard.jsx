import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  LayoutDashboard, Users, Calendar, ClipboardList, FolderOpen, Zap,
  MessageSquare, HeadphonesIcon, Megaphone, Tag, Clock, BookOpen,
  Wrench, UserCheck, TrendingUp, AlertCircle, Bell, Plus, CreditCard,
  Timer, BarChart3, CheckCircle2, UserPlus, FlaskConical, Star, DollarSign, GitBranch, Medal, Receipt,
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
  { labelKey: 'nav_communication', path: createPageUrl('AdminCommunication'), icon: <Megaphone className="w-4 h-4" /> },
  { labelKey: 'nav_promo',         path: createPageUrl('AdminPromo'),         icon: <Tag className="w-4 h-4" /> },
  { labelKey: 'nav_pricing',       path: createPageUrl('AdminPricing'),       icon: <DollarSign className="w-4 h-4" /> },
  { separator: true },
  { labelKey: 'nav_check',         path: createPageUrl('AdminCheck'),         icon: <Clock className="w-4 h-4" /> },
  { labelKey: 'nav_perf',          path: '/admin/perf',                       icon: <Medal className="w-4 h-4" /> },
  { labelKey: 'nav_boarding',      path: createPageUrl('AdminBoarding'),      icon: <UserCheck className="w-4 h-4" /> },
  { labelKey: 'nav_manual',        path: createPageUrl('AdminManual'),        icon: <BookOpen className="w-4 h-4" /> },
  { labelKey: 'nav_tool',          path: createPageUrl('AdminTool'),          icon: <Wrench className="w-4 h-4" /> },
  { labelKey: 'nav_beta',          path: '/admin/beta',                       icon: <FlaskConical className="w-4 h-4" /> },
  { labelKey: 'nav_versions',      path: '/admin/versions',                   icon: <GitBranch className="w-4 h-4" /> },
]
export { NAV as ADMIN_NAV }

const STUDIOS = ['Studio A', 'Studio B', 'Studio C']
const DAILY_HOURS = 12        // available hours per studio per day
const BREAKEVEN_PCT = 35      // % occupancy = break-even threshold
const PAID_STATUSES = ['validee', 'livree', 'tournee', 'post-prod']
const SKIP_STATUSES = ['annulee', 'rembourse'] // excluded from hours + total count
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ─── helpers ──────────────────────────────────────────────────────────────────
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

function occupancyColor(pct) {
  if (pct >= 70) return 'bg-green-500'
  if (pct >= BREAKEVEN_PCT) return 'bg-yellow-500'
  return 'bg-red-500'
}
function occupancyTextColor(pct) {
  if (pct >= 70) return 'text-green-400'
  if (pct >= BREAKEVEN_PCT) return 'text-yellow-400'
  return 'text-red-400'
}

function SortableKpiCard({ kpi, cardHover, textSecondary, textPrimary, onNavigate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: kpi.label })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={onNavigate}
      className={`border rounded-2xl p-5 transition-all ${cardHover}`}
    >
      <div className={`flex items-center gap-2 mb-3 ${kpi.color}`}>
        {kpi.icon}
        <span className={`text-xs font-medium ${textSecondary}`}>{kpi.label}</span>
      </div>
      <div className={`text-2xl font-black ${textPrimary}`}>{kpi.value}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [allRes, setAllRes] = useState([])
  const [accounts, setAccounts] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [employees, setEmployees] = useState([])
  const [trashedEmails, setTrashedEmails] = useState(new Set())

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const cardHover = isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 cursor-pointer' : 'bg-white border-gray-200 shadow-sm hover:border-violet-300 cursor-pointer'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'
  const periodBtn = (p) => period === p
    ? 'bg-violet-600 text-white'
    : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'

  useEffect(() => {
    setAllRes(Store.getReservations())
    setAccounts(Store.getAccounts())
    setCheckIns(Store.getCheckIns())
    setEmployees(Store.getEmployees())
    fetch('/api/accounts.php?trash=1')
      .then(r => r.json())
      .then(trashed => setTrashedEmails(new Set(trashed.map(a => a.email))))
      .catch(() => {})
  }, [])

  // ─── filtered data (exclude trashed accounts + cancelled reservations) ──────
  const activeRes  = allRes.filter(r => !trashedEmails.has(r.client_email))
  const filtered   = filterByPeriod(activeRes, period)
  // Countable = not cancelled/refunded (these don't occupy studio time)
  const countable  = filtered.filter(r => !SKIP_STATUSES.includes(r.status))
  const paid       = countable.filter(r => PAID_STATUSES.includes(r.status))
  const pending    = countable.filter(r => r.status === 'a_payer')
  const ca         = paid.reduce((s, r) => s + (r.price || 0), 0)
  const totalHours = countable.reduce((s, r) => s + (r.duration || 0), 0)
  const activeClients = accounts.filter(a => a.type === 'client' && !a.suspended && !trashedEmails.has(a.email)).length
    || [...new Set(activeRes.map(r => r.client_email))].length

  // ─── studio breakdown ───────────────────────────────────────────────────────
  const studioStats = STUDIOS.map(studio => {
    const res = countable.filter(r => r.studio === studio)
    const hours = res.reduce((s, r) => s + (r.duration || 0), 0)
    const revenue = res.filter(r => PAID_STATUSES.includes(r.status)).reduce((s, r) => s + (r.price || 0), 0)
    const avail = availableHours(period)
    const occ = avail > 0 ? Math.min(100, Math.round((hours / avail) * 100)) : 0
    return { studio, hours, revenue, occ, sessions: res.length }
  })

  // ─── ratings ────────────────────────────────────────────────────────────────
  const ratedRes = activeRes.filter(r => r.rating)
  const avgRating = ratedRes.length > 0
    ? (ratedRes.reduce((s, r) => s + r.rating, 0) / ratedRes.length)
    : 0
  const rateDist = [5,4,3,2,1].map(n => ({
    star: n,
    count: ratedRes.filter(r => r.rating === n).length,
  }))
  const recentReviews = [...ratedRes]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4)
  const ratingPct = activeRes.length > 0 ? Math.round((ratedRes.length / activeRes.length) * 100) : 0

  // ─── week calendar ──────────────────────────────────────────────────────────
  const weekDates = getWeekDates()
  const weekMap = {}
  activeRes.forEach(r => { weekMap[r.date] = (weekMap[r.date] || []).concat(r) })
  const today = toYMD(new Date())

  // ─── today check-ins ────────────────────────────────────────────────────────
  const todayCheckins = checkIns.filter(c => c.date === today)

  // ─── KPI cards ──────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: formatPrice(ca),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-green-400',
      path: createPageUrl('AdminReservations'),
    },
    {
      label: 'Sessions payées',
      value: paid.length,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-blue-400',
      path: createPageUrl('AdminReservations'),
    },
    {
      label: 'En attente de paiement',
      value: pending.length,
      icon: <CreditCard className="w-5 h-5" />,
      color: 'text-yellow-400',
      path: createPageUrl('AdminReservations'),
    },
    {
      label: 'Heures réservées',
      value: `${totalHours}h`,
      icon: <Timer className="w-5 h-5" />,
      color: 'text-violet-400',
      path: createPageUrl('AdminReservations'),
    },
    {
      label: 'Comptes clients actifs',
      value: activeClients,
      icon: <Users className="w-5 h-5" />,
      color: 'text-purple-400',
      path: createPageUrl('AdminAccounts'),
    },
    {
      label: 'Total réservations',
      value: countable.length,
      icon: <ClipboardList className="w-5 h-5" />,
      color: 'text-cyan-400',
      path: createPageUrl('AdminReservations'),
    },
  ]

  const QUICK = [
    { label: 'Nouvelle réservation', icon: <Plus className="w-5 h-5" />,      path: '/reservation',            color: 'text-violet-400', bg: isDark ? 'bg-violet-500/10' : 'bg-violet-50' },
    { label: 'Créer un compte',      icon: <UserPlus className="w-5 h-5" />,  path: '/admin/accounts',         color: 'text-blue-400',   bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' },
    { label: 'Nouveau code promo',   icon: <Tag className="w-5 h-5" />,       path: '/admin/promo',            color: 'text-green-400',  bg: isDark ? 'bg-green-500/10' : 'bg-green-50' },
    { label: 'Nouvelle communication', icon: <Megaphone className="w-5 h-5" />, path: '/admin/communication', color: 'text-orange-400', bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50' },
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

  return (
    <Layout navItems={NAV} title="Dashboard">
      <div className="space-y-6">

        {/* Header + period toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${textPrimary}`}>Bonjour, Joe 👋</h2>
            <p className={`text-sm ${textSecondary}`}>Vue d'ensemble de Level Studios</p>
          </div>
          <div className={`flex items-center rounded-xl border overflow-hidden text-sm font-semibold ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
            {[['day','Jour'],['month','Mois'],['year','Année']].map(([p, label]) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 transition-colors ${periodBtn(p)}`}>{label}</button>
            ))}
          </div>
        </div>

        {/* KPI grid — draggable */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedKpis.map(k => k.label)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {orderedKpis.map((k) => (
                <SortableKpiCard key={k.label} kpi={k} cardHover={cardHover} textSecondary={textSecondary} textPrimary={textPrimary} onNavigate={() => navigate(k.path)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Studio breakdown */}
        <div className={`border rounded-2xl p-6 ${card}`}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h3 className={`font-bold ${textPrimary}`}>Performance par studio</h3>
            <span className={`text-xs ${textSecondary}`}>— seuil de rentabilité à {BREAKEVEN_PCT}%</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {studioStats.map(s => (
              <div
                key={s.studio}
                onClick={() => navigate(createPageUrl('AdminReservations'))}
                className={`rounded-xl p-4 border cursor-pointer transition-all ${isDark ? 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500' : 'bg-gray-50 border-gray-200 hover:border-violet-300'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-semibold text-sm ${textPrimary}`}>{s.studio}</span>
                  <span className={`text-xs font-bold ${occupancyTextColor(s.occ)}`}>{s.occ}%</span>
                </div>
                {/* Occupancy bar */}
                <div className={`h-2 rounded-full mb-1 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-2 rounded-full transition-all ${occupancyColor(s.occ)}`}
                    style={{ width: `${s.occ}%` }}
                  />
                </div>
                {/* Break-even marker */}
                <div className="relative h-0 mb-3">
                  <div
                    className="absolute -top-2 w-0.5 h-3 bg-zinc-500/60"
                    style={{ left: `${BREAKEVEN_PCT}%` }}
                    title={`Seuil de rentabilité ${BREAKEVEN_PCT}%`}
                  />
                </div>
                <div className={`flex justify-between text-xs mt-2 ${textSecondary}`}>
                  <span>{s.hours}h réservées</span>
                  <span className={`font-semibold ${textPrimary}`}>{formatPrice(s.revenue)}</span>
                </div>
                <div className={`text-xs mt-1 ${textSecondary}`}>{s.sessions} session{s.sessions !== 1 ? 's' : ''}</div>
                {s.occ < BREAKEVEN_PCT && s.occ > 0 && (
                  <div className="mt-2 text-[10px] font-semibold text-red-400 bg-red-500/10 rounded-lg px-2 py-1 text-center">
                    Sous le seuil de rentabilité
                  </div>
                )}
                {s.occ === 0 && (
                  <div className={`mt-2 text-[10px] rounded-lg px-2 py-1 text-center ${isDark ? 'text-zinc-600 bg-zinc-800' : 'text-gray-400 bg-gray-100'}`}>
                    Aucune session
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Satisfaction client ─────────────────────────────────────────── */}
        <div className={`border rounded-2xl p-6 ${card}`}>
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className={`font-bold ${textPrimary}`}>Satisfaction client</h3>
            <span className={`text-xs ${textSecondary}`}>— {ratedRes.length} avis · {ratingPct}% des sessions évaluées</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Score global */}
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <p className={`text-6xl font-black ${textPrimary}`}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={18} className={n <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : isDark ? 'text-zinc-700 fill-zinc-700' : 'text-gray-200 fill-gray-200'} />
                ))}
              </div>
              <p className={`text-xs ${textSecondary}`}>Note moyenne / 5</p>
            </div>

            {/* Distribution */}
            <div className="space-y-1.5 py-1">
              {rateDist.map(({ star, count }) => {
                const pct = ratedRes.length > 0 ? Math.round((count / ratedRes.length) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 w-16 flex-shrink-0">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={9} className={n <= star ? 'text-amber-400 fill-amber-400' : isDark ? 'text-zinc-700 fill-zinc-700' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                    <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                      <div
                        className="h-2 rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-xs w-6 text-right flex-shrink-0 ${textSecondary}`}>{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Derniers avis */}
            <div className="space-y-2">
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textSecondary}`}>Derniers avis</p>
              {recentReviews.length === 0 ? (
                <p className={`text-xs ${textSecondary}`}>Aucun avis pour le moment</p>
              ) : recentReviews.map(r => (
                <div key={r.id} className={`rounded-xl px-3 py-2 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-semibold truncate ${textPrimary}`}>{r.client_name}</span>
                    <div className="flex gap-0.5 flex-shrink-0">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={9} className={n <= r.rating ? 'text-amber-400 fill-amber-400' : isDark ? 'text-zinc-700 fill-zinc-700' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                  </div>
                  {r.rating_comment && (
                    <p className={`text-[10px] truncate ${textSecondary}`}>"{r.rating_comment}"</p>
                  )}
                  <p className={`text-[10px] mt-0.5 ${textSecondary} opacity-60`}>{r.studio} · {r.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Mini week calendar */}
          <div className={`border rounded-2xl p-6 ${card}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" />
                <h3 className={`font-bold ${textPrimary}`}>Semaine en cours</h3>
              </div>
              <button onClick={() => navigate(createPageUrl('AdminCalendar'))} className={`text-xs transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                Voir calendrier →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_FR.map((d, i) => {
                const date = weekDates[i]
                const ymd = toYMD(date)
                const dayRes = weekMap[ymd] || []
                const isToday = ymd === today
                return (
                  <div
                    key={i}
                    onClick={() => navigate(createPageUrl('AdminCalendar'))}
                    className={`rounded-xl p-2 text-center cursor-pointer transition-all ${
                      isToday
                        ? 'bg-violet-600 text-white'
                        : isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`text-[10px] font-medium mb-1 ${isToday ? 'text-violet-200' : textSecondary}`}>{d}</div>
                    <div className={`text-sm font-bold ${isToday ? 'text-white' : textPrimary}`}>{date.getDate()}</div>
                    {dayRes.length > 0 && (
                      <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                        {dayRes.slice(0, 3).map((_, j) => (
                          <div key={j} className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-violet-300' : 'bg-violet-500'}`} />
                        ))}
                        {dayRes.length > 3 && <div className={`text-[8px] font-bold ${isToday ? 'text-violet-200' : 'text-violet-400'}`}>+{dayRes.length - 3}</div>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today's check-ins */}
          <div className={`border rounded-2xl p-6 ${card}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <h3 className={`font-bold ${textPrimary}`}>Pointage du jour</h3>
              </div>
              <button onClick={() => navigate(createPageUrl('AdminCheck'))} className={`text-xs transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                Voir tout →
              </button>
            </div>
            {todayCheckins.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-8 gap-2 ${textSecondary}`}>
                <Clock className="w-8 h-8 opacity-20" />
                <p className="text-sm">Aucun pointage aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayCheckins.map(c => {
                  const emp = employees.find(e => e.email === c.employee_email)
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(createPageUrl('AdminCheck'))}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{(c.employee_name || emp?.name || '?').charAt(0)}</span>
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${textPrimary}`}>{c.employee_name || emp?.name}</div>
                          <div className={`text-xs ${textSecondary}`}>Entrée {c.check_in}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {c.check_out ? (
                          <span className={`text-xs font-medium px-2 py-1 rounded-lg bg-green-500/10 text-green-400`}>
                            Sorti {c.check_out}
                          </span>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400`}>
                            En poste
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className={`border rounded-2xl p-6 ${card}`}>
          <h3 className={`font-bold mb-4 ${textPrimary}`}>Accès rapide</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.path)}
                className={`rounded-xl p-4 flex flex-col items-center gap-2.5 text-xs font-semibold transition-all border ${
                  isDark
                    ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-800'
                    : 'border-gray-200 hover:border-violet-300 bg-gray-50 hover:bg-white'
                } ${textPrimary}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.bg} ${a.color}`}>
                  {a.icon}
                </div>
                <span className="text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  )
}
