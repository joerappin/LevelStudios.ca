import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bell, ChevronDown, LogOut, User,
  Home, CalendarDays, Film, Package, FileText, Headphones,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Store } from '../data/store'

const ACCENT = '#00bcd4'

const NAV = [
  { label: 'Accueil',        path: '/clienttest/dashboard'    },
  { label: 'Réservations',   path: '/clienttest/reservations' },
  { label: 'Médiathèque',    path: '/clienttest/library'      },
  { label: "Packs d'heures", path: '/clienttest/subscription' },
  { label: 'Factures',       path: '/clienttest/invoices'     },
  { label: 'Contact',        path: '/clienttest/contact'      },
]

export default function ClientTestLayout({ children, transparent = false }) {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [scrolled, setScrolled]   = useState(false)
  const [userMenu, setUserMenu]   = useState(false)
  const [mobileMenu, setMobile]   = useState(false) // eslint-disable-line
  const userRef = useRef(null)

  const pendingCount = user
    ? Store.getReservations().filter(r => r.client_email === user.email && r.status === 'a_payer').length
    : 0

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

  // Close mobile menu on route change
  useEffect(() => { setMobile(false) }, [location.pathname])

  const doLogout = () => { logout(); navigate('/clienttest') }

  const navBg = transparent && !scrolled
    ? 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)'
    : '#141414'

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: '#e5e5e5' }}>

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 68,
        background: navBg,
        transition: 'background 0.4s',
        display: 'flex', alignItems: 'center',
        padding: '0 4%',
        gap: 28,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/clienttest/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
        >
          <img
            src="/logo.png" alt="Level"
            style={{ height: 36, width: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
          <span style={{
            fontWeight: 900, fontSize: 16, color: '#fff',
            fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em',
          }}>
            Level Studios
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {NAV.map(({ label, path }) => {
            const active = location.pathname === path
            return (
              <button key={path}
                onClick={() => navigate(path)}
                style={{
                  padding: '6px 12px', borderRadius: 6,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  border: 'none', cursor: 'pointer', background: 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

          {/* Bell */}
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
              <span style={{
                position: 'absolute', top: 5, right: 5,
                width: 7, height: 7, borderRadius: '50%',
                background: '#ff4444', border: '2px solid #141414',
              }} />
            )}
          </button>

          {/* Avatar / user dropdown */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <button onClick={() => setUserMenu(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
              borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                background: `linear-gradient(135deg, ${ACCENT} 0%, #ea73fb 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 13, color: '#060606',
              }}>
                {user?.name?.charAt(0) || 'C'}
              </div>
              <ChevronDown size={13} style={{
                color: 'rgba(255,255,255,0.5)',
                transform: userMenu ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }} />
            </button>

            {/* Dropdown */}
            {userMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 200, borderRadius: 10, overflow: 'hidden',
                background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
              }}>
                {/* User header */}
                <div style={{
                  padding: '14px 16px 10px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                    {user?.name || 'Client Test'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {user?.email}
                  </div>
                </div>

                {[
                  { icon: User,       label: 'Mon profil',   path: '/clienttest/account'  },
                  { icon: Headphones, label: 'Contact SAV',  path: '/clienttest/contact'  },
                ].map(({ icon: Icon, label, path }) => (
                  <button key={label}
                    onClick={() => { navigate(path); setUserMenu(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 16px', fontSize: 13, fontWeight: 400,
                      border: 'none', cursor: 'pointer', background: 'transparent',
                      color: 'rgba(255,255,255,0.75)', transition: 'background 0.15s', textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={14} style={{ color: ACCENT, flexShrink: 0 }} />
                    {label}
                  </button>
                ))}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <button onClick={doLogout} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px', fontSize: 13, fontWeight: 400,
                  border: 'none', cursor: 'pointer', background: 'transparent',
                  color: 'rgba(255,255,255,0.5)', transition: 'background 0.15s', textAlign: 'left',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.08)'; e.currentTarget.style.color = '#ff6b6b' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                >
                  <LogOut size={14} style={{ flexShrink: 0 }} />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* ── MOBILE MENU ──────────────────────────────────────────────────── */}
      {mobileMenu && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0, zIndex: 99,
          background: '#141414', borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 0',
        }}>
          {NAV.map(({ label, path }) => (
            <button key={path}
              onClick={() => navigate(path)}
              style={{
                width: '100%', padding: '12px 24px', border: 'none', cursor: 'pointer',
                background: location.pathname === path ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: location.pathname === path ? '#fff' : 'rgba(255,255,255,0.7)',
                fontSize: 14, fontWeight: location.pathname === path ? 600 : 400,
                textAlign: 'left', transition: 'background 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <main>
        {children}
      </main>
    </div>
  )
}
