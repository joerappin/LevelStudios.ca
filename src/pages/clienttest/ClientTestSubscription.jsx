import React, { useState, useEffect } from 'react'
import { Check, Package, Zap, Star, Clock } from 'lucide-react'
import ClientTestLayout from '../../components/ClientTestLayout'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'

const ACCENT = '#00bcd4'

function buildPacks() {
  const p = Store.getPrices()
  const a = p.services.find(s => s.id === 'ARGENT')?.price ?? 221
  const g = p.services.find(s => s.id === 'GOLD')?.price ?? 587
  const round = v => Math.round(v)
  return {
    ARGENT: [
      { hours: 1,  pricePerHour: a,             total: a,              discount: null },
      { hours: 4,  pricePerHour: round(a*0.9),  total: round(a*0.9)*4,  discount: 10  },
      { hours: 10, pricePerHour: round(a*0.85), total: round(a*0.85)*10, discount: 15, popular: true },
      { hours: 20, pricePerHour: round(a*0.8),  total: round(a*0.8)*20,  discount: 20  },
    ],
    GOLD: [
      { hours: 1,  pricePerHour: g,             total: g,              discount: null },
      { hours: 4,  pricePerHour: round(g*0.9),  total: round(g*0.9)*4,  discount: 10  },
      { hours: 10, pricePerHour: round(g*0.85), total: round(g*0.85)*10, discount: 15, popular: true },
      { hours: 20, pricePerHour: round(g*0.8),  total: round(g*0.8)*20,  discount: 20  },
    ],
  }
}

const ARGENT_FEATURES = [
  'Studio podcast entièrement équipé',
  '3 caméras Sony FX30 (4K)',
  "Jusqu'à 4 micros Shure SM7B",
  'Éclairage Godox SL300III',
  'Opérateur dédié',
  'Pré-montage + synchro audio/vidéo',
  'Export WAV qualité studio',
  'Livraison sous 24h',
]

const GOLD_FEATURES = [
  'Tout de l\'offre Argent',
  'Accompagnement renforcé',
  'Personnalisation avancée',
  'Priorité sur les créneaux',
  'Suivi de projet dédié',
]

export default function ClientTestSubscription() {
  const { user } = useAuth()
  const [packs, setPacks]     = useState([])
  const [tier, setTier]       = useState('ARGENT')
  const [bought, setBought]   = useState(null)
  const { ARGENT, GOLD }      = buildPacks()
  const tiers                  = tier === 'ARGENT' ? ARGENT : GOLD

  useEffect(() => {
    if (!user) return
    setPacks(Store.getHourPacks().filter(p => p.client_email === user.email && p.hours_used < p.hours_total))
  }, [user, bought])

  const handleBuy = pack => {
    Store.addHourPack({
      client_email: user.email,
      client_name:  user.name,
      hours_total:  pack.hours,
      hours_used:   0,
      service:      tier,
      price_total:  pack.total,
      created_at:   new Date().toISOString(),
    })
    setBought(pack.hours)
    setTimeout(() => setBought(null), 3000)
  }

  return (
    <ClientTestLayout title="Packs d'heures">
      <div style={{ padding: '88px 28px 40px' }}>

        {/* Active packs */}
        {packs.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e5e5e5', marginBottom: 14 }}>
              Vos packs actifs
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {packs.map(p => {
                const pct = Math.min(100, Math.round((p.hours_used / p.hours_total) * 100))
                const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : ACCENT
                return (
                  <div key={p.id} style={{
                    borderRadius: 14, padding: 18,
                    background: 'rgba(0,188,212,0.06)',
                    border: '1px solid rgba(0,188,212,0.15)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Pack {p.hours_total}h</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                          {p.service || 'ARGENT'}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>
                        {p.hours_total - p.hours_used}h rest.
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                      {p.hours_used}h / {p.hours_total}h utilisées
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: barColor, transition: 'width 0.3s' }} />
                    </div>
                    {p.created_at && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
                        Acheté le {formatDate(p.created_at)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Success toast */}
        {bought && (
          <div style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 200,
            borderRadius: 14, padding: '14px 20px',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <Check size={16} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
              Pack {bought}h ajouté avec succès !
            </span>
          </div>
        )}

        {/* Tier toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {['ARGENT', 'GOLD'].map(t => (
            <button key={t}
              onClick={() => setTier(t)}
              style={{
                padding: '9px 22px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
                background: tier === t
                  ? t === 'GOLD' ? 'rgba(245,158,11,0.15)' : 'rgba(0,188,212,0.15)'
                  : 'rgba(255,255,255,0.06)',
                color: tier === t
                  ? t === 'GOLD' ? '#f59e0b' : ACCENT
                  : 'rgba(255,255,255,0.45)',
                border: tier === t
                  ? `1px solid ${t === 'GOLD' ? 'rgba(245,158,11,0.3)' : 'rgba(0,188,212,0.3)'}`
                  : '1px solid transparent',
              }}
            >
              {t === 'GOLD' ? '★ Offre Gold' : '⬡ Offre Argent'}
            </button>
          ))}
        </div>

        {/* Features + packs side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Features card */}
          <div style={{
            borderRadius: 16, padding: '22px',
            background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
            }}>
              {tier === 'GOLD'
                ? <Star size={16} style={{ color: '#f59e0b' }} />
                : <Zap size={16}  style={{ color: ACCENT }} />
              }
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e5e5' }}>
                Offre {tier === 'GOLD' ? 'Gold' : 'Argent'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(tier === 'GOLD' ? GOLD_FEATURES : ARGENT_FEATURES).map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Check size={12} style={{
                    color: tier === 'GOLD' ? '#f59e0b' : ACCENT, flexShrink: 0, marginTop: 2,
                  }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pack cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {tiers.map(pack => (
              <div key={pack.hours} style={{
                borderRadius: 16, padding: '22px',
                background: pack.popular ? 'rgba(0,188,212,0.06)' : '#141414',
                border: pack.popular
                  ? '1px solid rgba(0,188,212,0.2)'
                  : '1px solid rgba(255,255,255,0.06)',
                position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {pack.popular && (
                  <div style={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    background: ACCENT, color: '#060606', fontSize: 9, fontWeight: 800,
                    padding: '3px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                  }}>
                    Le plus populaire
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: tier === 'GOLD' ? 'rgba(245,158,11,0.12)' : 'rgba(0,188,212,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Clock size={14} style={{ color: tier === 'GOLD' ? '#f59e0b' : ACCENT }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e5e5' }}>{pack.hours}h</span>
                  {pack.discount && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
                      background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                      textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: 'auto',
                    }}>
                      -{pack.discount}%
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {pack.total}$
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    {pack.pricePerHour}$ / h
                  </div>
                </div>
                <button onClick={() => handleBuy(pack)} style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: pack.popular
                    ? ACCENT
                    : 'rgba(255,255,255,0.08)',
                  color: pack.popular ? '#060606' : '#fff',
                  fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                  boxShadow: pack.popular ? `0 4px 16px rgba(0,188,212,0.3)` : 'none',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = pack.popular ? '#0097a7' : 'rgba(255,255,255,0.14)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = pack.popular ? ACCENT : 'rgba(255,255,255,0.08)' }}
                >
                  Choisir ce pack
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClientTestLayout>
  )
}
