import React, { useState, useEffect } from 'react'
import { useReservations } from '../../hooks/useReservations'
import { useNavigate } from 'react-router-dom'
import {
  Bell, X, Search, ChevronLeft, ChevronRight,
  Clock, Layers, CalendarPlus, Zap, ShoppingBag,
  Film, Calendar, ArrowRight, CheckCircle2, Plus,
  TrendingUp, BarChart2, Star,
} from 'lucide-react'
import ClientLayout from '../../components/ClientLayout'
import { Store } from '../../data/store'
import { createPageUrl, formatDate, STATUS_CONFIG } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { translations } from '../../i18n/translations'

const STUDIO_PHOTOS = {
  'studio a': '/studios/studio-a.jpg',
  'studio b': '/studios/studio-b.jpg',
  'studio c': '/studios/studio-c.png',
}

const SLIDES = [
  '/studios/studio-a.jpg',
  '/studios/studio-b.jpg',
  '/studios/studio-c.png',
]


function buildArgentPacks() {
  const p = Store.getPrices()
  const a = p.services.find(s => s.id === 'ARGENT')?.price ?? 221
  const round = v => Math.round(v)
  return [
    { hours: 1,  pricePerHour: a,              total: a * 1,               discount: null },
    { hours: 4,  pricePerHour: round(a * 0.9),  total: round(a * 0.9) * 4,  discount: 10 },
    { hours: 10, pricePerHour: round(a * 0.85), total: round(a * 0.85) * 10, discount: 15, popular: true },
    { hours: 20, pricePerHour: round(a * 0.8),  total: round(a * 0.8) * 20,  discount: 20 },
  ]
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const { theme, lang } = useApp()
  const t = (k) => translations[lang]?.[k] || k
  const isDark = theme === 'dark'
  const navigate = useNavigate()

  const ARGENT_PACKS = buildArgentPacks()
  const firstName = user?.name?.split(' ')[0] || 'vous'
  const [slide, setSlide] = useState(0)

  const { reservations, reload: reloadRes } = useReservations({ clientEmail: user?.email })
  const [packs, setPacks]               = useState([])
  const [popup, setPopup]               = useState(null)
  const [search, setSearch]             = useState('')
  const [cancelModal, setCancelModal]   = useState(null)
  const [page, setPage]                 = useState(1)
  const [lastResFiles, setLastResFiles] = useState([])
  const [packModal, setPackModal]       = useState(false)
  const [buySuccess, setBuySuccess]     = useState(null)
  const [quickModal, setQuickModal]     = useState(false)
  const [quickDate, setQuickDate]       = useState('')
  const [quickTime, setQuickTime]       = useState('09:00')
  const PER_PAGE = 8

  useEffect(() => {
    if (!user) return
    setPacks(Store.getHourPacks().filter(p => p.client_email === user.email && p.hours_used < p.hours_total))
    const popups = Store.getPopupMessages()
    if (popups.length > 0) setPopup(popups[0])
  }, [user])

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const lastReservation = [...reservations].sort((a, b) => new Date(b.date) - new Date(a.date))[0]

  useEffect(() => {
    if (!lastReservation || !user) return
    fetch('/api/folders')
      .then(r => r.json())
      .then(data => {
        const ef = data.find(d => d.email === user.email)
        setLastResFiles(ef?.reservations?.[lastReservation.id] || [])
      })
      .catch(() => {})
  }, [lastReservation?.id, user?.email])

  const upcoming = reservations
    .filter(r => new Date(r.date) >= new Date() && r.status !== 'annulee')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]

  const totalHoursReserved = reservations
    .filter(r => r.status !== 'annulee')
    .reduce((s, r) => s + (Number(r.duration) || 0), 0)

  const hoursRemaining = packs.reduce((s, p) => s + (p.hours_total - p.hours_used), 0)
  const activePack = packs[0]

  // Stats
  const PAID_STATUSES = ['validee', 'tournee', 'post-prod', 'livree']
  const paidResas = reservations.filter(r => PAID_STATUSES.includes(r.status))
  const getResaPrice = (r) => {
    const p = Store.getPrices()
    const svc = (id, fb) => p.services.find(s => s.id === id)?.price ?? fb
    const opt = (id, fb) => p.options.find(o => o.id === id)?.price ?? fb
    const pph = (r.service || '').toUpperCase().includes('GOLD') ? svc('GOLD', 587) : svc('ARGENT', 221)
    const base = (Number(r.duration) || 1) * pph
    const OPTION_PRICES = {
      photo: opt('Photo', 44), short: opt('Short', 44), thumbnail: opt('Miniature', 44),
      live: opt('Live', 662), briefing: opt('BriefingLive', 118), replay: opt('Replay', 74),
      cm: opt('CommunityManager', 147), coaching: opt('Coaching', 588),
    }
    return base + Object.entries(r.options || {}).reduce((s, [k, v]) => v ? s + (OPTION_PRICES[k] || 0) : s, 0)
  }
  const totalSpent = paidResas.reduce((s, r) => s + getResaPrice(r), 0)
  const now = new Date()
  const thisMonth = reservations.filter(r => {
    const d = new Date(r.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && r.status !== 'annulee'
  }).length
  const studioCounts = reservations.filter(r => r.status !== 'annulee').reduce((acc, r) => {
    if (r.studio) acc[r.studio] = (acc[r.studio] || 0) + 1
    return acc
  }, {})
  const favStudio = Object.entries(studioCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const filtered = reservations.filter(r =>
    !search ||
    r.studio?.toLowerCase().includes(search.toLowerCase()) ||
    r.id?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleCancel = (resa) => {
    Store.updateReservation(resa.id, { status: 'annulee' })
    reloadRes()
    setCancelModal(null)
  }

  const handlePay = (resa) => {
    Store.updateReservation(resa.id, { status: 'validee', paid_at: new Date().toISOString() })
    reloadRes()
  }

  const handleBuyPack = (pack) => {
    const name = `ARGENT — Pack ${pack.hours}h`
    Store.addHourPack({
      client_email: user.email, client_name: user.name, name, tier: 'ARGENT',
      hours_total: pack.hours, hours_used: 0, price_cad: pack.total, price_per_hour: pack.pricePerHour,
    })
    setPacks(Store.getHourPacks().filter(p => p.client_email === user.email && p.hours_used < p.hours_total))
    setBuySuccess(name)
    setTimeout(() => { setBuySuccess(null); setPackModal(false) }, 2200)
  }

  const handleQuickBook = () => {
    if (!quickDate || !lastReservation) return
    const duration = Number(lastReservation.duration) || 1
    const [h, m] = quickTime.split(':').map(Number)
    const endH = h + duration
    const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    Store.addReservation({
      client_email: user.email, client_name: user.name,
      studio: lastReservation.studio, service: lastReservation.service,
      duration, date: quickDate, start_time: quickTime, end_time: endTime,
      status: 'a_payer', options: lastReservation.options || {},
    })
    reloadRes()
    setQuickModal(false); setQuickDate(''); setQuickTime('09:00')
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const card = isDark
    ? 'bg-zinc-900 border border-zinc-800 rounded-2xl'
    : 'bg-white border border-gray-200 rounded-2xl shadow-sm'
  const textPrimary   = isDark ? 'text-white'    : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputBg = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
  const tableRow  = isDark ? 'border-zinc-800 hover:bg-zinc-800/40' : 'border-gray-100 hover:bg-gray-50'
  const tableHead = isDark ? 'text-zinc-400 border-zinc-800 bg-zinc-900/50' : 'text-gray-500 border-gray-100 bg-gray-50'
  const divider   = isDark ? 'border-zinc-800' : 'border-gray-100'
  const lastSt    = lastReservation ? (STATUS_CONFIG[lastReservation.status] || STATUS_CONFIG.validee) : null
  const packPct   = activePack ? Math.round(((activePack.hours_total - activePack.hours_used) / activePack.hours_total) * 100) : 0
  const flags     = Store.getFeatureFlags()

  return (
    <ClientLayout transparent>

      {/* ── Hero slideshow ───────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '60vh', minHeight: 380, overflow: 'hidden' }}>
        {SLIDES.map((src, i) => (
          <div key={src} style={{
            position: 'absolute', inset: 0,
            opacity: i === slide ? 1 : 0,
            transition: 'opacity 1s ease',
          }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(20,20,20,0.95) 0%, rgba(20,20,20,0.35) 50%, rgba(0,0,0,0.2) 100%)',
        }} />

        {/* Welcome text */}
        <div style={{
          position: 'absolute', bottom: 48, left: 0, right: 0, padding: '0 4%',
        }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 8px', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.2 }}>
            Bienvenue chez Level Studios, {firstName} !
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
            Voici un aperçu de votre espace.
          </p>
        </div>

        {/* Slide dots */}
        <div style={{
          position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6,
        }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 20 : 6, height: 6, borderRadius: 3,
              background: i === slide ? '#fff' : 'rgba(255,255,255,0.35)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Prev / Next arrows */}
        <button onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)} style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(0,0,0,0.45)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
        >
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => setSlide(s => (s + 1) % SLIDES.length)} style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(0,0,0,0.45)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Popup notification ─────────────────────────────────────────────── */}
      {popup && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full">
          <div className={`${card} p-4`}>
            <div className="flex gap-3">
              <Bell size={18} className="text-violet-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${textPrimary}`}>{popup.title || 'Level Studio'}</p>
                <p className={`text-xs mt-1 ${textSecondary}`}>{popup.body}</p>
              </div>
              <button onClick={() => { Store.deletePopupMessage(popup.id); setPopup(null) }} className={textSecondary}>
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '32px 24px 40px' }}>
      <div className="space-y-4">

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`${card} px-4 py-3.5 flex items-center gap-3`}>
            <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={15} className="text-green-400" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${textSecondary} truncate`}>CA dépensé</p>
              <p className={`text-base font-black ${textPrimary} leading-tight`}>{totalSpent > 0 ? totalSpent.toLocaleString('fr-CA') : '0'} <span className={`text-xs font-medium ${textSecondary}`}>CAD</span></p>
            </div>
          </div>
          <div className={`${card} px-4 py-3.5 flex items-center gap-3`}>
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={15} className="text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${textSecondary} truncate`}>Ce mois-ci</p>
              <p className={`text-base font-black ${textPrimary} leading-tight`}>{thisMonth} <span className={`text-xs font-medium ${textSecondary}`}>session{thisMonth !== 1 ? 's' : ''}</span></p>
            </div>
          </div>
          <div className={`${card} px-4 py-3.5 flex items-center gap-3`}>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Star size={15} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${textSecondary} truncate`}>Studio favori</p>
              <p className={`text-base font-black ${textPrimary} leading-tight truncate`}>{favStudio}</p>
            </div>
          </div>
          <div className={`${card} px-4 py-3.5 flex items-center gap-3`}>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
              <Clock size={15} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${textSecondary} truncate`}>Total heures</p>
              <p className={`text-base font-black ${textPrimary} leading-tight`}>{totalHoursReserved} <span className={`text-xs font-medium ${textSecondary}`}>h</span></p>
            </div>
          </div>
        </div>

        {/* ── Hero — Dernière réservation ───────────────────────────────────── */}
        <div className={`${card} overflow-hidden`}>
          <div className="flex flex-col md:flex-row">

            {/* Photo strip */}
            <div className="relative md:w-48 h-32 md:h-auto flex-shrink-0">
              <img
                src={STUDIO_PHOTOS[(lastReservation?.studio || '').toLowerCase().trim()] || '/studios/studio-a.jpg'}
                alt={lastReservation?.studio || ''}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 md:hidden" />
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              {!lastReservation ? (
                <div className={`flex-1 flex flex-col gap-1 ${textSecondary}`}>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Dernière réservation</p>
                  <p className={`text-base font-semibold ${textPrimary}`}>Aucune réservation pour le moment</p>
                  <p className="text-sm">Commencez par réserver votre premier studio.</p>
                </div>
              ) : (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className={`text-[11px] font-semibold uppercase tracking-widest ${textSecondary}`}>Dernière réservation</p>
                    {lastSt && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lastSt.cls}`}>
                        {lang === 'fr' ? lastSt.label_fr : lastSt.label_en}
                      </span>
                    )}
                  </div>
                  <p className={`text-xl font-bold ${textPrimary}`}>{lastReservation.studio}</p>
                  <p className={`text-sm ${textSecondary}`}>
                    {formatDate(lastReservation.date)} · {lastReservation.start_time}–{lastReservation.end_time} · {lastReservation.duration}h
                  </p>
                  {/* Rushes */}
                  <div className="flex items-center gap-2 pt-1">
                    <Film size={13} className="text-violet-400 flex-shrink-0" />
                    {lastResFiles.length > 0 ? (
                      <button
                        onClick={() => navigate(createPageUrl('ClientLibrary'))}
                        className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        {lastResFiles.length} fichier{lastResFiles.length > 1 ? 's' : ''} disponible{lastResFiles.length > 1 ? 's' : ''} <ArrowRight size={12} />
                      </button>
                    ) : (
                      <span className={`text-xs ${textSecondary}`}>Rushes en attente de livraison</span>
                    )}
                  </div>
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex flex-row md:flex-col gap-2 md:min-w-[180px]">
                {lastReservation && (
                  <button
                    onClick={() => setQuickModal(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <Zap size={15} />
                    Réserver à nouveau
                  </button>
                )}
                <button
                  onClick={() => navigate('/reservation')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 border text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
                    isDark ? 'border-zinc-700 text-zinc-200 hover:bg-zinc-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Plus size={15} />
                  Nouvelle réservation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2 stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Heures restantes pack */}
          {flags.dashboard_pack_hours && <div className={`${card} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Layers size={17} className="text-blue-400" />
              </div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>Pack d'heures</p>
            </div>
            {activePack ? (
              <>
                <p className={`text-3xl font-black ${hoursRemaining > 0 ? 'text-blue-400' : textSecondary}`}>
                  {hoursRemaining}
                  <span className={`text-base font-medium ml-1 ${textSecondary}`}>h</span>
                </p>
                <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${packPct}%` }} />
                </div>
                <p className={`text-xs mt-1 ${textSecondary}`}>{activePack.name}</p>
              </>
            ) : (
              <>
                <p className={`text-3xl font-black ${textSecondary}`}>0<span className="text-base font-medium ml-1">h</span></p>
                <p className={`text-xs mt-1 ${textSecondary}`}>Aucun pack actif</p>
              </>
            )}
          </div>}

          {/* Achat rapide pack */}
          {flags.dashboard_buy_pack && <button
            onClick={() => setPackModal(true)}
            className={`${card} p-5 text-left group transition-colors ${isDark ? 'hover:border-violet-500/40 hover:bg-zinc-800/60' : 'hover:border-violet-300 hover:shadow-md'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors">
                <ShoppingBag size={17} className="text-amber-400 group-hover:text-violet-400 transition-colors" />
              </div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>Acheter un pack</p>
            </div>
            <p className={`text-sm font-semibold ${textPrimary}`}>Packs ARGENT</p>
            <p className={`text-xs mt-1 ${textSecondary}`}>À partir de {ARGENT_PACKS[0]?.pricePerHour} CAD/h · Jusqu'à −20%</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
              Voir les packs <ArrowRight size={12} />
            </div>
          </button>}
        </div>

        {/* ── Historique des réservations ───────────────────────────────────── */}
        <div className={`${card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
            <p className={`text-sm font-semibold ${textPrimary}`}>Historique des réservations</p>
            <div className="relative">
              <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className={`pl-8 pr-4 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-violet-500 w-40 ${inputBg}`}
                placeholder="Studio, ID…"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs font-semibold uppercase tracking-wide border-b ${tableHead}`}>
                  <th className="text-left px-5 py-3">Studio</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Créneau</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Durée</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`text-center py-14 ${textSecondary}`}>
                      <Calendar size={28} className="mx-auto mb-2 opacity-30" />
                      Aucune réservation
                    </td>
                  </tr>
                ) : paginated.map(r => {
                  const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.validee
                  return (
                    <tr key={r.id} className={`border-b ${tableRow}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={STUDIO_PHOTOS[(r.studio || '').toLowerCase().trim()] || '/studios/studio-a.jpg'} alt={r.studio || ''} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${textPrimary}`}>{r.studio}</p>
                            <p className={`text-[11px] font-mono ${textSecondary}`}>#{r.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-5 py-3 text-sm ${textSecondary}`}>{formatDate(r.date)}</td>
                      <td className={`px-5 py-3 hidden sm:table-cell text-sm ${textSecondary}`}>{r.start_time} – {r.end_time}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                          {lang === 'fr' ? st.label_fr : st.label_en}
                        </span>
                      </td>
                      <td className={`px-5 py-3 hidden md:table-cell text-sm ${textSecondary}`}>{r.duration}h</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {r.status === 'a_payer' && (
                            <button onClick={() => handlePay(r)} className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                              Payer
                            </button>
                          )}
                          {['validee', 'a_payer'].includes(r.status) && (
                            <button
                              onClick={() => setCancelModal(r)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500' : 'border-gray-200 text-gray-500 hover:text-gray-700'}`}
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-5 py-3 border-t text-sm ${divider}`}>
              <span className={`text-xs ${textSecondary}`}>Page {page} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                  <ChevronLeft size={15} className={textSecondary} />
                </button>
                <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-violet-600 text-white">{page}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                  <ChevronRight size={15} className={textSecondary} />
                </button>
              </div>
              <span className={`text-xs ${textSecondary}`}>8 / page</span>
            </div>
          )}
        </div>
      </div>
      </div>{/* end padding wrapper */}

      {/* ── Modal : Réserver à nouveau ─────────────────────────────────────── */}
      {quickModal && lastReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQuickModal(false)} />
          <div className={`relative w-full max-w-sm ${card} p-6`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className={`font-bold text-base ${textPrimary}`}>Réserver à nouveau</p>
                <p className={`text-sm ${textSecondary} mt-0.5`}>{lastReservation.studio} · {lastReservation.duration}h</p>
              </div>
              <button onClick={() => setQuickModal(false)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                <X size={16} className={textSecondary} />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className={`text-xs font-semibold ${textSecondary} block mb-1.5`}>Date</label>
                <input type="date" value={quickDate} min={new Date().toISOString().split('T')[0]} onChange={e => setQuickDate(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-violet-500 ${inputBg}`} />
              </div>
              <div>
                <label className={`text-xs font-semibold ${textSecondary} block mb-1.5`}>Heure de début</label>
                <input type="time" value={quickTime} onChange={e => setQuickTime(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-violet-500 ${inputBg}`} />
              </div>
            </div>
            <button onClick={handleQuickBook} disabled={!quickDate}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* ── Modal : Acheter un pack ────────────────────────────────────────── */}
      {packModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setPackModal(false); setBuySuccess(null) }} />
          <div className={`relative w-full max-w-md ${card} p-6`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className={`font-bold text-base ${textPrimary}`}>Packs d'heures ARGENT</p>
                <p className={`text-xs ${textSecondary} mt-0.5`}>Studio équipé · 4K · Livraison sous 24h</p>
              </div>
              <button onClick={() => { setPackModal(false); setBuySuccess(null) }} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                <X size={16} className={textSecondary} />
              </button>
            </div>

            {buySuccess ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <CheckCircle2 size={44} className="text-green-400" />
                <p className={`font-semibold ${textPrimary}`}>{buySuccess}</p>
                <p className={`text-sm ${textSecondary}`}>Pack ajouté à votre compte</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {ARGENT_PACKS.map(pack => (
                    <button key={pack.hours} onClick={() => handleBuyPack(pack)}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        pack.popular
                          ? 'border-violet-500 bg-violet-500/10 hover:bg-violet-500/20'
                          : isDark ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/40' : 'border-gray-200 hover:border-violet-300 bg-gray-50 hover:bg-violet-50/40'
                      }`}
                    >
                      {pack.popular && (
                        <span className="absolute -top-2 left-3 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Populaire</span>
                      )}
                      <p className={`font-black text-xl ${textPrimary}`}>{pack.hours}h</p>
                      <p className={`text-sm font-bold mt-0.5 ${pack.popular ? 'text-violet-400' : 'text-blue-400'}`}>{pack.total} CAD</p>
                      <p className={`text-xs ${textSecondary}`}>{pack.pricePerHour} CAD/h</p>
                      {pack.discount && <span className="text-[11px] font-bold text-green-400">−{pack.discount}%</span>}
                    </button>
                  ))}
                </div>
                <button onClick={() => navigate(createPageUrl('ClientSubscription'))}
                  className={`w-full text-xs font-semibold py-2.5 rounded-xl border transition-colors ${isDark ? 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500' : 'border-gray-200 text-gray-600 hover:text-gray-800'}`}>
                  Voir aussi les packs GOLD →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal : Annulation ────────────────────────────────────────────── */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCancelModal(null)} />
          <div className={`relative w-full max-w-sm ${card} p-6`}>
            <div className={`flex items-start gap-3 mb-4 p-3 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-800/40' : 'bg-red-50 border border-red-200'}`}>
              <span className="text-red-500 text-lg">⚠</span>
              <div>
                <p className={`font-semibold text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>{t('cancel_confirm_title')}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-red-400/70' : 'text-red-600'}`}>{t('cancel_confirm_msg')}</p>
              </div>
            </div>
            <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
              <p className={`font-semibold text-sm ${textPrimary}`}>{cancelModal.studio}</p>
              <p className={`text-xs ${textSecondary}`}>{formatDate(cancelModal.date)} · {cancelModal.start_time} – {cancelModal.end_time}</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => handleCancel(cancelModal)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                {t('cancel_reservation')}
              </button>
              <button onClick={() => setCancelModal(null)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {t('keep_reservation')}
              </button>
            </div>
          </div>
        </div>
      )}

    </ClientLayout>
  )
}
