import React, { useState } from 'react'
import { FileText, Download, Search, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import ClientTestLayout from '../../components/ClientTestLayout'
import { Store } from '../../data/store'
import { formatDate, STATUS_CONFIG, getTierConfig } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useReservations } from '../../hooks/useReservations'

const ACCENT = '#00bcd4'
const PAID_STATUSES = ['validee', 'tournee', 'post-prod', 'livree']
const PER_PAGE = 8

function getPrice(r) {
  const p = Store.getPrices()
  const svc = (id, fb) => p.services.find(s => s.id === id)?.price ?? fb
  const opt = (id, fb) => p.options.find(o => o.id === id)?.price ?? fb
  const pph  = (r.service || '').toUpperCase().includes('GOLD') ? svc('GOLD', 587) : svc('ARGENT', 221)
  const base = (Number(r.duration) || 1) * pph
  const opts = r.options || {}
  const PRICES = {
    photo: opt('Photo',44), short: opt('Short',44), thumbnail: opt('Miniature',44),
    live: opt('Live',662), briefing: opt('BriefingLive',118), replay: opt('Replay',74),
    cm: opt('CommunityManager',147), coaching: opt('Coaching',588),
  }
  return base + Object.entries(opts).reduce((s,[k,v]) => v ? s + (PRICES[k]||0) : s, 0)
}

const STATUS_COLOR = {
  a_payer:    { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  validee:    { text: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  tournee:    { text: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  'post-prod':{ text: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  livree:     { text: ACCENT,    bg: 'rgba(0,188,212,0.12)'  },
  annulee:    { text: '#6b7280', bg: 'rgba(107,114,128,0.12)'},
}

function StarRating({ value, onChange, size = 18 }) {
  const [hov, setHov] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHov(n)}
          onMouseLeave={() => onChange && setHov(0)}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 0 }}
        >
          <Star size={size} fill={(hov||value)>=n ? '#f59e0b' : 'none'} style={{ color: '#f59e0b', transition: 'fill 0.1s' }} />
        </button>
      ))}
    </div>
  )
}

export default function ClientTestInvoices() {
  const { user } = useAuth()
  const { reservations } = useReservations({ clientEmail: user?.email })
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const [rating, setRating] = useState({})

  const payable = reservations.filter(r => r.status !== 'annulee')
    .sort((a, b) => b.date.localeCompare(a.date))

  const filtered = payable.filter(r =>
    !search ||
    r.studio?.toLowerCase().includes(search.toLowerCase()) ||
    String(r.id).includes(search)
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const totalPaid = payable
    .filter(r => PAID_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + getPrice(r), 0)

  const handleRate = (id, val) => {
    setRating(r => ({ ...r, [id]: val }))
    Store.updateReservation(id, { rating: val })
  }

  return (
    <ClientTestLayout title="Factures">
      <div style={{ padding: '88px 28px 40px' }}>

        {/* Summary */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28,
        }}>
          {[
            { label: 'Sessions facturées', value: payable.length,                          color: ACCENT    },
            { label: 'Sessions payées',     value: payable.filter(r => PAID_STATUSES.includes(r.status)).length, color: '#22c55e' },
            { label: 'Total dépensé',       value: `${totalPaid.toLocaleString('fr-CA')} $`, color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              borderRadius: 12, padding: '16px 18px',
              background: '#141414', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 280, marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher…"
            style={{
              width: '100%', borderRadius: 10, padding: '9px 12px 9px 34px',
              background: '#161616', border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = ACCENT}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>

        {/* Table */}
        {paged.length === 0 ? (
          <div style={{
            borderRadius: 16, padding: '48px 24px',
            background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.07)',
            textAlign: 'center',
          }}>
            <FileText size={32} style={{ color: 'rgba(255,255,255,0.12)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Aucune facture trouvée</p>
          </div>
        ) : (
          <div style={{
            borderRadius: 14, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 100px 110px 80px auto',
              padding: '10px 16px',
              background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {['Session', 'Date', 'Offre', 'Montant', 'Statut', 'Note'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {paged.map(r => {
              const sc = STATUS_CONFIG[r.status] || { label_fr: r.status }
              const sColor = STATUS_COLOR[r.status] || { text: '#aaa', bg: 'rgba(170,170,170,0.1)' }
              const tier = getTierConfig(r.service)
              const price = getPrice(r)
              const isRatable = PAID_STATUSES.includes(r.status) &&
                Date.now() >= new Date(new Date(r.date).getTime() + 86400000).getTime()
              const currentRating = rating[r.id] ?? r.rating ?? 0

              return (
                <div key={r.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 100px 110px 80px auto',
                  padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  alignItems: 'center', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>{r.studio}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>#{r.id}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{formatDate(r.date)}</div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                    background: tier.cls.includes('amber') ? 'rgba(245,158,11,0.12)' : 'rgba(148,163,184,0.1)',
                    color: tier.cls.includes('amber') ? '#f59e0b' : '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-block',
                  }}>
                    {tier.label}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e5e5' }}>
                    {price.toLocaleString('fr-CA')} $
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                    background: sColor.bg, color: sColor.text,
                    textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-block',
                  }}>
                    {sc.label_fr}
                  </span>
                  <div>
                    {isRatable ? (
                      <StarRating value={currentRating} onChange={v => handleRate(r.id, v)} size={14} />
                    ) : (
                      currentRating > 0 ? <StarRating value={currentRating} size={14} /> : (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>—</span>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{
              width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', cursor: page===1 ? 'not-allowed' : 'pointer',
              color: page===1 ? 'rgba(255,255,255,0.2)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_,i) => i+1).map(n => (
              <button key={n} onClick={() => setPage(n)} style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: page===n ? ACCENT : 'rgba(255,255,255,0.06)',
                color: page===n ? '#060606' : 'rgba(255,255,255,0.6)',
                fontWeight: page===n ? 700 : 400, fontSize: 12, transition: 'all 0.15s',
              }}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{
              width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', cursor: page===totalPages ? 'not-allowed' : 'pointer',
              color: page===totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </ClientTestLayout>
  )
}
