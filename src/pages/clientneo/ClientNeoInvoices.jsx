import React, { useState } from 'react'
import { FileText, Download, Search, Receipt } from 'lucide-react'
import ClientNeoLayout from '../../components/ClientNeoLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'

const GOLD = '#F5C518'

export default function ClientNeoInvoices() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const reservations = Store.getReservations().filter(
    r => r.client_email === user?.email && r.total_price
  ).reverse()

  const filtered = reservations.filter(r =>
    search ? (`studio ${r.studio} ${r.date} ${r.formula}`).toLowerCase().includes(search.toLowerCase()) : true
  )

  const total = reservations.reduce((s, r) => s + (parseFloat(r.total_price) || 0), 0)

  return (
    <ClientNeoLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Factures
            </h1>
            <div style={{ fontSize: 13, color: '#888' }}>Historique de vos transactions</div>
          </div>
          {total > 0 && (
            <div style={{
              background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
              padding: '12px 20px', textAlign: 'right',
            }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Total dépensé</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{total.toFixed(2)} CAD</div>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une facture..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px 9px 34px', borderRadius: 8,
              border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff',
              fontSize: 13, color: '#111', outline: 'none',
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
            padding: '64px 32px', textAlign: 'center',
          }}>
            <Receipt size={44} style={{ color: '#ccc', marginBottom: 16 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#555', marginBottom: 8 }}>Aucune facture</div>
            <div style={{ fontSize: 13, color: '#999' }}>Vos factures apparaîtront ici après chaque session.</div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {filtered.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '15px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 8,
                  background: 'rgba(245,197,24,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FileText size={18} style={{ color: GOLD }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 3 }}>
                    Facture #{r.id} — Studio {r.studio}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {r.date ? formatDate(r.date) : '—'} · {r.formula || 'Bronze'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 2 }}>
                    {parseFloat(r.total_price || 0).toFixed(2)} CAD
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: r.status === 'livree' ? '#22c55e15' : '#f59e0b15',
                    color: r.status === 'livree' ? '#22c55e' : '#f59e0b',
                    border: `1px solid ${r.status === 'livree' ? '#22c55e25' : '#f59e0b25'}`,
                    padding: '2px 7px', borderRadius: 4,
                  }}>
                    {r.status === 'livree' ? 'PAYÉE' : 'EN ATTENTE'}
                  </span>
                </div>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: '#f5f5f5', color: '#555', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = GOLD }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
                >
                  <Download size={12} /> PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientNeoLayout>
  )
}
