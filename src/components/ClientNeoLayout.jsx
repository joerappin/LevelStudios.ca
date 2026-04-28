import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, User, Headphones } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Store } from '../data/store'

const GOLD = '#F5C518'

const NAV = [
  { label: 'Accueil',        path: '/pathe/dashboard'    },
  { label: 'Réservations',   path: '/pathe/reservations' },
  { label: 'Médiathèque',    path: '/pathe/library'      },
  { label: 'Packs d\'heures', path: '/pathe/subscription' },
  { label: 'Factures',       path: '/pathe/invoices'     },
  { label: 'Contact',        path: '/pathe/contact'      },
]

export default function ClientNeoLayout({ children }) {
  const { user, logout, impersonatedBy } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [userMenu, setUserMenu] = useState(false)
  const userRef = useRef(null)

  const pendingCount = user
    ? Store.getReservations().filter(r => r.client_email === user.email && r.status === 'a_payer').length
    : 0

  useEffect(() => {
    const h = e => { if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { setUserMenu(false) }, [location.pathname])

  const doLogout = () => { logout(); navigate('/neo') }

  const topOffset = impersonatedBy ? 36 : 0

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F2', color: '#111' }}>

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: topOffset, left: 0, right: 0, zIndex: 99,
        height: 58,
        background: '#191919',
        display: 'flex', alignItems: 'center',
        padding: '0 4%', gap: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}>
        {/* Logo */}
        <div onClick={() => navigate('/pathe/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
          <img src="/logo.png" alt="Level" style={{ height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: '-0.01em' }}>Level Studios</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {NAV.map(({ label, path }) => {
            const active = location.pathname === path
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                padding: '5px 12px', borderRadius: 5, fontSize: 13,
                fontWeight: active ? 700 : 400,
                border: 'none', cursor: 'pointer',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.58)',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.58)' }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Bell */}
          <button onClick={() => navigate('/pathe/reservations')} style={{
            position: 'relative', width: 34, height: 34, borderRadius: 6,
            border: 'none', cursor: 'pointer', background: 'transparent',
            color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            <Bell size={17} />
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 7, height: 7, borderRadius: '50%',
                background: '#ff4444', border: '2px solid #191919',
              }} />
            )}
          </button>

          {/* User dropdown */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <button onClick={() => setUserMenu(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '4px 8px',
              borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                background: `linear-gradient(135deg, ${GOLD} 0%, #ff8c00 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 13, color: '#000',
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <ChevronDown size={12} style={{
                color: 'rgba(255,255,255,0.45)',
                transform: userMenu ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }} />
            </button>

            {userMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 200, borderRadius: 10, overflow: 'hidden',
                background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
              }}>
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{user?.email}</div>
                </div>
                {[
                  { icon: User,       label: 'Mon profil',  path: '/pathe/account'  },
                  { icon: Headphones, label: 'Contact SAV', path: '/pathe/contact'  },
                ].map(({ icon: Icon, label, path }) => (
                  <button key={label} onClick={() => { navigate(path); setUserMenu(false) }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', fontSize: 13, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: '#333', transition: 'background 0.15s', textAlign: 'left',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={13} style={{ color: GOLD, flexShrink: 0 }} />
                    {label}
                  </button>
                ))}
                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />
                <button onClick={doLogout} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', fontSize: 13, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: '#999', transition: 'all 0.15s', textAlign: 'left',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff1f1'; e.currentTarget.style.color = '#e53e3e' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#999' }}
                >
                  <LogOut size={13} style={{ flexShrink: 0 }} />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <main style={{ paddingTop: 58 + topOffset }}>
        {children}
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(0,0,0,0.08)',
        background: '#191919', color: 'rgba(255,255,255,0.35)',
        padding: '32px 5%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="Level" style={{ height: 22, objectFit: 'contain', filter: 'brightness(0) invert(0.4)' }} />
          <span style={{ fontSize: 12 }}>© {new Date().getFullYear()} Level Studios inc.</span>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 11 }}>
          {['Mentions légales', 'Confidentialité', 'CGV', 'Contact'].map(l => (
            <span key={l} style={{ cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >{l}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
