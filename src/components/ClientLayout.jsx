import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bell, ChevronDown, ChevronUp, LogOut, User,
  Sun, Moon,
  Home, CalendarDays, FolderOpen, CreditCard, Headphones,
  KeyRound, Menu, Star, Megaphone, X as XIcon,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { translations } from '../i18n/translations'
import { createPageUrl } from '../utils'
import { Store } from '../data/store'
import ClientChatBot from './ClientChatBot'

// ── Design tokens identiques au layout admin ─────────────────────────────────
const D = {
  tertiary:   '#88ebff',
  primary:    '#ff89ac',
  secondary:  '#ea73fb',
  muted:      '#adaaaa',
  gradFull:   'linear-gradient(135deg, #ff89ac 0%, #ea73fb 50%, #88ebff 100%)',
  gradActive: 'linear-gradient(135deg, #88ebff 0%, #ea73fb 100%)',
}
const DARK = {
  page:    '#060606',
  sidebar: '#080808',
  header:  'rgba(6,6,6,0.90)',
  divider: 'rgba(255,255,255,0.05)',
  hover:   'rgba(136,235,255,0.06)',
}
const LIGHT = {
  page:    '#f4f4f8',
  sidebar: '#ffffff',
  header:  'rgba(255,255,255,0.92)',
  divider: 'rgba(0,0,0,0.06)',
  hover:   'rgba(136,235,255,0.08)',
}

// ── Netflix layout accent ─────────────────────────────────────────────────────
const ACCENT = '#00bcd4'

