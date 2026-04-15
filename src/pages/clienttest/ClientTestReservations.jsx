import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CalendarDays, Clock, Film, ChevronLeft, ChevronRight, X } from 'lucide-react'
import ClientTestLayout from '../../components/ClientTestLayout'
import { Store } from '../../data/store'
import { formatDate, STATUS_CONFIG } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useReservations } from '../../hooks/useReservations'

const ACCENT = '#00bcd4'

const STATUS_COLOR = {
  a_payer:    { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  en_attente: { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  validee:    { text: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  tournee:    { text: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  'post-prod':{ text: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  livree:     { text: ACCENT,    bg: 'rgba(0,188,212,0.12)'  },
  annulee:    { text: '#6b7280', bg: 'rgba(107,114,128,0.12)'},
}

const STUDIO_GRAD = {
  Cambridge: 'linear-gradient(135deg, #071b2e 0%, #0d2d4d 100%)',
  Nook:      'linear-gradient(135deg, #1a0a2e 0%, #2d1a4d 100%)',
  Loft:      'linear-gradient(135deg, #071f14 0%, #0d3525 100%)',
  Rooftop:   'linear-gradient(135deg, #1f1a07 0%, #3d350d 100%)',
}

const FILTERS = ['Toutes', 'À venir', 'Passées', 'À payer']

const PER_PAGE = 9

export default function ClientTestReservations() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const { reservations, reload } = useReservations({ clientEmail: user?.email })

  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('Toutes')
  const [page,    setPage]    = useState(1)
  const [cancelId, setCancelId] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const filtered = reservations.filter(r => {
    const matchSearch = !search ||
      r.studio?.toLowerCase().includes(search.toLowerCase()) ||
      String(r.id).includes(search)
    const matchFilter =
      filter === 'Toutes'  ? true :
      filter === 'À venir' ? r.date >= today && r.status !== 'annulee' :
      filter === 'Passées' ? r.date < today || r.status === 'annulee' :
      filter === 'À payer' ? r.status === 'a_payer' : true
    return matchSearch && matchFilter
  }).sort((a, b) => b.date.localeCompare(a.date))

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleCancel = id => {
    Store.updateReservation(id, { status: 'annulee' })
    reload()
    setCancelId(null)
  }

  const handlePay = id => {
    Store.updateReservation(id, { status: 'validee', paid_at: new Date().toISOString() })
    reload()
  }

  return (
    <ClientTestLayout title="Réservations">
      <div style={{ padding: '88px 28px 40px' }}>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher par studio ou ID…"
              style={{
                width: '100%', borderRadius: 10, padding: '9px 12px 9px 34px',
                background: '#161616', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f}
                onClick={() => { setFilter(f); setPage(1) }}
                style={{
                  padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: filter === f ? ACCENT : 'rgba(255,255,255,0.06)',
                  color: filter === f ? '#060606' : 'rgba(255,255,255,0.55)',
                  boxShadow: filter === f ? `0 4px 16px rgba(0,188,212,0.3)` : 'none',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
          {filtered.length} réservation{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {paged.length === 0 ? (
          <div style={{
            borderRadius: 16, padding: '48px 24px',
            background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.07)',
            textAlign: 'center',
          }}>
            <Film size={32} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              Aucune réservation trouvée
            </p>
            <button onClick={() => navigate('/reservation')} style={{
              marginTop: 16, padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: ACCENT, color: '#060606', fontSize: 13, fontWeight: 700,
            }}>
              Réserver un studio
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {paged.map(r => {
              const sc = STATUS_CONFIG[r.status] || { label_fr: r.status }
              const sColor = STATUS_COLOR[r.status] || { text: '#aaa', bg: 'rgba(170,170,170,0.1)' }
              const grad = STUDIO_GRAD[r.studio] || STUDIO_GRAD.Cambridge
              return (
                <div key={r.id} style={{
                  borderRadius: 14, overflow: 'hidden',
                  background: '#181818', border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Visual header */}
                  <div style={{ height: 100, background: grad, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                        background: sColor.bg, color: sColor.text,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        border: `1px solid ${sColor.text}30`,
                      }}>
                        {sc.label_fr}
                      </span>
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 10, left: 12,
                      fontSize: 9, color: 'rgba(255,255,255,0.4)',
                    }}>
                      #{r.id}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#e5e5e5', marginBottom: 8 }}>
                      {r.studio || 'Studio'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CalendarDays size={11} style={{ color: ACCENT, flexShrink: 0 }} />
                        {formatDate(r.date)}
                      </div>
                      {r.start_time && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={11} style={{ color: ACCENT, flexShrink: 0 }} />
                          {r.start_time}{r.end_time ? ` – ${r.end_time}` : ''}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.status === 'a_payer' && (
                        <button onClick={() => handlePay(r.id)} style={{
                          flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: ACCENT, color: '#060606', fontSize: 12, fontWeight: 700,
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#0097a7'}
                          onMouseLeave={e => e.currentTarget.style.background = ACCENT}
                        >
                          Payer
                        </button>
                      )}
                      {['a_payer', 'en_attente', 'validee'].includes(r.status) && (
                        <button onClick={() => setCancelId(r.id)} style={{
                          flex: r.status === 'a_payer' ? '0 0 auto' : 1,
                          padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, fontWeight: 600,
                          border: '1px solid rgba(239,68,68,0.2)', transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
              width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer',
              color: page === 1 ? 'rgba(255,255,255,0.2)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: page === n ? ACCENT : 'rgba(255,255,255,0.06)',
                color: page === n ? '#060606' : 'rgba(255,255,255,0.6)',
                fontWeight: page === n ? 700 : 400, fontSize: 13, transition: 'all 0.15s',
              }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
              width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              color: page === totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{
            background: '#181818', borderRadius: 18, padding: 28, maxWidth: 380, width: '100%',
            border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>Annuler la réservation</h3>
              <button onClick={() => setCancelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 20px' }}>
              Cette action est irréversible. Confirmez-vous l'annulation ?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCancelId(null)} style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none',
              }}>
                Retour
              </button>
              <button onClick={() => handleCancel(cancelId)} style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 13, fontWeight: 700,
                border: '1px solid rgba(239,68,68,0.25)',
              }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientTestLayout>
  )
}
