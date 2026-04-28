import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Film, Search, Filter } from 'lucide-react'
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

const FILTERS = ['Toutes', 'À payer', 'Confirmée', 'Livrée', 'Annulée']

const FILTER_MAP = {
  'Toutes': null,
  'À payer': ['a_payer', 'en_attente'],
  'Confirmée': ['validee', 'tournee', 'post-prod'],
  'Livrée': ['livree'],
  'Annulée': ['annulee'],
}

export default function ClientNeoReservations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('Toutes')
  const [search, setSearch] = useState('')

  const all = Store.getReservations()
    .filter(r => r.client_email === user?.email)
    .reverse()

  const filterStatuses = FILTER_MAP[activeFilter]
  const filtered = all.filter(r => {
    if (filterStatuses && !filterStatuses.includes(r.status)) return false
    if (search && !(`studio ${r.studio} ${r.formula} ${r.date}`).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <ClientNeoLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Mes réservations
            </h1>
            <div style={{ fontSize: 13, color: '#888' }}>{all.length} session{all.length > 1 ? 's' : ''} au total</div>
          </div>
          <button onClick={() => navigate('/reservation')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
          }}>
            <Plus size={15} /> Nouvelle réservation
          </button>
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px 9px 34px', borderRadius: 8,
                border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff',
                fontSize: 13, color: '#111', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${activeFilter === f ? GOLD : 'rgba(0,0,0,0.1)'}`,
                background: activeFilter === f ? `rgba(245,197,24,0.1)` : '#fff',
                color: activeFilter === f ? '#000' : '#666', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
            padding: '48px', textAlign: 'center',
          }}>
            <Film size={40} style={{ color: '#ccc', marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#555', marginBottom: 6 }}>Aucune réservation</div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>
              {activeFilter !== 'Toutes' ? 'Essayez un autre filtre.' : 'Réservez votre premier studio.'}
            </div>
            <button onClick={() => navigate('/reservation')} style={{
              padding: '10px 22px', borderRadius: 7, fontSize: 13, fontWeight: 700,
              background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
            }}>
              Réserver un studio
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {filtered.map((r, i) => (
              <div key={r.id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                alignItems: 'center', gap: 16, padding: '16px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                    background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Film size={18} style={{ color: '#aaa' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 3 }}>
                      Studio {r.studio || '—'} — {r.formula || 'Bronze'}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {r.date ? formatDate(r.date) : '—'}
                      {r.start_time ? ` · ${r.start_time}` : ''}
                      {r.duration ? ` · ${r.duration}h` : ''}
                    </div>
                    {r.total_price && (
                      <div style={{ fontSize: 12, color: '#555', fontWeight: 600, marginTop: 2 }}>
                        {r.total_price} CAD
                      </div>
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 5,
                  background: `${STATUS_COLOR[r.status] || '#888'}15`,
                  color: STATUS_COLOR[r.status] || '#888',
                  border: `1px solid ${STATUS_COLOR[r.status] || '#888'}25`,
                  whiteSpace: 'nowrap',
                }}>
                  {STATUS_LABEL[r.status] || r.status}
                </span>
                <ChevronRight size={14} style={{ color: '#ccc' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientNeoLayout>
  )
}
