import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Menu, X, Sun, Moon, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { translations } from '../i18n/translations'
import { cn } from '../utils'
import { Store } from '../data/store'
import AdminChatBot from './AdminChatBot'
import ClientChatBot from './ClientChatBot'

// ── DESIGN.md tokens ──────────────────────────────────────────────────────────
const D = {
  // Tertiary = couleur principale des éléments en dark mode
  tertiary:    '#88ebff',
  primary:     '#ff89ac',
  secondary:   '#ea73fb',
  muted:       '#adaaaa',
  gradFull:    'linear-gradient(135deg, #ff89ac 0%, #ea73fb 50%, #88ebff 100%)',
  gradActive:  'linear-gradient(135deg, #88ebff 0%, #ea73fb 100%)',
}

// ── Surface palette dark — noir profond ───────────────────────────────────────
const DARK = {
  page:    '#060606',   // fond page
  sidebar: '#080808',   // sidebar (légèrement plus clair)
  card:    '#0d0d0d',   // cartes / sections
  header:  'rgba(6,6,6,0.90)',
  divider: 'rgba(255,255,255,0.05)',
  hover:   'rgba(136,235,255,0.06)',
}

// ── Surface palette light ─────────────────────────────────────────────────────
const LIGHT = {
  page:    '#f4f4f8',
  sidebar: '#ffffff',
  card:    '#ffffff',
  header:  'rgba(255,255,255,0.92)',
  divider: 'rgba(0,0,0,0.06)',
  hover:   'rgba(136,235,255,0.08)',
}

