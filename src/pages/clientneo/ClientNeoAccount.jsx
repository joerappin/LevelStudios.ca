import React, { useState } from 'react'
import { User, Mail, Phone, Building, Save, CheckCircle, Lock } from 'lucide-react'
import ClientNeoLayout from '../../components/ClientNeoLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Store } from '../../data/store'

const GOLD = '#F5C518'

function Field({ label, icon: Icon, value, onChange, type = 'text', readOnly }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }} />}
        <input
          type={type}
          value={value}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: `10px 14px 10px ${Icon ? '38px' : '14px'}`,
            borderRadius: 8, fontSize: 13, color: readOnly ? '#aaa' : '#111',
            border: '1.5px solid rgba(0,0,0,0.1)',
            background: readOnly ? '#f5f5f5' : '#fff',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  )
}

export default function ClientNeoAccount() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
  })
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('profile')

  const handleSave = () => {
    Store.updateAccount?.(user?.id, form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const firstName = user?.name?.split(' ')[0] || 'Client'

  return (
    <ClientNeoLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: `linear-gradient(135deg, ${GOLD} 0%, #ff8c00 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 28, color: '#000', flexShrink: 0,
          }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {user?.name}
            </h1>
            <div style={{ fontSize: 13, color: '#888' }}>{user?.email}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>ID {user?.id || '—'}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f0f0f0', borderRadius: 10, padding: 4 }}>
          {[
            { id: 'profile', label: 'Profil', icon: User },
            { id: 'security', label: 'Sécurité', icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '9px 0', borderRadius: 7, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: tab === id ? '#fff' : 'transparent',
              color: tab === id ? '#111' : '#888',
              boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '28px 28px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 20 }}>Informations personnelles</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <Field label="Nom complet" icon={User} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="Email" icon={Mail} value={form.email} readOnly />
              <Field label="Téléphone" icon={Phone} value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Field label="Entreprise" icon={Building} value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} />
            </div>

            {saved && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                background: '#f0fdf4', border: '1px solid #22c55e30', borderRadius: 8,
                padding: '10px 16px',
              }}>
                <CheckCircle size={14} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>Modifications enregistrées</span>
              </div>
            )}

            <button onClick={handleSave} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 8, fontSize: 13, fontWeight: 800,
              background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
            }}>
              <Save size={14} /> Enregistrer les modifications
            </button>
          </div>
        )}

        {tab === 'security' && (
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '28px 28px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 20 }}>Sécurité du compte</div>
            <Field label="Nouveau mot de passe" icon={Lock} value="" type="password" onChange={() => {}} />
            <Field label="Confirmer le mot de passe" icon={Lock} value="" type="password" onChange={() => {}} />
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 8, fontSize: 13, fontWeight: 800,
              background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
            }}>
              <Save size={14} /> Mettre à jour le mot de passe
            </button>

            <div style={{
              marginTop: 28, padding: '18px', borderRadius: 10,
              background: '#fff5f5', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>Zone de danger</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
                La suppression de votre compte est définitive et irréversible.
              </div>
              <button style={{
                padding: '8px 18px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                background: 'transparent', color: '#ef4444',
                border: '1.5px solid rgba(239,68,68,0.3)', cursor: 'pointer',
              }}>
                Supprimer mon compte
              </button>
            </div>
          </div>
        )}
      </div>
    </ClientNeoLayout>
  )
}
