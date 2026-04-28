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

const D = {
  tertiary:   '#88ebff',
  gradActive: 'linear-gradient(135deg, #88ebff 0%, #ea73fb 100%)',
}

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

const STUDIOS      = ['Studio A', 'Studio B', 'Studio C']
const DAILY_HOURS  = 12
const BREAKEVEN_PCT = 35
const PAID_STATUSES = ['validee', 'livree', 'tournee', 'post-prod']
const SKIP_STATUSES = ['annulee', 'rembourse']
const DAYS_FR       = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const STUDIO_DEF = {
  'Studio A': {
    dark:  { border:'rgba(34,211,238,0.22)',  bg:'rgba(34,211,238,0.07)',  text:'#67e8f9', bar:'#22d3ee' },
    light: { border:'rgba(14,116,144,0.22)',  bg:'rgba(14,116,144,0.05)', text:'#0e7490', bar:'#0891b2' },
  },
  'Studio B': {
    dark:  { border:'rgba(167,139,250,0.22)', bg:'rgba(167,139,250,0.07)', text:'#c4b5fd', bar:'#a78bfa' },
    light: { border:'rgba(109,40,217,0.22)',  bg:'rgba(109,40,217,0.05)', text:'#7c3aed', bar:'#7c3aed' },
  },
  'Studio C': {
    dark:  { border:'rgba(52,211,153,0.22)',  bg:'rgba(52,211,153,0.07)',  text:'#6ee7b7', bar:'#34d399' },
    light: { border:'rgba(5,150,105,0.22)',   bg:'rgba(5,150,105,0.05)',  text:'#047857', bar:'#059669' },
  },
}

function getWeekDates() {
  const now = new Date(); const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
}
function toYMD(d) { return d.toISOString().split('T')[0] }
function filterByPeriod(res, period) {
  const now = new Date()
  return res.filter(r => {
    const d = new Date(r.date)
    if (period === 'day')   return toYMD(d) === toYMD(now)
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return d.getFullYear() === now.getFullYear()
  })
}
function availableHours(period) {
  if (period === 'day') return DAILY_HOURS
  if (period === 'month') return 30 * DAILY_HOURS
  return 365 * DAILY_HOURS
}
function occuBarColor(occ) {
  if (occ >= 70) return '#22c55e'
  if (occ >= BREAKEVEN_PCT) return '#f59e0b'
  return '#ef4444'
}

// ── Sortable KPI card — top-level component (hooks-safe) ─────────────────────
function KpiCard({ kpi, isDark, bg, bdr, bdrHov, txt, sub, corner, onNavigate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: kpi.label })
  const [hov, setHov] = useState(false)
  const s = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    position: 'relative',
    background: bg,
    border: `1px solid ${hov ? bdrHov : bdr}`,
    borderRadius: '13px',
    padding: '14px 12px',
    overflow: 'hidden',
    userSelect: 'none',
  }
  return (
    <div ref={setNodeRef} style={s} {...attributes} {...listeners}
      onClick={onNavigate}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ position:'absolute', top:0, left:0, width:7, height:7, borderTop:`1.5px solid ${corner}`, borderLeft:`1.5px solid ${corner}`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, right:0, width:7, height:7, borderTop:`1.5px solid ${corner}`, borderRight:`1.5px solid ${corner}`, pointerEvents:'none' }} />
      <div style={{ marginBottom:'8px', color: kpi.color }}>{kpi.icon}</div>
      <div style={{ fontFamily:'monospace', fontSize:'21px', fontWeight:900, color: txt, lineHeight:1, marginBottom:'5px' }}>{kpi.value}</div>
      <div style={{ fontSize:'8px', fontWeight:700, letterSpacing:'0.17em', textTransform:'uppercase', color: sub, lineHeight:1.3 }}>{kpi.label}</div>
    </div>
  )
}

