import React, { useState } from 'react'
import { Film, Download, Search, FolderOpen } from 'lucide-react'
import ClientNeoLayout from '../../components/ClientNeoLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'

const GOLD = '#F5C518'

export default function ClientNeoLibrary() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const reservations = Store.getReservations().filter(
    r => r.client_email === user?.email && r.status === 'livree'
  )

  const filtered = reservations.filter(r =>
    search ? (`studio ${r.studio} ${r.date} ${r.formula}`).toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <ClientNeoLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Médiathèque
          </h1>
          <div style={{ fontSize: 13, color: '#888' }}>Vos fichiers livrés — audio, vidéo, exports</div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une session..."
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
            <FolderOpen size={44} style={{ color: '#ccc', marginBottom: 16 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#555', marginBottom: 8 }}>
              {search ? 'Aucun fichier trouvé' : 'Votre médiathèque est vide'}
            </div>
            <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>
              Les fichiers de vos sessions livrées apparaîtront ici.<br />
              Délai de livraison : 24h après votre session.
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {filtered.map((r, i) => {
              const files = [
                { type: 'Vidéo brute', ext: 'MP4', size: '2.3 GB' },
                { type: 'Audio WAV', ext: 'WAV', size: '450 MB' },
              ]
              return (
                <div key={r.id} style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                }}>
                  {/* Session header */}
                  <div style={{
                    padding: '14px 20px 10px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#fafafa',
                  }}>
                    <Film size={16} style={{ color: GOLD, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                        Studio {r.studio} — {r.formula || 'Bronze'}
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {r.date ? formatDate(r.date) : '—'} · Livraison confirmée
                      </div>
                    </div>
                    <span style={{
                      marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                      background: '#22c55e15', color: '#22c55e',
                      border: '1px solid #22c55e25', borderRadius: 4,
                      padding: '2px 8px',
                    }}>
                      LIVRÉ
                    </span>
                  </div>
                  {/* Files */}
                  <div style={{ padding: '10px 20px 14px' }}>
                    {files.map(f => (
                      <div key={f.type} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                        background: '#f8f8f8', border: '1px solid rgba(0,0,0,0.06)',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f8f8f8'}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: f.ext === 'MP4' ? 'rgba(139,92,246,0.12)' : 'rgba(34,197,94,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{
                            fontSize: 9, fontWeight: 800,
                            color: f.ext === 'MP4' ? '#8b5cf6' : '#22c55e',
                          }}>{f.ext}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{f.type}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>{f.size}</div>
                        </div>
                        <button style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
                        }}>
                          <Download size={11} /> Télécharger
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ClientNeoLayout>
  )
}
