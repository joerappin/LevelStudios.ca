import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Package, ArrowRight, Clock } from 'lucide-react'
import ClientNeoLayout from '../../components/ClientNeoLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Store } from '../../data/store'

const GOLD = '#F5C518'

const PLANS = [
  {
    id: 'BRONZE', label: 'Bronze', price: 149, accent: '#cd7f32',
    desc: 'Enregistrement clé en main, équipement inclus.',
    features: ['Opérateur dédié', '3 caméras Sony FX30 4K', '4 micros Shure SM7B', 'Livraison sous 24h', 'Sauvegarde 7 jours'],
    packs: [
      { h: '4h',  disc: '10%', total: 536,  per: 134 },
      { h: '10h', disc: '15%', total: 1270, per: 127 },
      { h: '20h', disc: '20%', total: 2380, per: 119 },
    ],
  },
  {
    id: 'ARGENT', label: 'Argent', price: 199, accent: '#A0A0A0', highlight: true,
    desc: 'Bronze + post-production complète incluse.',
    features: ['Tout du Bronze', 'Montage multicaméra', 'Synchro audio/vidéo', 'Suppression silences', 'Sauvegarde 14 jours'],
    packs: [
      { h: '4h',  disc: '10%', total: 716,  per: 179 },
      { h: '10h', disc: '15%', total: 1690, per: 169 },
      { h: '20h', disc: '20%', total: 3180, per: 159 },
    ],
  },
  {
    id: 'GOLD', label: 'Or', price: 499, accent: GOLD,
    desc: 'Premium avec motion design & sound design.',
    features: ['Tout de l\'Argent', 'Motion design', 'Sound design', '1 révision incluse', 'Sauvegarde 2 mois'],
    packs: [
      { h: '4h',  disc: '10%', total: 1796, per: 449 },
      { h: '10h', disc: '15%', total: 4240, per: 424 },
      { h: '20h', disc: '20%', total: 7980, per: 399 },
    ],
  },
]

export default function ClientNeoSubscription() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const packs = Store.getHourPacks?.()?.filter(p => p.client_email === user?.email) || []
  const activePacks = packs.filter(p => (p.remaining || 0) > 0)

  return (
    <ClientNeoLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Packs d'heures
          </h1>
          <div style={{ fontSize: 13, color: '#888' }}>Économisez jusqu'à 20% avec nos packs</div>
        </div>

        {/* Active packs */}
        {activePacks.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 14 }}>Mes packs actifs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activePacks.map(p => (
                <div key={p.id} style={{
                  background: '#fff', border: '1.5px solid rgba(245,197,24,0.3)', borderRadius: 10,
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 8,
                    background: 'rgba(245,197,24,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Package size={20} style={{ color: GOLD }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 3 }}>
                      Pack {p.formula || p.label || '—'} — {p.hours || '—'}h
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      Acheté le {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-CA') : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: GOLD }}>{p.remaining}h</div>
                    <div style={{ fontSize: 11, color: '#888' }}>restantes</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Plans */}
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 16 }}>Acheter un pack d'heures</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: '#fff',
              border: `1.5px solid ${plan.highlight ? plan.accent : 'rgba(0,0,0,0.08)'}`,
              borderRadius: 12, padding: '24px 20px',
              position: 'relative', overflow: 'hidden',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: plan.accent,
                }} />
              )}
              <div style={{ fontSize: 11, fontWeight: 800, color: plan.accent, letterSpacing: '0.1em', marginBottom: 8 }}>
                {plan.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#111', marginBottom: 4 }}>
                {plan.price}<span style={{ fontSize: 13, fontWeight: 400, color: '#999' }}>$ CAD/h</span>
              </div>
              <div style={{ fontSize: 12, color: '#777', marginBottom: 16, lineHeight: 1.5 }}>{plan.desc}</div>

              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <Check size={13} style={{ color: plan.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#444' }}>{f}</span>
                </div>
              ))}

              <div style={{ marginTop: 18, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 10 }}>PACKS DISPONIBLES</div>
                {plan.packs.map(pk => (
                  <button key={pk.h} style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 12px', marginBottom: 6, borderRadius: 7,
                    border: '1px solid rgba(0,0,0,0.08)', background: '#fafafa',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = `rgba(245,197,24,0.08)`; e.currentTarget.style.borderColor = 'rgba(245,197,24,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
                    onClick={() => navigate('/contact')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={13} style={{ color: plan.accent }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{pk.h}</span>
                      <span style={{ fontSize: 11, color: '#888' }}>{pk.per}$/h</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        background: `${plan.accent}15`, color: plan.accent,
                        padding: '2px 6px', borderRadius: 4,
                      }}>
                        -{pk.disc}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{pk.total}$</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA contact */}
        <div style={{
          background: '#191919', borderRadius: 12, padding: '28px 32px',
          display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Besoin d'un devis personnalisé ?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Notre équipe est disponible pour adapter une offre à vos besoins.</div>
          </div>
          <button onClick={() => navigate('/espace-client/contact')} style={{
            padding: '11px 22px', borderRadius: 8, fontSize: 13, fontWeight: 800,
            background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}>
            Nous contacter <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </ClientNeoLayout>
  )
}
