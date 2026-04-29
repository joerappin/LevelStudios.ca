import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Film, Package, FileText, Headphones, User,
  QrCode, ArrowRight, Plus, Clock, ChevronRight,
} from 'lucide-react'
import ClientNeoLayout from '../../components/ClientNeoLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'

const GOLD = '#F5C518'

const STATUS_LABEL = {
  a_payer:    'À payer',
  en_attente: 'En attente',
  validee:    'Confirmée',
  tournee:    'En tournage',
  'post-prod': 'Post-prod',
  livree:     'Livrée',
  annulee:    'Annulée',
}

const STATUS_COLOR = {
  a_payer:    '#f59e0b',
  en_attente: '#f59e0b',
  validee:    '#22c55e',
  tournee:    '#8b5cf6',
  'post-prod': '#3b82f6',
  livree:     '#22c55e',
  annulee:    '#6b7280',
}

function StatusBadge({ status }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 4,
      background: `${STATUS_COLOR[status] || '#888'}18`,
      color: STATUS_COLOR[status] || '#888',
      border: `1px solid ${STATUS_COLOR[status] || '#888'}30`,
    }}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function QuickIcon({ icon: Icon, label, path }) {
  const navigate = useNavigate()
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => navigate(path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: hov ? '#fff' : 'rgba(255,255,255,0.7)',
        border: `1.5px solid ${hov ? GOLD : 'rgba(0,0,0,0.08)'}`,
        borderRadius: 12, padding: '16px 12px', cursor: 'pointer',
        minWidth: 88, transition: 'all 0.18s',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: hov ? `rgba(245,197,24,0.15)` : '#f2f2f2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.18s',
      }}>
        <Icon size={20} style={{ color: hov ? GOLD : '#555' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: hov ? '#111' : '#555', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </button>
  )
}

export default function ClientNeoDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const reservations = Store.getReservations().filter(r => r.client_email === user?.email)
  const recent = reservations.slice(-5).reverse()
  const packs = Store.getHourPacks?.()?.filter(p => p.client_email === user?.email) || []
  const activePackHours = packs.reduce((s, p) => s + (p.remaining || 0), 0)
  const pendingCount = reservations.filter(r => r.status === 'a_payer').length

  const firstName = user?.name?.split(' ')[0] || user?.name || 'Client'
  const userId = user?.id || '—'

  const QUICK = [
    { icon: CalendarDays, label: 'Réservations',   path: '/espace-client/reservations' },
    { icon: Film,         label: 'Médiathèque',    path: '/espace-client/library'      },
    { icon: Package,      label: 'Packs d\'heures', path: '/espace-client/subscription' },
    { icon: FileText,     label: 'Factures',        path: '/espace-client/invoices'     },
    { icon: Headphones,   label: 'Contact',         path: '/espace-client/contact'      },
    { icon: User,         label: 'Mon profil',      path: '/espace-client/account'      },
  ]

  return (
    <ClientNeoLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 64px' }}>

        {/* Greeting */}
        <h1 style={{ fontSize: 34, fontWeight: 900, color: '#111', margin: '0 0 28px', letterSpacing: '-0.02em' }}>
          Bonjour <span style={{ color: GOLD }}>{firstName.toUpperCase()}</span>
        </h1>

        {/* Alert if pending payments */}
        {pendingCount > 0 && (
          <div style={{
            background: '#fff3cd', border: '1px solid #f59e0b', borderRadius: 10,
            padding: '14px 18px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Paiement en attente</div>
              <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>
                Vous avez {pendingCount} réservation{pendingCount > 1 ? 's' : ''} en attente de paiement.{' '}
                <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/espace-client/reservations')}>
                  Voir →
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Account card */}
        <div style={{
          background: '#191919', borderRadius: 14,
          padding: '28px 32px', marginBottom: 28,
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 24,
          alignItems: 'start',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 6 }}>
              MON COMPTE LEVEL STUDIOS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: activePackHours > 0 ? '#22c55e' : '#6b7280',
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: activePackHours > 0 ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
                {activePackHours > 0 ? `Pack actif — ${activePackHours}h restantes` : 'Aucun pack actif'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 8,
                background: `linear-gradient(135deg, ${GOLD} 0%, #ff8c00 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 18, color: '#000', flexShrink: 0,
              }}>
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>ID {userId}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/espace-client/subscription')} style={{
                padding: '9px 18px', borderRadius: 7, fontSize: 13, fontWeight: 700,
                background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
              }}>
                Mes packs
              </button>
              <button onClick={() => navigate('/espace-client/account')} style={{
                padding: '9px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
              }}>
                Mon profil
              </button>
            </div>
          </div>

          {/* Right side: discount / CTA */}
          <div style={{
            background: GOLD, borderRadius: 10, padding: '18px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minWidth: 140, textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#000', opacity: 0.6, letterSpacing: '0.08em', marginBottom: 8 }}>
              RÉSERVATION RAPIDE
            </div>
            <Clock size={28} style={{ color: '#000', marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#000', lineHeight: 1.3 }}>
              Réservez<br />votre prochain<br />studio
            </div>
            <button onClick={() => navigate('/reservation')} style={{
              marginTop: 12, padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 800,
              background: '#000', color: GOLD, border: 'none', cursor: 'pointer',
            }}>
              Réserver →
            </button>
          </div>
        </div>

        {/* Quick navigation icons */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 16 }}>Mes outils</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {QUICK.map(q => <QuickIcon key={q.label} {...q} />)}
          </div>
        </section>

        {/* Recent reservations */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Mes dernières sessions</div>
            <button onClick={() => navigate('/espace-client/reservations')} style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
              color: GOLD, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              Tout voir <ChevronRight size={13} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div style={{
              background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
              padding: '32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🎙</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 6 }}>Aucune session pour le moment</div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>Réservez votre premier studio Level.</div>
              <button onClick={() => navigate('/reservation')} style={{
                padding: '10px 22px', borderRadius: 7, fontSize: 13, fontWeight: 700,
                background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Plus size={14} /> Réserver un studio
              </button>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              {recent.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px',
                  borderBottom: i < recent.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => navigate('/espace-client/reservations')}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                    background: '#f5f5f5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Film size={18} style={{ color: '#999' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>
                      Studio {r.studio || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {r.date ? formatDate(r.date) : '—'} · {r.formula || 'Bronze'}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                  <ChevronRight size={14} style={{ color: '#ccc', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA reservation */}
        <div style={{
          background: '#191919', borderRadius: 12, padding: '28px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Prêt pour votre prochaine session ?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Studios disponibles dès maintenant à Montréal.</div>
          </div>
          <button onClick={() => navigate('/reservation')} style={{
            padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 800,
            background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}>
            Réserver un studio <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </ClientNeoLayout>
  )
}
