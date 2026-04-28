import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Color identity per feature zone (path-based)
function tileColor(path = '') {
  if (path.includes('dashboard'))                    return { bg: 'rgba(136,235,255,0.13)', icon: '#88ebff', glow: '136,235,255' }
  if (path.includes('account'))                      return { bg: 'rgba(96,165,250,0.13)',  icon: '#60a5fa', glow: '96,165,250'  }
  if (path.includes('calendar'))                     return { bg: 'rgba(167,139,250,0.13)', icon: '#a78bfa', glow: '167,139,250' }
  if (path.includes('reservation'))                  return { bg: 'rgba(52,211,153,0.13)',  icon: '#34d399', glow: '52,211,153'  }
  if (path.includes('recette') || path.includes('invoic')) return { bg: 'rgba(52,211,153,0.13)', icon: '#34d399', glow: '52,211,153' }
  if (path.includes('project') || path.includes('kanban')) return { bg: 'rgba(251,191,36,0.13)',  icon: '#fbbf24', glow: '251,191,36'  }
  if (path.includes('rush') || path.includes('library') || path.includes('media')) return { bg: 'rgba(244,114,182,0.13)', icon: '#f472b6', glow: '244,114,182' }
  if (path.includes('alert'))                        return { bg: 'rgba(239,68,68,0.13)',   icon: '#ef4444', glow: '239,68,68'   }
  if (path.includes('messaging') || path.includes('message')) return { bg: 'rgba(96,165,250,0.13)',  icon: '#60a5fa', glow: '96,165,250' }
  if (path.includes('sav') || path.includes('contact') || path.includes('support')) return { bg: 'rgba(249,115,22,0.13)', icon: '#f97316', glow: '249,115,22' }
  if (path.includes('satisf') || path.includes('feedback')) return { bg: 'rgba(251,191,36,0.13)',  icon: '#fbbf24', glow: '251,191,36'  }
  if (path.includes('communic'))                     return { bg: 'rgba(244,114,182,0.13)', icon: '#f472b6', glow: '244,114,182' }
  if (path.includes('promo'))                        return { bg: 'rgba(167,139,250,0.13)', icon: '#a78bfa', glow: '167,139,250' }
  if (path.includes('pric'))                         return { bg: 'rgba(52,211,153,0.13)',  icon: '#34d399', glow: '52,211,153'  }
  if (path.includes('check'))                        return { bg: 'rgba(251,191,36,0.13)',  icon: '#fbbf24', glow: '251,191,36'  }
  if (path.includes('perf'))                         return { bg: 'rgba(139,92,246,0.13)',  icon: '#8b5cf6', glow: '139,92,246'  }
  if (path.includes('rh') || path.includes('boarding') || path.includes('leave')) return { bg: 'rgba(249,115,22,0.13)', icon: '#f97316', glow: '249,115,22' }
  if (path.includes('manual'))                       return { bg: 'rgba(96,165,250,0.13)',  icon: '#60a5fa', glow: '96,165,250'  }
  if (path.includes('tool'))                         return { bg: 'rgba(167,139,250,0.13)', icon: '#a78bfa', glow: '167,139,250' }
  if (path.includes('beta'))                         return { bg: 'rgba(52,211,153,0.13)',  icon: '#34d399', glow: '52,211,153'  }
  if (path.includes('version'))                      return { bg: 'rgba(136,235,255,0.13)', icon: '#88ebff', glow: '136,235,255' }
  if (path.includes('index') || path.includes('site')) return { bg: 'rgba(244,114,182,0.13)', icon: '#f472b6', glow: '244,114,182' }
  if (path.includes('subscript'))                    return { bg: 'rgba(52,211,153,0.13)',  icon: '#34d399', glow: '52,211,153'  }
  return                                               { bg: 'rgba(136,235,255,0.10)',  icon: '#88ebff', glow: '136,235,255' }
}