export default function Layout({ children, navItems, title }) {
  const { user, logout, impersonatedBy, stopImpersonating } = useAuth()
  const { theme, lang, toggleTheme, toggleLang } = useApp()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [alertCounts, setAlertCounts]   = useState({ Retard: 0, Retour: 0, Urgent: 0 })
  const [adminChatOpen, setAdminChatOpen] = useState(false)
  const [adminChatUnread, setAdminChatUnread] = useState(0)

  useEffect(() => {
    if (user?.type !== 'admin' && user?.roleKey !== 'chef_projet') return
    const compute = () => {
      const alerts = Store.getAlerts().filter(a => a.status === 'sent')
      setAlertCounts({
        Retard: alerts.filter(a => a.type === 'Retard').length,
        Retour: alerts.filter(a => a.type === 'Retour').length,
        Urgent: alerts.filter(a => a.type === 'Urgent').length,
      })
    }
    compute()
    const id = setInterval(compute, 30000)
    return () => clearInterval(id)
  }, [user])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Cmd+Left (Mac) or Alt+Left (Win/Linux) → go back
      if ((e.metaKey || e.altKey) && e.key === 'ArrowLeft') {
        e.preventDefault()
        navigate(-1)
      }
      // Escape → notify pages to close their active modal/panel
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('app:escape'))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  const isDark   = theme === 'dark'
  const S        = isDark ? DARK : LIGHT
  const t        = (k) => translations[lang]?.[k] || k
  const handleLogout             = () => { logout(); navigate('/loginteamlevelprivate') }
  const handleStopImpersonating  = () => { stopImpersonating(); navigate('/admin/accounts') }

  const textPrimary  = isDark ? '#ffffff'  : '#0d0d1a'
  const textMuted    = isDark ? D.muted    : '#888'
  const navInactive  = isDark ? 'rgba(173,170,170,0.65)' : '#888'
  const navHoverText = isDark ? '#ffffff'  : D.tertiary

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: S.sidebar }}>

      {/* Logo row */}
      <div style={{
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px', flexShrink: 0,
        background: isDark ? DARK.page : 'rgba(136,235,255,0.03)',
        borderBottom: `1px solid ${S.divider}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <img src="/logo.png" style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0, filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }} alt="Level Studios" />
          <div style={{ lineHeight: 1.2, minWidth: 0 }}>
            <span style={{
              fontWeight: 800, fontSize: '13px', letterSpacing: '-0.01em', display: 'block',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: textPrimary, fontFamily: 'Montserrat, sans-serif',
            }}>Level Studios</span>
            {/* Badge rôle — tertiary */}
            <span style={{
              fontSize: '9px', fontWeight: 700, padding: '1px 7px', borderRadius: '4px',
              textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-block',
              background: `${D.tertiary}14`, color: D.tertiary, border: `1px solid ${D.tertiary}28`,
            }}>
              {user?.type === 'admin' ? 'Admin' : user?.type === 'employee' ? 'Employé' : 'Studio'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <button onClick={toggleTheme} style={{
            padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: navInactive, transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = D.tertiary}
            onMouseLeave={e => e.currentTarget.style.color = navInactive}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} style={{
            padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: navInactive,
          }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Accent line — dégradé complet */}
      <div style={{ height: '2px', background: D.gradFull, flexShrink: 0, opacity: 0.8 }} />

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item, i) => {
          if (item.separator) {
            return <div key={i} style={{ height: '1px', background: S.divider, margin: '6px 4px' }} />
          }
          const isActive = location.pathname === item.path
          return (
            <button key={i}
              onClick={() => { navigate(item.path); setSidebarOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '10px',
                fontSize: '13px', fontWeight: isActive ? 600 : 500,
                border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
                // Actif : dégradé tertiary → secondary (conserve le dégradé)
                background: isActive ? D.gradActive : 'transparent',
                color: isActive ? '#060606' : navInactive,
                boxShadow: isActive ? `0 2px 18px rgba(136,235,255,0.28)` : 'none',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = S.hover; e.currentTarget.style.color = navHoverText } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navInactive } }}
            >
              <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.labelKey ? t(item.labelKey) : item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '10px', padding: '1px 6px', borderRadius: '999px', fontWeight: 700,
                  background: isActive ? 'rgba(6,6,6,0.2)' : D.tertiary,
                  color: isActive ? '#060606' : '#060606',
                  minWidth: '18px', textAlign: 'center',
                }}>{item.badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: '10px 8px', flexShrink: 0,
        borderTop: `1px solid ${S.divider}`,
        display: 'flex', flexDirection: 'column', gap: '4px',
        background: isDark ? DARK.page : 'rgba(136,235,255,0.02)',
      }}>
        {/* Language */}
        <button onClick={toggleLang} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderRadius: '10px', fontSize: '13px',
          border: 'none', cursor: 'pointer', background: 'transparent', color: navInactive, transition: 'all 0.18s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = S.hover; e.currentTarget.style.color = navHoverText }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navInactive }}
        >
          <span>{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
          <span style={{ fontWeight: 500 }}>{lang === 'fr' ? 'Français' : 'English'}</span>
          <ChevronDown size={12} style={{ marginLeft: 'auto' }} />
        </button>

        {/* User card — fond noir profond + tertiary accent */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px',
          background: isDark ? '#050505' : `${D.tertiary}0a`,
          border: `1px solid ${D.tertiary}1e`,
        }}>
          {/* Avatar — dégradé tertiary → secondary — chat trigger for admin */}
          <div
            onClick={user?.type === 'admin' ? () => setAdminChatOpen(v => !v) : undefined}
            style={{
              width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
              background: D.gradActive,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 2px 12px rgba(136,235,255,0.28)`,
              position: 'relative',
              cursor: user?.type === 'admin' ? 'pointer' : 'default',
            }}>
            <span style={{ color: '#060606', fontSize: '12px', fontWeight: 900 }}>{user?.name?.charAt(0) || '?'}</span>
            {user?.type === 'admin' && adminChatUnread > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                width: '15px', height: '15px', borderRadius: '50%',
                background: '#e8175d', color: '#fff',
                fontSize: '9px', fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}>
                {adminChatUnread > 9 ? '9+' : adminChatUnread}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }}>{user?.name}</p>
            <p style={{ fontSize: '10px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textMuted }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} title={t('logout')} style={{
            padding: '4px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: textMuted, flexShrink: 0, transition: 'color 0.2s',
          }}
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
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 40, backdropFilter: 'blur(4px)' }}
          className="lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100%', width: '256px', zIndex: 50,
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: isDark ? `4px 0 32px rgba(0,0,0,0.6)` : '4px 0 24px rgba(0,0,0,0.08)',
      }} className={sidebarOpen ? '' : '-translate-x-full lg:translate-x-0'}>
        <SidebarContent />
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="lg:ml-64">
        {/* Glassmorphism header */}
        <header style={{
          height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: impersonatedBy ? '36px' : '0', zIndex: 30,
          background: S.header,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${S.divider}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)} style={{
              padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: navInactive,
            }}>
              <Menu size={20} />
            </button>
            <h1 style={{
              fontWeight: 800, fontSize: '17px', margin: 0,
              color: textPrimary, fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em',
            }}>{title}</h1>
          </div>
          {/* Badge global alertes — admin uniquement */}
          {user?.type === 'admin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {[
                { key: 'Retard',  label: 'Retard',  bg: 'rgba(234,179,8,0.15)',  color: '#fbbf24', border: 'rgba(234,179,8,0.3)' },
                { key: 'Retour',  label: 'Retour',  bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
                { key: 'Urgent',  label: 'Urgent',  bg: 'rgba(239,68,68,0.15)',  color: '#f87171', border: 'rgba(239,68,68,0.3)' },
              ].map(({ key, label, bg, color, border }) => (
                <button key={key} onClick={() => navigate('/admin/alerts')} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                  background: alertCounts[key] > 0 ? bg : 'transparent',
                  color: alertCounts[key] > 0 ? color : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${alertCounts[key] > 0 ? border : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <span style={{
                    minWidth: '16px', height: '16px', borderRadius: '50%', fontSize: '10px', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: alertCounts[key] > 0 ? color : 'transparent',
                    color: alertCounts[key] > 0 ? '#000' : 'inherit',
                  }}>{alertCounts[key]}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </header>


        <main style={{ flex: 1, padding: '24px', overflowX: 'hidden', color: textPrimary }}>
          {children}
        </main>
      </div>

      {user?.type === 'admin' && <AdminChatBot open={adminChatOpen} onClose={() => setAdminChatOpen(false)} onUnreadChange={setAdminChatUnread} />}
      {user?.type === 'client' && <ClientChatBot />}
    </div>
  )
}