function RatingPopup({ onSubmit }) {
  const [hover,    setHover]    = useState(0)
  const [selected, setSelected] = useState(0)
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.88)' }}>
      <div className="rounded-2xl border border-zinc-700 p-8 w-80 text-center shadow-2xl" style={{ background: '#18181b' }}>
        <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
          <Star className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-lg font-bold text-white">Votre avis compte !</p>
        <p className="text-sm text-zinc-400 mt-2 mb-5">Comment s'est passée votre expérience<br />avec notre équipe support ?</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n}
              onMouseEnter={() => { if (!selected) setHover(n) }}
              onMouseLeave={() => setHover(0)}
              onClick={() => { if (!selected) setSelected(n) }}
              className="transition-transform hover:scale-110">
              <Star className={`w-9 h-9 transition-all ${(hover || selected) >= n ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
            </button>
          ))}
        </div>
        {selected > 0 && (
          <button onClick={() => onSubmit(selected)}
            className="mt-5 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors">
            Envoyer ma note →
          </button>
        )}
        <p className="text-[10px] text-zinc-600 mt-3">Ce formulaire est requis avant de continuer</p>
      </div>
    </div>
  )
}

export default function ClientLayout({ children, transparent = false, title }) {
  const { user, logout, impersonatedBy, stopImpersonating } = useAuth()
  const { theme, lang, toggleTheme, toggleLang } = useApp()
  const navigate  = useNavigate()
  const location  = useLocation()

  // classic view when impersonating, netflix otherwise
  const viewMode = impersonatedBy ? 'classic' : 'netflix'

  const [scrolled,       setScrolled]       = useState(false)
  const [userMenu,       setUserMenu]       = useState(false)
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [ratingMsg,      setRatingMsg]      = useState(null)
  const [activeComms,    setActiveComms]    = useState([])
  const [showTicker,     setShowTicker]     = useState(false)
  const [blockingQueue,  setBlockingQueue]  = useState([]) // comms to show as blocking popup
  const userRef = useRef(null)

  function getDismissed() {
    try { return JSON.parse(sessionStorage.getItem('level_dismissed_comms') || '[]') } catch { return [] }
  }
  function addDismissed(id) {
    const existing = getDismissed()
    if (!existing.includes(id)) sessionStorage.setItem('level_dismissed_comms', JSON.stringify([...existing, id]))
  }

  function dismissBlockingPopup() {
    setBlockingQueue(q => {
      if (q.length === 0) return q
      addDismissed(q[0].id)
      return q.slice(1)
    })
  }

  useEffect(() => {
    if (!user) return
    const pending = Store.getMessages().find(m =>
      m.from_user_id === user.id &&
      m.status === 'closed' &&
      m.rating_requested &&
      !m.rating
    )
    setRatingMsg(pending || null)

    const now = Date.now()
    const dismissed = getDismissed()
    const comms = Store.getPopupMessages().filter(p => {
      if (p.duration_days) {
        const expires = new Date(p.created_at).getTime() + p.duration_days * 86400000
        if (expires < now) return false
      }
      if (p.target === 'all' || p.target === 'clients') return true
      if (p.target === `client:${user.email}`) return true
      return false
    })
    setActiveComms(comms)
    if (comms.length > 0) setShowTicker(true)
    // Queue blocking popups not yet dismissed this session
    const toBlock = comms.filter(c => !dismissed.includes(c.id))
    if (toBlock.length > 0) setBlockingQueue(toBlock)
  }, [user])

  const t      = (k) => translations[lang]?.[k] || k
  const isDark = theme === 'dark'

  const pendingCount = user
    ? Store.getReservations().filter(r => r.client_email === user.email && r.status === 'a_payer').length
    : 0

  // Classic (admin view) shows ALL client tabs — hardcoded /client/* paths, never neo
  const navItems = [
    { label: t('nav_dashboard') || 'Accueil',        path: '/client/dashboard',      icon: Home,         badge: null },
    { label: 'Réservations',                          path: '/client/reservations',   icon: CalendarDays, badge: pendingCount > 0 ? pendingCount : null },
    { label: t('nav_library') || 'Médiathèque',      path: '/client/library',        icon: FolderOpen,   badge: null },
    { label: "Packs d'heures",                        path: '/client/subscription',   icon: CreditCard,   badge: null },
    { label: 'Mon compte',                            path: '/client/account',        icon: User,         badge: null },
    { label: 'Support',                               path: '/client/contact',        icon: Headphones,   badge: null },
  ]

  const NAV_NF = [
    { label: t('nav_dashboard') || 'Accueil',      path: createPageUrl('ClientDashboard')    },
    { label: 'Réservations',                        path: '/clienttest/reservations'          },
    { label: t('nav_library') || 'Médiathèque',    path: createPageUrl('ClientLibrary')      },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const h = e => { if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const handleStopImpersonating = () => { stopImpersonating(); navigate('/admin/accounts') }
  const handleLogout             = () => { logout(); navigate('/') }

  // ── Communication ticker injected once ───────────────────────────────────
  const tickerText = activeComms.map(c => `📣 ${c.title} — ${c.message || c.body}`).join('     ·     ')
  const tickerDuration = Math.max(20, activeComms.length * 12)

  // ════════════════════════════════════════════════════════════════════════════
  // CLASSIC SIDEBAR LAYOUT — même design que le layout admin
  // ════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'classic') {
    const S           = isDark ? DARK : LIGHT
    const textPrimary = isDark ? '#ffffff' : '#0d0d1a'
    const textMuted   = isDark ? D.muted  : '#888'
    const navInactive = isDark ? 'rgba(173,170,170,0.65)' : '#888'
    const navHoverTxt = isDark ? '#ffffff' : D.tertiary

    const SidebarContent = () => (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: S.sidebar }}>

        {/* Logo row — identique admin */}
        <div style={{
          height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 18px', flexShrink: 0,
          background: isDark ? DARK.page : 'rgba(136,235,255,0.03)',
          borderBottom: `1px solid ${S.divider}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <img src="/logo.png" style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0, filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }} alt="Level Studios" />
            <div style={{ lineHeight: 1.2, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '-0.01em', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary, fontFamily: 'Montserrat, sans-serif' }}>Level Studios</span>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-block', background: `${D.tertiary}14`, color: D.tertiary, border: `1px solid ${D.tertiary}28` }}>
                Client
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <button onClick={toggleTheme} style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent', color: navInactive, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = D.tertiary}
              onMouseLeave={e => e.currentTarget.style.color = navInactive}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Accent line — dégradé complet identique admin */}
        <div style={{ height: '2px', background: D.gradFull, flexShrink: 0, opacity: 0.8 }} />

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(({ label, path, icon: Icon, badge }) => {
            const isActive = location.pathname === path
            return (
              <button key={path}
                onClick={() => { navigate(path); setSidebarOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: isActive ? 600 : 500,
                  border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
                  background: isActive ? D.gradActive : 'transparent',
                  color: isActive ? '#060606' : navInactive,
                  boxShadow: isActive ? `0 2px 18px rgba(136,235,255,0.28)` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = S.hover; e.currentTarget.style.color = navHoverTxt } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navInactive } }}
              >
                <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge && (
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '999px', fontWeight: 700, background: isActive ? 'rgba(6,6,6,0.2)' : D.tertiary, color: '#060606', minWidth: '18px', textAlign: 'center' }}>{badge}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom — langue + user card identique admin */}
        <div style={{ padding: '10px 8px', flexShrink: 0, borderTop: `1px solid ${S.divider}`, display: 'flex', flexDirection: 'column', gap: '4px', background: isDark ? DARK.page : 'rgba(136,235,255,0.02)' }}>
          <button onClick={toggleLang} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', border: 'none', cursor: 'pointer', background: 'transparent', color: navInactive, transition: 'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.background = S.hover; e.currentTarget.style.color = navHoverTxt }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navInactive }}
          >
            <span>{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
            <span style={{ fontWeight: 500 }}>{lang === 'fr' ? 'Français' : 'English'}</span>
            <ChevronDown size={12} style={{ marginLeft: 'auto' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: isDark ? '#050505' : `${D.tertiary}0a`, border: `1px solid ${D.tertiary}1e` }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, background: D.gradActive, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 12px rgba(136,235,255,0.28)` }}>
              <span style={{ color: '#060606', fontSize: '12px', fontWeight: 900 }}>{user?.name?.charAt(0) || 'C'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }}>{user?.name}</p>
              <p style={{ fontSize: '10px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textMuted }}>{user?.email}</p>
            </div>
            <button onClick={handleLogout} title={t('logout')} style={{ padding: '4px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent', color: textMuted, flexShrink: 0, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = D.primary}
              onMouseLeave={e => e.currentTarget.style.color = textMuted}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    )

    return (
      <div style={{ minHeight: '100vh', display: 'flex', background: S.page }}>
        <style>{`@keyframes commTicker{from{transform:translateX(100vw)}to{transform:translateX(-100%)}} @keyframes commPulse{0%,100%{opacity:1}50%{opacity:0.75;box-shadow:0 0 10px rgba(251,191,36,0.5)}}`}</style>
        {sidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 40, backdropFilter: 'blur(4px)' }}
            className="lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside style={{ position: 'fixed', top: impersonatedBy ? '36px' : '0', left: 0, height: impersonatedBy ? 'calc(100% - 36px)' : '100%', width: '256px', zIndex: 50, transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)', boxShadow: isDark ? `4px 0 32px rgba(0,0,0,0.6)` : '4px 0 24px rgba(0,0,0,0.08)' }}
          className={sidebarOpen ? '' : '-translate-x-full lg:translate-x-0'}
        >
          <SidebarContent />
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="lg:ml-64">
          <header style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: impersonatedBy ? '36px' : '0', zIndex: 30, background: S.header, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${S.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)} style={{ padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'transparent', color: navInactive }}>
                <Menu size={20} />
              </button>
              <h1 style={{ fontWeight: 800, fontSize: '17px', margin: 0, color: textPrimary, fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}>{title}</h1>
            </div>
            {activeComms.length > 0 && (
              <button onClick={() => setShowTicker(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700,
                padding: '5px 11px', borderRadius: '8px', cursor: 'pointer',
                background: showTicker ? 'rgba(251,191,36,0.18)' : 'rgba(251,191,36,0.09)',
                border: '1px solid rgba(251,191,36,0.35)', color: '#fbbf24',
                animation: showTicker ? 'none' : 'commPulse 2.2s ease-in-out infinite',
              }}>
                <Megaphone size={12} />
                <span>{activeComms.length} communication{activeComms.length > 1 ? 's' : ''}</span>
              </button>
            )}
          </header>

          {showTicker && activeComms.length > 0 && (
            <div style={{ position: 'sticky', top: impersonatedBy ? 'calc(36px + 64px)' : '64px', zIndex: 29, height: '32px', background: 'rgba(251,191,36,0.07)', borderBottom: '1px solid rgba(251,191,36,0.18)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <div style={{ whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 500, color: '#fbbf24', animation: `commTicker ${tickerDuration}s linear infinite` }}>
                {tickerText}
              </div>
              <button onClick={() => setShowTicker(false)} style={{ position: 'absolute', right: 8, background: 'transparent', border: 'none', color: 'rgba(251,191,36,0.5)', cursor: 'pointer', padding: 2 }}>
                <XIcon size={13} />
              </button>
            </div>
          )}

          <main style={{ flex: 1, padding: '24px', color: textPrimary }}>
            {children}
          </main>
        </div>

        {/* Blocking communication popup (classic view) */}
        {blockingQueue.length > 0 && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.80)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.5)'}`, borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Megaphone size={16} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#fff' : '#111' }}>Communication</span>
                </div>
                <button onClick={dismissBlockingPopup} style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: textMuted }}>
                  <XIcon size={18} />
                </button>
              </div>
              <div style={{ padding: '24px 20px' }}>
                {blockingQueue[0].title && (
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#fff' : '#111', marginBottom: '12px' }}>{blockingQueue[0].title}</h3>
                )}
                <p style={{ fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.75)' : '#444', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {blockingQueue[0].message || blockingQueue[0].body}
                </p>
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                <button onClick={dismissBlockingPopup} style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)', color: '#fbbf24', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  J'ai lu, fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // NETFLIX LAYOUT
  // ════════════════════════════════════════════════════════════════════════════
  const navBg = transparent && !scrolled
    ? 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)'
    : '#141414'

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: '#e5e5e5' }}>
      <style>{`@keyframes commTicker{from{transform:translateX(100vw)}to{transform:translateX(-100%)}} @keyframes commPulse{0%,100%{opacity:1}50%{opacity:0.75;box-shadow:0 0 10px rgba(251,191,36,0.5)}}`}</style>

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: impersonatedBy ? '36px' : '0', left: 0, right: 0, zIndex: 99,
        height: 68, background: navBg, transition: 'background 0.4s, top 0.2s',
        display: 'flex', alignItems: 'center', padding: '0 4%', gap: 28,
      }}>
        <div onClick={() => navigate(createPageUrl('ClientDashboard'))}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
        >
          <img src="/logo.png" alt="Level" style={{ height: 36, width: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontWeight: 900, fontSize: 16, color: '#fff', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}>
            Level Studios
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {NAV_NF.map(({ label, path }) => {
            const active = location.pathname === path
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                padding: '6px 12px', borderRadius: 6,
                fontSize: 13, fontWeight: active ? 600 : 400,
                border: 'none', cursor: 'pointer', background: 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                transition: 'color 0.15s', whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {activeComms.length > 0 && (
            <button onClick={() => setShowTicker(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700,
              padding: '5px 10px', borderRadius: '7px', cursor: 'pointer',
              background: showTicker ? 'rgba(251,191,36,0.18)' : 'rgba(251,191,36,0.09)',
              border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24',
              animation: showTicker ? 'none' : 'commPulse 2.2s ease-in-out infinite',
            }}>
              <Megaphone size={12} />
              <span>{activeComms.length}</span>
            </button>
          )}

          <button onClick={() => navigate('/clienttest/reservations')} style={{
            position: 'relative', width: 36, height: 36, borderRadius: 6,
            border: 'none', cursor: 'pointer', background: 'transparent',
            color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: '#ff4444', border: '2px solid #141414' }} />
            )}
          </button>

          <div ref={userRef} style={{ position: 'relative' }}>
            <button onClick={() => setUserMenu(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
              borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0, background: `linear-gradient(135deg, ${ACCENT} 0%, #ea73fb 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#060606' }}>
                {user?.name?.charAt(0) || 'C'}
              </div>
              <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.5)', transform: userMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {userMenu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220, borderRadius: 10, overflow: 'hidden', background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}>
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{user?.name || 'Client'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user?.email}</div>
                </div>

                {[
                  { icon: User, label: 'Mon profil', path: createPageUrl('ClientAccount') },
                ].map(({ icon: Icon, label, path }) => (
                  <button key={label} onClick={() => { navigate(path); setUserMenu(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 400, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.75)', transition: 'background 0.15s', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={14} style={{ color: ACCENT, flexShrink: 0 }} />
                    {label}
                  </button>
                ))}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                <button onClick={toggleTheme} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 400, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.5)', transition: 'background 0.15s', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {theme === 'dark' ? <Sun size={14} style={{ flexShrink: 0 }} /> : <Moon size={14} style={{ flexShrink: 0 }} />}
                  {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                </button>

                <button onClick={toggleLang} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 400, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.5)', transition: 'background 0.15s', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 13 }}>{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                  {lang === 'fr' ? 'Français' : 'English'}
                </button>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 400, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.5)', transition: 'background 0.15s', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.08)'; e.currentTarget.style.color = '#ff6b6b' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                >
                  <LogOut size={14} style={{ flexShrink: 0 }} />
                  {t('logout') || 'Se déconnecter'}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>


      {/* ── TICKER (neo) ─────────────────────────────────────────────────── */}
      {showTicker && activeComms.length > 0 && (
        <>
          <div style={{ position: 'fixed', top: impersonatedBy ? '104px' : '68px', left: 0, right: 0, zIndex: 98, height: '32px', background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 500, color: '#fbbf24', animation: `commTicker ${tickerDuration}s linear infinite` }}>
              {tickerText}
            </div>
            <button onClick={() => setShowTicker(false)} style={{ position: 'absolute', right: 8, background: 'transparent', border: 'none', color: 'rgba(251,191,36,0.6)', cursor: 'pointer', padding: 2 }}>
              <XIcon size={13} />
            </button>
          </div>
        </>
      )}

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <main style={{ padding: transparent ? (showTicker ? `${impersonatedBy ? 140 : 100}px 0 0` : 0) : `${(impersonatedBy ? 128 : 96) + (showTicker ? 32 : 0)}px 24px 32px` }}>
        {children}
      </main>

      {/* Blocking communication popup */}
      {blockingQueue.length > 0 && !ratingMsg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#18181b', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '20px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={16} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Communication</span>
                {blockingQueue.length > 1 && (
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontWeight: 700 }}>
                    {blockingQueue.length}
                  </span>
                )}
              </div>
              <button onClick={dismissBlockingPopup} style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                <XIcon size={18} />
              </button>
            </div>
            <div style={{ padding: '24px 20px', overflowY: 'auto' }}>
              {blockingQueue[0].title && (
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em' }}>{blockingQueue[0].title}</h3>
              )}
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {blockingQueue[0].message || blockingQueue[0].body}
              </p>
              {blockingQueue[0].created_at && (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '16px' }}>
                  {new Date(blockingQueue[0].created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <button onClick={dismissBlockingPopup} style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)', color: '#fbbf24', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,191,36,0.15)'}
              >
                J'ai lu, fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup notation SAV — non fermable */}
      {ratingMsg && (
        <RatingPopup onSubmit={(stars) => {
          Store.updateMessage(ratingMsg.id, { rating: stars, rating_at: new Date().toISOString() })
          setRatingMsg(null)
        }} />
      )}

      {/* Chatbot client */}
      <ClientChatBot />
    </div>
  )
}