// Fallback labels (used when labelKey isn't translatable here)
const LABELS = {
  nav_dashboard:      'Dashboard',    nav_accounts:     'Comptes',
  nav_calendar:       'Calendrier',   nav_reservations: 'Réservations',
  nav_recette:        'Recette',      nav_projects:     'Projets',
  nav_rushes:         'Rushes',       nav_alerts:       'Alertes',
  nav_messaging:      'Messagerie',   nav_sav:          'SAV',
  nav_communication:  'Communication',nav_promo:        'Promos',
  nav_pricing:        'Tarifs',       nav_check:        'Pointage',
  nav_perf:           'Performances', nav_boarding:     'Congés',
  nav_manual:         'Manuel',       nav_tool:         'Outils',
  nav_beta:           'Beta',         nav_versions:     'Versions',
  nav_index:          'Index',        nav_perf:         'Performances',
  // Employee
  nav_emp_dashboard:  'Dashboard',    nav_emp_projects:   'Projets',
  nav_emp_messaging:  'Messages',     nav_emp_check:      'Pointage',
  nav_emp_calendar:   'Calendrier',   nav_emp_leave:      'Congés',
  // Client
  nav_cli_dashboard:  'Dashboard',    nav_cli_account:    'Mon compte',
  nav_cli_reservations:'Réservations',nav_cli_library:    'Médias',
  nav_cli_subscription:"Packs",       nav_cli_contact:    'Contact',
}

const GRAD_ACTIVE = 'linear-gradient(135deg, #88ebff 0%, #ea73fb 100%)'

export default function Dock({ navItems = [], isDark }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [hov, setHov] = useState(null)

  const items = navItems.filter(it => !it.separator && it.path && it.icon)
  if (!items.length) return null

  const glass = isDark
    ? { background: 'rgba(5,5,8,0.87)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 -1px 0 rgba(255,255,255,0.04) inset, 0 12px 48px rgba(0,0,0,0.75), 0 2px 8px rgba(0,0,0,0.5)' }
    : { background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.10)', boxShadow: '0 -1px 0 rgba(255,255,255,0.9) inset, 0 12px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)' }

  return (
    <>
      <style>{`
        @keyframes dock-up {
          from { opacity:0; transform:translateX(-50%) translateY(16px) }
          to   { opacity:1; transform:translateX(-50%) translateY(0) }
        }
        @keyframes tip-in {
          from { opacity:0; transform:translateX(-50%) translateY(4px) scale(0.94) }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1) }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '7px 9px',
        borderRadius: '18px',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        maxWidth: 'calc(100vw - 24px)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        animation: 'dock-up 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        ...glass,
      }}>
        {items.map((item, i) => {
          const active  = location.pathname === item.path
          const isHov   = hov === i
          const clr     = tileColor(item.path)
          const label   = item.labelKey ? (LABELS[item.labelKey] ?? item.labelKey) : (item.label ?? '')
          const tileBg  = active ? GRAD_ACTIVE : isHov ? clr.bg.replace('0.13)', '0.25)') : clr.bg
          const shadow  = active
            ? `0 4px 20px rgba(${clr.glow},0.55), inset 0 1px 0 rgba(255,255,255,0.22)`
            : isHov
              ? `0 6px 22px rgba(${clr.glow},0.45), inset 0 1px 0 rgba(255,255,255,0.12)`
              : isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)'

          return (
            <div key={i} style={{ position: 'relative', flexShrink: 0 }}>

              {/* Tooltip */}
              {isHov && label && (
                <div style={{
                  position: 'absolute',
                  bottom: '54px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  padding: '5px 11px',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  letterSpacing: '0.01em',
                  background: 'rgba(12,12,18,0.96)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  pointerEvents: 'none',
                  zIndex: 300,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
                  animation: 'tip-in 0.15s ease both',
                }}>
                  {label}
                  {/* Arrow */}
                  <span style={{
                    position: 'absolute', top: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'block', width: 0, height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid rgba(12,12,18,0.96)',
                  }} />
                </div>
              )}

              {/* Icon tile */}
              <button
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '11px',
                  border: active
                    ? `1.5px solid rgba(${clr.glow},0.4)`
                    : isHov
                      ? `1.5px solid rgba(${clr.glow},0.25)`
                      : `1.5px solid rgba(255,255,255,0.0)`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isHov ? 'scale(1.20) translateY(-5px)' : active ? 'scale(1.04)' : 'scale(1)',
                  background: tileBg,
                  color: active ? '#060606' : clr.icon,
                  boxShadow: shadow,
                  outline: 'none',
                  padding: 0,
                }}
              >
                {React.cloneElement(item.icon, {
                  className: undefined,
                  width: 18,
                  height: 18,
                  strokeWidth: active ? 2.2 : 1.8,
                })}
              </button>

              {/* Active dot */}
              {active && (
                <div style={{
                  position: 'absolute',
                  bottom: '-5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: clr.icon,
                  boxShadow: `0 0 7px rgba(${clr.glow},0.8)`,
                }} />
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
