import React, { useState } from 'react'
import { User, Mail, Shield, Hash, Edit2, Check } from 'lucide-react'
import ClientTestLayout from '../../components/ClientTestLayout'
import { useAuth } from '../../contexts/AuthContext'

const ACCENT = '#00bcd4'
const GRAD   = 'linear-gradient(135deg, #00bcd4 0%, #ea73fb 50%, #ff89ac 100%)'

export default function ClientTestAccount() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  const fields = [
    { icon: User,   label: 'Nom complet',   value: user?.name  || '—' },
    { icon: Mail,   label: 'Identifiant',   value: user?.email || '—' },
    { icon: Shield, label: 'Type de compte',value: 'Client Test'       },
    { icon: Hash,   label: 'ID',            value: user?.id    || '—' },
  ]

  return (
    <ClientTestLayout title="Mon profil">
      <div style={{ padding: '88px 28px 40px', maxWidth: 560 }}>

        {/* Avatar card */}
        <div style={{
          borderRadius: 20, padding: '32px',
          background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, flexShrink: 0,
            background: GRAD,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 24px rgba(0,188,212,0.3)`,
            fontSize: 28, fontWeight: 900, color: '#060606',
          }}>
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Montserrat, sans-serif', marginBottom: 4 }}>
              {user?.name || 'Client Test'}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: ACCENT, textTransform: 'uppercase',
              letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 999,
              background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.2)',
            }}>
              Compte Test
            </div>
          </div>
        </div>

        {/* Info fields */}
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 20,
        }}>
          {fields.map(({ icon: Icon, label, value }, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px',
              borderBottom: i < fields.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: 'rgba(0,188,212,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={14} style={{ color: ACCENT }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e5e5' }}>
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info notice */}
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'rgba(0,188,212,0.05)', border: '1px solid rgba(0,188,212,0.1)',
          fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6,
        }}>
          Ceci est un compte de démonstration — les données sont enregistrées localement pour vos tests.
        </div>
      </div>
    </ClientTestLayout>
  )
}