// ── Hoverable row (crew / session items) ─────────────────────────────────────
function HovRow({ children, style, bdrHov, defaultBdr, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...style, borderColor: hov ? bdrHov : defaultBdr, cursor: onClick ? 'pointer' : 'default', transition:'border-color 0.15s' }}
    >{children}</div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { theme } = useApp()
  const isDark    = theme === 'dark'
  const navigate  = useNavigate()

  const [period,     setPeriod]     = useState('month')
  const [clockTime,  setClockTime]  = useState(new Date())
  const { reservations: allRes } = useReservations({ interval: 60000 })
  const [accounts,    setAccounts]    = useState([])
  const [checkIns,    setCheckIns]    = useState([])
  const [employees,   setEmployees]   = useState([])
  const [trashedEmails,setTrashedEmails] = useState(new Set())
  const [projects,    setProjects]    = useState([])
  const [savMessages, setSavMessages] = useState([])
  const [internalMsgs,setInternalMsgs]= useState([])
  const [alertsData,  setAlertsData]  = useState([])
  const [studioMaint, setStudioMaint] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ls_studio_maintenance')) || {} } catch { return {} }
  })

  // ── Palette (aligned with Layout.jsx tokens) ──────────────────────────────
  const DS = {
    card:     isDark ? '#0d0d0d'                       : '#ffffff',
    cardBdr:  isDark ? 'rgba(255,255,255,0.06)'        : 'rgba(0,0,0,0.09)',
    cardHBdr: isDark ? 'rgba(136,235,255,0.2)'         : 'rgba(14,116,144,0.22)',
    rowBg:    isDark ? 'rgba(255,255,255,0.025)'       : 'rgba(0,0,0,0.025)',
    rowBdr:   isDark ? 'rgba(255,255,255,0.05)'        : 'rgba(0,0,0,0.07)',
    txt:      isDark ? '#ffffff'                        : '#0d0d1a',
    txt2:     isDark ? '#a1a1aa'                        : '#374151',
    muted:    isDark ? '#71717a'                        : '#9ca3af',
    corner:   isDark ? 'rgba(136,235,255,0.38)'        : 'rgba(0,100,160,0.3)',
    barTrack: isDark ? 'rgba(255,255,255,0.08)'        : 'rgba(0,0,0,0.09)',
    accent:   isDark ? D.tertiary                       : '#0369a1',
    tagColor: isDark ? 'rgba(136,235,255,0.62)'        : '#0369a1',
    divider:  isDark ? 'rgba(255,255,255,0.05)'        : 'rgba(0,0,0,0.06)',
    cmdBg:    isDark ? 'rgba(255,255,255,0.03)'        : 'rgba(0,0,0,0.03)',
    cmdBdr:   isDark ? 'rgba(255,255,255,0.07)'        : 'rgba(0,0,0,0.09)',
    todayBg:  isDark ? 'rgba(136,235,255,0.08)'        : 'rgba(14,116,144,0.07)',
    todayBdr: isDark ? 'rgba(136,235,255,0.38)'        : 'rgba(14,116,144,0.32)',
  }

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
    try { setAlertsData(Store.getAlerts()) } catch {}
    Promise.all([
      fetch('/api/accounts.php').then(r => r.json()).catch(() => Store.getAccounts()),
      fetch('/api/accounts.php?trash=1').then(r => r.json()).catch(() => []),
    ]).then(([active, trashed]) => {
      setAccounts(active)
      setTrashedEmails(new Set(trashed.map(a => a.email)))
    })
  }, [])

  // ── Computed ──────────────────────────────────────────────────────────────
  const activeRes    = allRes.filter(r => !trashedEmails.has(r.client_email))
  const filtered     = filterByPeriod(activeRes, period)
  const countable    = filtered.filter(r => !SKIP_STATUSES.includes(r.status))
  const paid         = countable.filter(r => PAID_STATUSES.includes(r.status))
  const pending      = countable.filter(r => r.status === 'a_payer')
  const ca           = paid.reduce((s, r) => s + (r.price || 0), 0)
  const totalHours   = countable.reduce((s, r) => s + (r.duration || 0), 0)
  const totalPersons = countable.reduce((s, r) => s + (r.persons || 0), 0)
  const activeClients= accounts.filter(a => a.type === 'client' && !a.suspended && !trashedEmails.has(a.email)).length

  const studioStats  = STUDIOS.map(studio => {
    const res     = countable.filter(r => r.studio === studio)
    const hours   = res.reduce((s, r) => s + (r.duration || 0), 0)
    const revenue = res.filter(r => PAID_STATUSES.includes(r.status)).reduce((s, r) => s + (r.price || 0), 0)
    const avail   = availableHours(period)
    const occ     = avail > 0 ? Math.min(100, Math.round((hours / avail) * 100)) : 0
    return { studio, hours, revenue, occ, sessions: res.length }
  })

  const ratedRes      = activeRes.filter(r => r.rating)
  const avgRating     = ratedRes.length > 0 ? ratedRes.reduce((s, r) => s + r.rating, 0) / ratedRes.length : 0
  const weekDates     = getWeekDates()
  const weekMap       = {}
  activeRes.forEach(r => { weekMap[r.date] = (weekMap[r.date] || []).concat(r) })
  const today         = toYMD(new Date())
  const todayCheckins = checkIns.filter(c => c.date === today)
  const todaySessions = activeRes.filter(r => r.date === today && !SKIP_STATUSES.includes(r.status))
  const activeProjects= projects.filter(p => !['termine','completed','done'].includes(p.status) && !p.deleted)
  const openSAV       = savMessages.filter(m => !['closed','resolu','resolved'].includes(m.status) && !m.deleted)
  const unreadMsgs    = internalMsgs.filter(m => !m.read_admin)
  const activeAlerts  = alertsData.filter(a => !a.resolved && !a.archived)

  const sysStatus = activeAlerts.length > 0 || pending.length > 5 ? 'ALERTE'
    : pending.length > 0 ? 'ATTENTION' : 'OPÉRATIONNEL'
  const sysColor  = sysStatus === 'ALERTE' ? '#ef4444' : sysStatus === 'ATTENTION' ? '#f59e0b' : '#22c55e'
  const sysBg     = `${sysColor}18`
  const sysBdr    = `${sysColor}40`

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = [
    { label:"Chiffre d'affaires", value:formatPrice(ca),   icon:<TrendingUp width={15} height={15} />,   color:'#22c55e', path:createPageUrl('AdminReservations') },
    { label:'Sessions payées',    value:paid.length,        icon:<CheckCircle2 width={15} height={15} />, color:'#22d3ee', path:createPageUrl('AdminReservations') },
    { label:'En attente',         value:pending.length,     icon:<CreditCard width={15} height={15} />,   color:pending.length > 0 ? '#f59e0b' : DS.muted, path:createPageUrl('AdminReservations') },
    { label:'Heures réservées',   value:`${totalHours}h`,   icon:<Timer width={15} height={15} />,        color:'#a78bfa', path:createPageUrl('AdminReservations') },
    { label:'Clients actifs',     value:activeClients,      icon:<Users width={15} height={15} />,        color:'#818cf8', path:createPageUrl('AdminAccounts') },
    { label:'Total réservations', value:countable.length,   icon:<ClipboardList width={15} height={15} />,color:'#60a5fa', path:createPageUrl('AdminReservations') },
    { label:'Personnes vues',     value:totalPersons,       icon:<Camera width={15} height={15} />,       color:'#f472b6', path:createPageUrl('AdminReservations') },
  ]

  const [kpiOrder, setKpiOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ls_kpi_order')) || null } catch { return null }
  })
  const orderedKpis = kpiOrder ? kpiOrder.map(i => kpis[i]).filter(Boolean) : kpis
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oi = orderedKpis.findIndex(k => k.label === active.id)
    const ni = orderedKpis.findIndex(k => k.label === over.id)
    const newOrder = arrayMove(orderedKpis, oi, ni)
    const idxs = newOrder.map(k => kpis.findIndex(x => x.label === k.label))
    setKpiOrder(idxs); localStorage.setItem('ls_kpi_order', JSON.stringify(idxs))
  }

  const toggleMaintenance = (studio) => {
    const upd = { ...studioMaint, [studio]: !studioMaint[studio] }
    setStudioMaint(upd); localStorage.setItem('ls_studio_maintenance', JSON.stringify(upd))
  }

  const timeStr = clockTime.toLocaleTimeString('fr-CA', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })
  const dateStr = clockTime.toLocaleDateString('fr-CA', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase()

  const sessBadge = (s) => {
    if (s === 'tournee' || s === 'post-prod') return { color:'#22d3ee', bg:'rgba(34,211,238,0.1)', bdr:'rgba(34,211,238,0.25)', lbl:'EN COURS' }
    if (s === 'validee')  return { color:'#22c55e', bg:'rgba(34,197,94,0.1)',  bdr:'rgba(34,197,94,0.25)',  lbl:'CONFIRMÉE' }
    if (s === 'a_payer')  return { color:'#f59e0b', bg:'rgba(245,158,11,0.1)', bdr:'rgba(245,158,11,0.25)', lbl:'À PAYER'    }
    if (s === 'livree')   return { color:'#60a5fa', bg:'rgba(96,165,250,0.1)', bdr:'rgba(96,165,250,0.25)', lbl:'LIVRÉE'    }
    return { color:DS.muted, bg:DS.cmdBg, bdr:DS.cmdBdr, lbl:(s||'').toUpperCase() }
  }

  // ── Shared inline-style helpers ───────────────────────────────────────────
  const card    = (extra = {}) => ({ background:DS.card, border:`1px solid ${DS.cardBdr}`, borderRadius:'14px', padding:'20px', ...extra })
  const rowBase = { background:DS.rowBg, border:`1px solid ${DS.rowBdr}`, borderRadius:'10px', padding:'10px 13px', display:'flex', alignItems:'center', justifyContent:'space-between' }
  const sectionLabel = (tag, sub) => (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
      <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color: DS.tagColor }}>◆ {tag}</span>
      {sub && <span style={{ fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color: DS.muted }}>{sub}</span>}
    </div>
  )
  const cardHdr = (tag, sub, action, actionLabel) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
      {sectionLabel(tag, sub)}
      {action && <button onClick={action} style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:DS.muted, background:'none', border:'none', cursor:'pointer', paddingBottom:'14px' }}>{actionLabel} →</button>}
    </div>
  )

  const CMDS = [
    { label:'+ RÉSERVATION',   icon:<Plus width={13} height={13} />,          clr:'#22d3ee', action:()=>navigate('/admin/reservations',{state:{openCreate:true}}) },
    { label:'+ COMPTE',        icon:<UserPlus width={13} height={13} />,       clr:'#60a5fa', action:()=>navigate('/admin/accounts',{state:{openModal:'choice'}}) },
    { label:'+ CODE PROMO',    icon:<Tag width={13} height={13} />,            clr:'#22c55e', action:()=>navigate('/admin/promo',{state:{openAdd:true}}) },
    { label:'+ COMMUNICATION', icon:<Megaphone width={13} height={13} />,     clr:'#fb923c', action:()=>navigate('/admin/communication',{state:{openAdd:true}}) },
    { label:'CALENDRIER',      icon:<Calendar width={13} height={13} />,       clr:'#a78bfa', action:()=>navigate(createPageUrl('AdminCalendar')) },
    { label:'KANBAN',          icon:<FolderOpen width={13} height={13} />,     clr:'#818cf8', action:()=>navigate(createPageUrl('AdminProjects')) },
    { label:'RUSHES',          icon:<Film width={13} height={13} />,           clr:'#f472b6', action:()=>navigate(createPageUrl('AdminRushes')) },
    { label:'FACTURATION',     icon:<Receipt width={13} height={13} />,        clr:'#34d399', action:()=>navigate('/admin/recette') },
    { label:'TARIFS',          icon:<DollarSign width={13} height={13} />,     clr:'#fbbf24', action:()=>navigate(createPageUrl('AdminPricing')) },
    { label:'SAV',             icon:<HeadphonesIcon width={13} height={13} />, clr:'#ef4444', action:()=>navigate(createPageUrl('AdminSAV')) },
    { label:'POINTAGE',        icon:<Clock width={13} height={13} />,          clr:'#2dd4bf', action:()=>navigate(createPageUrl('AdminCheck')) },
    { label:'PERFORMANCES',    icon:<BarChart3 width={13} height={13} />,      clr:'#f59e0b', action:()=>navigate('/admin/perf') },
    { label:'SATISFACTION',    icon:<Star width={13} height={13} />,           clr:'#fb7185', action:()=>navigate('/admin/satisfaction') },
    { label:'ALERTES',         icon:<Bell width={13} height={13} />,           clr:DS.txt2,   action:()=>navigate('/admin/alerts') },
  ]

  // ── hover helper (button enter/leave) ────────────────────────────────────
  const onEnter = (e, bg, bdr, clr) => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = bdr; if (clr) e.currentTarget.style.color = clr }
  const onLeave = (e, bg, bdr, clr) => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = bdr; if (clr) e.currentTarget.style.color = clr }

  return (
    <Layout navItems={NAV} title="Dashboard">
      <style>{`@keyframes lvl-pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={card()}>
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>

            <div style={{ display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
              {/* Brand dot + name */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:sysColor, boxShadow:`0 0 8px ${sysColor}`, flexShrink:0, animation:'lvl-pulse 2s ease-in-out infinite' }} />
                <div>
                  <div style={{ fontSize:'8px', fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:DS.muted }}>LEVEL STUDIOS</div>
                  <div style={{ fontSize:'15px', fontWeight:800, color:DS.txt, fontFamily:'Montserrat,sans-serif', letterSpacing:'-0.01em', lineHeight:1.2 }}>Mission Control</div>
                </div>
              </div>
              {/* System status pill */}
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'9px', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', padding:'5px 10px', borderRadius:'8px', background:sysBg, border:`1px solid ${sysBdr}`, color:sysColor }}>
                <Activity width={12} height={12} />{sysStatus}
              </div>
              {/* Rating */}
              {avgRating > 0 && (
                <button onClick={() => navigate('/admin/satisfaction')} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'9px', fontWeight:700, padding:'5px 10px', borderRadius:'8px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#f59e0b', cursor:'pointer' }}>
                  <Star width={11} height={11} style={{ fill:'#f59e0b' }} />
                  {avgRating.toFixed(1)} / 5 <span style={{ opacity:.6, fontWeight:400 }}>· {ratedRes.length} avis</span>
                </button>
              )}
              {/* Counters */}
              <div style={{ display:'flex', gap:'5px' }}>
                {activeAlerts.length > 0 && (
                  <button onClick={() => navigate('/admin/alerts')} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'9px', fontWeight:700, padding:'4px 9px', borderRadius:'7px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.28)', color:'#ef4444', cursor:'pointer' }}>
                    <Bell width={11} height={11} />{activeAlerts.length}
                  </button>
                )}
                {openSAV.length > 0 && (
                  <button onClick={() => navigate(createPageUrl('AdminSAV'))} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'9px', fontWeight:700, padding:'4px 9px', borderRadius:'7px', background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.28)', color:'#f97316', cursor:'pointer' }}>
                    <HeadphonesIcon width={11} height={11} />{openSAV.length} SAV
                  </button>
                )}
                {unreadMsgs.length > 0 && (
                  <button onClick={() => navigate(createPageUrl('AdminMessaging'))} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'9px', fontWeight:700, padding:'4px 9px', borderRadius:'7px', background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.28)', color:'#60a5fa', cursor:'pointer' }}>
                    <MessageSquare width={11} height={11} />{unreadMsgs.length}
                  </button>
                )}
              </div>
            </div>

            {/* Clock */}
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'monospace', fontSize:'26px', fontWeight:900, color:DS.accent, lineHeight:1, letterSpacing:'0.02em' }}>{timeStr}</div>
              <div style={{ fontSize:'8px', letterSpacing:'0.14em', color:DS.muted, marginTop:'3px' }}>{dateStr}</div>
            </div>
          </div>
        </div>

        {/* ── ALERT BANNER ──────────────────────────────────────────────── */}
        {pending.length > 0 && (
          <button onClick={() => navigate(createPageUrl('AdminReservations'))}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderRadius:'12px', background:'rgba(245,158,11,0.09)', border:'1px solid rgba(245,158,11,0.3)', cursor:'pointer', width:'100%' }}
            onMouseEnter={e => onEnter(e,'rgba(245,158,11,0.15)','rgba(245,158,11,0.4)',null)}
            onMouseLeave={e => onLeave(e,'rgba(245,158,11,0.09)','rgba(245,158,11,0.3)',null)}
          >
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <AlertTriangle width={15} height={15} style={{ color:'#f59e0b', flexShrink:0 }} />
              <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#f59e0b' }}>
                {pending.length} réservation{pending.length > 1 ? 's' : ''} en attente de paiement
              </span>
            </div>
            <ChevronRight width={15} height={15} style={{ color:'rgba(245,158,11,0.5)' }} />
          </button>
        )}

        {/* ── TIMELINE ──────────────────────────────────────────────────── */}
        <div style={card()}>
          {cardHdr('TIMELINE', 'SEMAINE EN COURS', () => navigate(createPageUrl('AdminCalendar')), 'CALENDRIER')}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'8px' }}>
            {DAYS_FR.map((d, i) => {
              const date    = weekDates[i]
              const ymd     = toYMD(date)
              const dayRes  = weekMap[ymd] || []
              const isToday = ymd === today
              return (
                <div key={i} onClick={() => navigate(createPageUrl('AdminCalendar'))}
                  style={{ background:isToday ? DS.todayBg : DS.rowBg, border:`1px solid ${isToday ? DS.todayBdr : DS.rowBdr}`, borderRadius:'12px', padding:'10px 6px', textAlign:'center', cursor:'pointer' }}
                  onMouseEnter={e => { if (!isToday) e.currentTarget.style.borderColor = DS.cardHBdr }}
                  onMouseLeave={e => { if (!isToday) e.currentTarget.style.borderColor = DS.rowBdr }}
                >
                  <div style={{ fontSize:'7px', fontWeight:700, letterSpacing:'0.18em', color:isToday ? DS.accent : DS.muted, marginBottom:'4px' }}>{d}</div>
                  <div style={{ fontFamily:'monospace', fontSize:'14px', fontWeight:900, color:isToday ? DS.txt : DS.txt2 }}>{date.getDate()}</div>
                  <div style={{ margin:'6px 0 3px', height:'3px', borderRadius:'2px', background:DS.barTrack, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(100,(dayRes.length/6)*100)}%`, borderRadius:'2px', background:isToday ? DS.accent : DS.muted }} />
                  </div>
                  <div style={{ fontFamily:'monospace', fontSize:'9px', fontWeight:700, color:dayRes.length > 0 ? (isToday ? DS.accent : DS.txt2) : DS.muted }}>
                    {dayRes.length > 0 ? dayRes.length : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── KPI INSTRUMENTS ───────────────────────────────────────────── */}
        <div style={card()}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            {sectionLabel('INSTRUMENTS', 'MÉTRIQUES')}
            <div style={{ display:'flex', border:`1px solid ${DS.divider}`, borderRadius:'9px', overflow:'hidden', marginBottom:'14px' }}>
              {[['day','JOUR'],['month','MOIS'],['year','ANNÉE']].map(([p,lbl]) => (
                <button key={p} onClick={() => setPeriod(p)} style={{ padding:'6px 12px', fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', border:'none', borderRight:`1px solid ${DS.divider}`, cursor:'pointer',
                  background: period === p ? (isDark ? 'rgba(136,235,255,0.1)' : 'rgba(14,116,144,0.1)') : 'transparent',
                  color: period === p ? DS.accent : DS.muted,
                }}>{lbl}</button>
              ))}
            </div>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedKpis.map(k => k.label)} strategy={rectSortingStrategy}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'8px' }}>
                {orderedKpis.map(k => (
                  <KpiCard key={k.label} kpi={k} isDark={isDark}
                    bg={DS.card} bdr={DS.cardBdr} bdrHov={DS.cardHBdr}
                    txt={DS.txt} sub={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.38)'}
                    corner={DS.corner}
                    onNavigate={() => navigate(k.path)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* ── STUDIOS + CREW ────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>

          {/* Studios */}
          <div style={card()}>
            {cardHdr('STUDIOS', 'STATUS TEMPS RÉEL', () => navigate(createPageUrl('AdminReservations')), 'RÉSERVATIONS')}
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {studioStats.map(s => {
                const def   = STUDIO_DEF[s.studio][isDark ? 'dark' : 'light']
                const maint = studioMaint[s.studio]
                const badge = maint
                  ? { lbl:'MAINTENANCE', clr:'#f97316', bg:'rgba(249,115,22,0.1)', bdr:'rgba(249,115,22,0.25)' }
                  : s.occ >= 70 ? { lbl:'OPTIMAL',  clr:'#22c55e', bg:'rgba(34,197,94,0.1)',  bdr:'rgba(34,197,94,0.25)' }
                  : s.occ >= BREAKEVEN_PCT ? { lbl:'ACTIF',   clr:'#f59e0b', bg:'rgba(245,158,11,0.1)', bdr:'rgba(245,158,11,0.25)' }
                  : s.occ === 0 ? { lbl:'INACTIF',  clr:DS.muted,  bg:DS.cmdBg, bdr:DS.cmdBdr }
                  : { lbl:'FAIBLE',   clr:'#ef4444', bg:'rgba(239,68,68,0.1)',  bdr:'rgba(239,68,68,0.25)' }
                const dotClr = maint ? '#f97316' : s.occ > 0 ? '#22c55e' : DS.muted
                return (
                  <div key={s.studio} style={{ background:def.bg, border:`1px solid ${def.border}`, borderRadius:'12px', padding:'14px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:dotClr, flexShrink:0, boxShadow: s.occ > 0 && !maint ? `0 0 6px ${dotClr}` : 'none', animation: s.occ > 0 && !maint ? 'lvl-pulse 2s ease-in-out infinite' : 'none' }} />
                        <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:'13px', color:def.text, letterSpacing:'0.08em' }}>{s.studio.toUpperCase()}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'8px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', padding:'3px 8px', borderRadius:'6px', background:badge.bg, border:`1px solid ${badge.bdr}`, color:badge.clr }}>{badge.lbl}</span>
                        <button onClick={() => toggleMaintenance(s.studio)} title={maint ? 'Sortir de maintenance' : 'Mettre en maintenance'} style={{ padding:'4px', borderRadius:'6px', border:`1px solid ${maint ? 'rgba(249,115,22,0.4)' : DS.cmdBdr}`, background:maint ? 'rgba(249,115,22,0.1)' : 'transparent', color:maint ? '#f97316' : DS.muted, cursor:'pointer' }}>
                          <Settings width={11} height={11} />
                        </button>
                      </div>
                    </div>
                    {/* Occupancy bar */}
                    <div style={{ marginBottom:'10px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                        <span style={{ fontSize:'7px', letterSpacing:'0.16em', textTransform:'uppercase', color:DS.muted }}>OCCUPATION</span>
                        <span style={{ fontFamily:'monospace', fontSize:'9px', fontWeight:700, color:maint ? '#f97316' : s.occ >= 70 ? '#22c55e' : s.occ >= BREAKEVEN_PCT ? '#f59e0b' : '#ef4444' }}>
                          {maint ? 'MAINT.' : `${s.occ}%`}
                        </span>
                      </div>
                      <div style={{ height:'5px', borderRadius:'3px', background:DS.barTrack, position:'relative', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:maint ? '100%' : `${s.occ}%`, borderRadius:'3px', background:maint ? '#f97316' : occuBarColor(s.occ), transition:'width 0.4s' }} />
                        <div style={{ position:'absolute', top:0, width:'1.5px', height:'100%', background:isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)', left:`${BREAKEVEN_PCT}%` }} />
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', textAlign:'center' }}>
                      {[['HEURES',`${s.hours}h`],['SESSIONS',s.sessions],['RECETTE',formatPrice(s.revenue)]].map(([lbl,val]) => (
                        <div key={lbl}>
                          <div style={{ fontSize:'7px', letterSpacing:'0.13em', textTransform:'uppercase', color:DS.muted, marginBottom:'3px' }}>{lbl}</div>
                          <div style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color:def.text }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

            {/* Crew */}
            <div style={card()}>
              {cardHdr('ÉQUIPAGE', 'PRÉSENCE DU JOUR', () => navigate(createPageUrl('AdminCheck')), 'POINTAGE')}
              {todayCheckins.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0', gap:'8px' }}>
                  <Clock width={26} height={26} style={{ color:DS.muted, opacity:.3 }} />
                  <p style={{ fontSize:'9px', letterSpacing:'0.17em', textTransform:'uppercase', color:DS.muted, margin:0 }}>Aucun pointage aujourd'hui</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {todayCheckins.map(c => {
                    const emp    = employees.find(e => e.email === c.employee_email)
                    const name   = c.employee_name || emp?.name || '?'
                    const active = !c.check_out
                    return (
                      <HovRow key={c.id} style={rowBase} bdrHov={DS.cardHBdr} defaultBdr={DS.rowBdr} onClick={() => navigate(createPageUrl('AdminCheck'))}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:5, height:5, borderRadius:'50%', background:active ? '#22c55e' : DS.muted, flexShrink:0, boxShadow:active ? '0 0 5px #22c55e' : 'none', animation:active ? 'lvl-pulse 2s ease-in-out infinite' : 'none' }} />
                          <div style={{ width:26, height:26, borderRadius:'7px', background:D.gradActive, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <span style={{ color:'#060606', fontSize:'11px', fontWeight:900 }}>{name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div style={{ fontSize:'12px', fontWeight:600, color:DS.txt }}>{name}</div>
                            <div style={{ fontSize:'9px', color:DS.muted }}>↑ {c.check_in}</div>
                          </div>
                        </div>
                        <span style={{ fontSize:'8px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 8px', borderRadius:'6px', background:active ? 'rgba(34,197,94,0.1)' : DS.cmdBg, border:`1px solid ${active ? 'rgba(34,197,94,0.25)' : DS.cmdBdr}`, color:active ? '#22c55e' : DS.muted }}>
                          {active ? 'EN POSTE' : `↓ ${c.check_out}`}
                        </span>
                      </HovRow>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Today sessions */}
            <div style={card()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                {sectionLabel('SESSIONS', "AUJOURD'HUI")}
                <span style={{ fontFamily:'monospace', fontSize:'14px', fontWeight:700, color:DS.accent, paddingBottom:'12px' }}>{todaySessions.length}</span>
              </div>
              {todaySessions.length === 0 ? (
                <div style={{ textAlign:'center', padding:'16px 0' }}>
                  <p style={{ fontSize:'9px', letterSpacing:'0.17em', textTransform:'uppercase', color:DS.muted, margin:0 }}>Aucune session programmée</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                  {todaySessions.slice(0,5).map(r => {
                    const sb = sessBadge(r.status)
                    return (
                      <HovRow key={r.id} style={{ ...rowBase, padding:'8px 12px' }} bdrHov={DS.cardHBdr} defaultBdr={DS.rowBdr} onClick={() => navigate(createPageUrl('AdminReservations'))}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0 }}>
                          <span style={{ fontFamily:'monospace', fontSize:'9px', color:DS.muted, flexShrink:0 }}>{r.start_time || '--:--'}</span>
                          <span style={{ fontSize:'11px', fontWeight:600, color:DS.txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.client_name}</span>
                          <span style={{ fontSize:'8px', color:DS.muted, flexShrink:0 }}>{r.studio}</span>
                        </div>
                        <span style={{ fontSize:'8px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'2px 7px', borderRadius:'5px', flexShrink:0, marginLeft:'6px', color:sb.color, background:sb.bg, border:`1px solid ${sb.bdr}` }}>{sb.lbl}</span>
                      </HovRow>
                    )
                  })}
                  {todaySessions.length > 5 && (
                    <button onClick={() => navigate(createPageUrl('AdminReservations'))} style={{ fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:DS.muted, background:'none', border:'none', cursor:'pointer', padding:'5px 0', textAlign:'center' }}>
                      +{todaySessions.length - 5} autres →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Active projects */}
            {activeProjects.length > 0 && (
              <button onClick={() => navigate(createPageUrl('AdminProjects'))}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:'12px', background:'rgba(129,140,248,0.08)', border:'1px solid rgba(129,140,248,0.22)', cursor:'pointer', width:'100%' }}
                onMouseEnter={e => onEnter(e,'rgba(129,140,248,0.14)','rgba(129,140,248,0.35)',null)}
                onMouseLeave={e => onLeave(e,'rgba(129,140,248,0.08)','rgba(129,140,248,0.22)',null)}
              >
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#818cf8', boxShadow:'0 0 5px rgba(129,140,248,0.6)', animation:'lvl-pulse 2s ease-in-out infinite' }} />
                  <FolderOpen width={13} height={13} style={{ color:'#818cf8' }} />
                  <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#818cf8' }}>{activeProjects.length} projet{activeProjects.length > 1 ? 's' : ''} actif{activeProjects.length > 1 ? 's' : ''}</span>
                </div>
                <ChevronRight width={13} height={13} style={{ color:'rgba(129,140,248,0.5)' }} />
              </button>
            )}
          </div>
        </div>

        {/* ── COMMAND CENTER ────────────────────────────────────────────── */}
        <div style={card()}>
          {sectionLabel('COMMANDES', 'ACCÈS RAPIDE')}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {CMDS.map((cmd, i) => (
              <button key={i} onClick={cmd.action}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', borderRadius:'9px', cursor:'pointer', fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', border:`1px solid ${DS.cmdBdr}`, background:DS.cmdBg, color:DS.txt2 }}
                onMouseEnter={e => { e.currentTarget.style.background=`${cmd.clr}12`; e.currentTarget.style.borderColor=`${cmd.clr}40`; e.currentTarget.style.color=cmd.clr }}
                onMouseLeave={e => { e.currentTarget.style.background=DS.cmdBg; e.currentTarget.style.borderColor=DS.cmdBdr; e.currentTarget.style.color=DS.txt2 }}
              >
                <span style={{ color:cmd.clr }}>{cmd.icon}</span>
                {cmd.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  )
}
