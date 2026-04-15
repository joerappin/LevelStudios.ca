import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play, Plus, ChevronRight, ChevronLeft,
  CalendarDays, Clock, Package, Layers, Info,
} from 'lucide-react'
import ClientTestLayout from '../../components/ClientTestLayout'
import { Store } from '../../data/store'
import { useAuth } from '../../contexts/AuthContext'
import { useReservations } from '../../hooks/useReservations'
import { formatDate, STATUS_CONFIG } from '../../utils'

const ACCENT = '#00bcd4'

// Cinematic gradients per studio — Netflix poster style
const STUDIO_BG = {
  Cambridge: ['#071828', '#0d3b5e', '#1a5276'],
  Nook:      ['#1a0a2a', '#3d1a5e', '#6b21a8'],
  Loft:      ['#071f10', '#0d4a25', '#166534'],
  Rooftop:   ['#1f1507', '#4a3010', '#78350f'],
}
const DEFAULT_BG = ['#071828', '#0d3b5e', '#1a5276']

function studioBg(studio) {
  const c = STUDIO_BG[studio] || DEFAULT_BG
  return `linear-gradient(135deg, ${c[0]} 0%, ${c[1]} 50%, ${c[2]} 100%)`
}

const STATUS_COLOR = {
  a_payer:    '#f59e0b',
  en_attente: '#f59e0b',
  validee:    '#22c55e',
  tournee:    '#8b5cf6',
  'post-prod':'#3b82f6',
  livree:     ACCENT,
  annulee:    '#6b7280',
}

// ── Horizontal scroll row ─────────────────────────────────────────────────────
function Row({ title, children, isEmpty, emptyMsg, seeAllPath }) {
  const navigate = useNavigate()
  const ref = useRef(null)
  const scroll = dir => ref.current?.scrollBy({ left: dir * 520, behavior: 'smooth' })

  return (
    <section style={{ marginBottom: 32 }}>
      {/* Row header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 4%', marginBottom: 10,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e5e5e5', margin: 0 }}>
          {title}
        </h2>
        {seeAllPath && !isEmpty && (
          <button onClick={() => navigate(seeAllPath)} style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontWeight: 600, color: ACCENT,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            opacity: 0, transition: 'opacity 0.2s',
          }}
            className="see-all-btn"
          >
            Tout voir <ChevronRight size={13} />
          </button>
        )}
        {!isEmpty && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {[-1, 1].map(dir => (
              <button key={dir} onClick={() => scroll(dir)} style={{
                width: 26, height: 26, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              >
                {dir < 0 ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {isEmpty ? (
        <div style={{ padding: '0 4%' }}>
          <div style={{
            borderRadius: 8, padding: '28px',
            background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.07)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{emptyMsg}</p>
          </div>
        </div>
      ) : (
        <div ref={ref} style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          padding: '0 4% 8px', scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {children}
        </div>
      )}
    </section>
  )
}

// ── Reservation card — Netflix thumbnail style ────────────────────────────────
function ResCard({ r, onClick }) {
  const [hover, setHover] = useState(false)
  const sc    = STATUS_CONFIG[r.status] || { label_fr: r.status }
  const color = STATUS_COLOR[r.status] || '#aaa'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 240, flexShrink: 0, borderRadius: 6, overflow: 'hidden',
        background: studioBg(r.studio), cursor: 'pointer', position: 'relative',
        transition: 'transform 0.25s, box-shadow 0.25s, z-index 0s',
        transform: hover ? 'scale(1.08)' : 'scale(1)',
        boxShadow: hover ? '0 14px 40px rgba(0,0,0,0.8)' : '0 2px 8px rgba(0,0,0,0.4)',
        zIndex: hover ? 10 : 1,
        aspectRatio: '16/9',
      }}
    >
      {/* Subtle grid texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      {/* Bottom gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, padding: '10px 12px',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        {/* Status badge */}
        <span style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 999,
          background: `${color}22`, color, border: `1px solid ${color}40`,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {sc.label_fr}
        </span>

        <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 3, lineHeight: 1.2 }}>
          {r.studio}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 8 }}>
          <span>{formatDate(r.date)}</span>
          {r.start_time && <span>{r.start_time}</span>}
        </div>
      </div>

      {/* Hover overlay — extra info */}
      {hover && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <button style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={14} fill="#141414" style={{ color: '#141414', marginLeft: 2 }} />
          </button>
          <button style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.6)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={14} style={{ color: '#fff' }} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Project card ──────────────────────────────────────────────────────────────
function ProjCard({ p }) {
  const [hover, setHover] = useState(false)
  const barColor =
    p.status === 'Done'         ? '#22c55e' :
    p.status === 'In Progress'  ? '#8b5cf6' :
    p.status === 'Todo'         ? '#f59e0b' : ACCENT

  const gradMap = {
    Done:         'linear-gradient(135deg, #052e16 0%, #14532d 100%)',
    'In Progress':'linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%)',
    Todo:         'linear-gradient(135deg, #1c1003 0%, #451a03 100%)',
    Booking:      'linear-gradient(135deg, #071828 0%, #0d3b5e 100%)',
    Annulé:       'linear-gradient(135deg, #1c0000 0%, #450a0a 100%)',
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 240, flexShrink: 0, borderRadius: 6, overflow: 'hidden',
        background: gradMap[p.status] || gradMap.Booking, cursor: 'default',
        transition: 'transform 0.25s, box-shadow 0.25s',
        transform: hover ? 'scale(1.08)' : 'scale(1)',
        boxShadow: hover ? '0 14px 40px rgba(0,0,0,0.8)' : '0 2px 8px rgba(0,0,0,0.4)',
        zIndex: hover ? 10 : 1, position: 'relative',
        aspectRatio: '16/9',
      }}
    >
      {/* Top color bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: barColor }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, padding: '10px 12px',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        <span style={{
          position: 'absolute', top: 12, left: 12,
          fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 999,
          background: `${barColor}22`, color: barColor,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {p.status}
        </span>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', lineHeight: 1.3, marginBottom: 2 }}>
          {p.title}
        </div>
        {p.date && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{formatDate(p.date)}</div>
        )}
      </div>
    </div>
  )
}

// ── Pack card ─────────────────────────────────────────────────────────────────
function PackCard({ p }) {
  const [hover, setHover] = useState(false)
  const pct = Math.min(100, Math.round((p.hours_used / p.hours_total) * 100))
  const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : ACCENT

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 240, flexShrink: 0, borderRadius: 6, overflow: 'hidden',
        background: 'linear-gradient(135deg, #061520 0%, #0a2a3d 50%, #0d1f30 100%)',
        transition: 'transform 0.25s, box-shadow 0.25s',
        transform: hover ? 'scale(1.08)' : 'scale(1)',
        boxShadow: hover ? '0 14px 40px rgba(0,0,0,0.8)' : '0 2px 8px rgba(0,0,0,0.4)',
        zIndex: hover ? 10 : 1, position: 'relative',
        aspectRatio: '16/9',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${ACCENT}, #ea73fb)` }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        padding: '14px 14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Package size={18} style={{ color: ACCENT, opacity: 0.8 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT }}>
            {p.hours_total - p.hours_used}h rest.
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 2 }}>
            Pack {p.hours_total}h
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            {p.hours_used}h / {p.hours_total}h utilisées
          </div>
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: barColor }} />
          </div>
        </div>
      </div>
    </div>
  )
}

const SLIDES = [
  '/studios/studio-a.jpg',
  '/studios/studio-b.jpg',
  '/studios/studio-c.png',
]

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function ClientTestDashboard() {
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const { reservations } = useReservations({ clientEmail: user?.email })
  const [projects, setProjects] = useState([])
  const [packs, setPacks]       = useState([])
  const [slide, setSlide]       = useState(0)

  const firstName = user?.name?.split(' ')[0] || 'vous'

  useEffect(() => {
    if (!user) return
    setProjects(Store.getProjects().filter(p => p.client_email === user.email && p.status !== 'Annulé'))
    setPacks(Store.getHourPacks().filter(p => p.client_email === user.email && p.hours_used < p.hours_total))
  }, [user])

  // Auto-advance slideshow every 6 s
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const prevSlide = () => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)
  const nextSlide = () => setSlide(s => (s + 1) % SLIDES.length)

  const today    = new Date().toISOString().split('T')[0]
  const upcoming = reservations
    .filter(r => r.date >= today && r.status !== 'annulee')
    .sort((a, b) => a.date.localeCompare(b.date))
  const next = upcoming[0]
  const past = reservations
    .filter(r => r.date < today || r.status === 'annulee')
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <ClientTestLayout transparent>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', width: '100%',
        minHeight: '80vh', overflow: 'hidden',
        background: '#030d1a',
        display: 'flex', alignItems: 'flex-end',
      }}>
        {/* Slideshow images — crossfade */}
        {SLIDES.map((src, i) => (
          <div key={src} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === slide ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
          }} />
        ))}

        {/* Dark overlay over images */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.2) 100%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
          background: 'linear-gradient(to top, #141414 0%, transparent 100%)',
        }} />

        {/* Left / Right arrows */}
        {[{ dir: -1, fn: prevSlide, side: 'left' }, { dir: 1, fn: nextSlide, side: 'right' }].map(({ fn, side }) => (
          <button key={side} onClick={fn} style={{
            position: 'absolute', top: '50%', [side]: 20, transform: 'translateY(-50%)',
            zIndex: 5, width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.18)',
            cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
          >
            {side === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        ))}

        {/* Slide dots */}
        <div style={{
          position: 'absolute', bottom: 90, right: '4%', zIndex: 5,
          display: 'flex', gap: 6,
        }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 20 : 7, height: 7, borderRadius: 999,
              background: i === slide ? ACCENT : 'rgba(255,255,255,0.4)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          padding: '0 4% 80px',
          maxWidth: 640,
        }}>
          {next ? (
            <>
              <div style={{
                fontSize: 10, fontWeight: 800, color: ACCENT, textTransform: 'uppercase',
                letterSpacing: '0.16em', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: ACCENT,
                  display: 'inline-block', boxShadow: `0 0 0 4px rgba(0,188,212,0.18)`,
                }} />
                Prochaine session
              </div>

              <h1 style={{
                fontSize: 'clamp(36px, 6vw, 64px)',
                fontWeight: 900, color: '#fff', margin: '0 0 16px',
                fontFamily: 'Montserrat, sans-serif',
                letterSpacing: '-0.02em', lineHeight: 1.05,
                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              }}>
                {next.studio}
              </h1>

              <div style={{
                display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 8,
              }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CalendarDays size={13} style={{ color: ACCENT }} />
                  {formatDate(next.date)}
                </span>
                {next.start_time && (
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} style={{ color: ACCENT }} />
                    {next.start_time}{next.end_time ? ` – ${next.end_time}` : ''}
                  </span>
                )}
                {next.service && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
                    background: next.service?.toUpperCase().includes('GOLD') ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.12)',
                    color: next.service?.toUpperCase().includes('GOLD') ? '#f59e0b' : '#94a3b8',
                    border: `1px solid ${next.service?.toUpperCase().includes('GOLD') ? 'rgba(245,158,11,0.3)' : 'rgba(148,163,184,0.2)'}`,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {next.service?.toUpperCase().includes('GOLD') ? '★ Gold' : 'Argent'}
                  </span>
                )}
              </div>

              {next.client_notes && (
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '8px 0 20px', maxWidth: 480, lineHeight: 1.6 }}>
                  {next.client_notes}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/clienttest/reservations')} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: '#fff', color: '#141414', fontSize: 15, fontWeight: 800,
                  transition: 'background 0.15s',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.85)'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <Play size={16} fill="#141414" /> Voir les détails
                </button>
                <button onClick={() => navigate('/reservation')} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 6, cursor: 'pointer',
                  background: 'rgba(109,109,110,0.7)', color: '#fff', fontSize: 15, fontWeight: 700,
                  border: 'none', transition: 'background 0.15s',
                  backdropFilter: 'blur(4px)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,109,110,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(109,109,110,0.7)'}
                >
                  <Info size={16} /> Plus d'infos
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 style={{
                fontSize: 'clamp(32px, 5.5vw, 60px)',
                fontWeight: 900, color: '#fff', margin: '0 0 16px',
                fontFamily: 'Montserrat, sans-serif',
                letterSpacing: '-0.02em', lineHeight: 1.1,
              }}>
                Bienvenue chez<br />
                <span style={{
                  background: `linear-gradient(90deg, ${ACCENT} 0%, #ea73fb 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Level Studios,
                </span>
                <br />
                <span style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                  {firstName}&nbsp;!
                </span>
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', margin: '0 0 28px', maxWidth: 500, lineHeight: 1.7 }}>
                Studios entièrement équipés, livraison sous 24h, service de post-production professionnel.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/reservation')} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: '#fff', color: '#141414', fontSize: 15, fontWeight: 800, transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.85)'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <Play size={16} fill="#141414" /> Réserver un studio
                </button>
                <button onClick={() => navigate('/clienttest/subscription')} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 6, cursor: 'pointer',
                  background: 'rgba(109,109,110,0.7)', color: '#fff', fontSize: 15, fontWeight: 700,
                  border: 'none', backdropFilter: 'blur(4px)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,109,110,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(109,109,110,0.7)'}
                >
                  <Info size={16} /> Voir les packs
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── CONTENT ROWS ──────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 24, paddingBottom: 60 }}>

        <Row
          title="Prochaines sessions"
          isEmpty={upcoming.length === 0}
          emptyMsg="Aucune session à venir — réservez votre studio !"
          seeAllPath="/clienttest/reservations"
        >
          {upcoming.map(r => (
            <ResCard key={r.id} r={r} onClick={() => navigate('/clienttest/reservations')} />
          ))}
        </Row>

        {past.length > 0 && (
          <Row title="Sessions passées" isEmpty={false} seeAllPath="/clienttest/reservations">
            {past.map(r => (
              <ResCard key={r.id} r={r} onClick={() => navigate('/clienttest/reservations')} />
            ))}
          </Row>
        )}

        <Row
          title="Projets actifs"
          isEmpty={projects.length === 0}
          emptyMsg="Vos projets apparaîtront après votre première session."
        >
          {projects.map(p => <ProjCard key={p.id} p={p} />)}
        </Row>

        {packs.length > 0 && (
          <Row title="Vos packs d'heures" isEmpty={false} seeAllPath="/clienttest/subscription">
            {packs.map(p => <PackCard key={p.id} p={p} />)}
          </Row>
        )}

        {reservations.length === 0 && (
          <Row title="Recommandé pour vous" isEmpty={false}>
            {[
              { studio: 'Cambridge', date: '—', status: 'validee', service: 'Argent' },
              { studio: 'Nook',      date: '—', status: 'validee', service: 'Gold'   },
              { studio: 'Loft',      date: '—', status: 'validee', service: 'Argent' },
              { studio: 'Rooftop',   date: '—', status: 'validee', service: 'Gold'   },
            ].map((r, i) => (
              <div key={i} onClick={() => navigate('/reservation')} style={{
                width: 240, flexShrink: 0, borderRadius: 6, overflow: 'hidden',
                background: studioBg(r.studio), cursor: 'pointer', position: 'relative',
                aspectRatio: '16/9',
                transition: 'transform 0.25s', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,0.8)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)' }}
              >
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2 }}>Studio {r.studio}</div>
                  <div style={{ fontSize: 10, color: ACCENT }}>Disponible à la réservation</div>
                </div>
              </div>
            ))}
          </Row>
        )}
      </div>
    </ClientTestLayout>
  )
}
