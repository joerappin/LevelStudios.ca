import React, { useState } from 'react'
import { Headphones, Send, MessageSquare, Phone, Mail, Clock, CheckCircle } from 'lucide-react'
import ClientNeoLayout from '../../components/ClientNeoLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Store } from '../../data/store'

const GOLD = '#F5C518'

export default function ClientNeoContact() {
  const { user } = useAuth()
  const [form, setForm] = useState({ subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    Store.addMessage?.({
      from: user?.email,
      fromName: user?.name,
      subject: form.subject,
      body: form.message,
      date: new Date().toISOString(),
      type: 'sav',
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <ClientNeoLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Contact & SAV
          </h1>
          <div style={{ fontSize: 13, color: '#888' }}>Notre équipe répond sous 24h ouvrées</div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { icon: Phone,   label: 'Téléphone',   value: '+1 514 000 0000' },
            { icon: Mail,    label: 'Email',        value: 'contact@levelstudios.ca' },
            { icon: Clock,   label: 'Disponibilité', value: 'Lun–Ven · 9h–18h' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{
              background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
              padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: 'rgba(245,197,24,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} style={{ color: GOLD }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '0.06em', marginBottom: 2 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '32px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>Message envoyé !</div>
              <div style={{ fontSize: 14, color: '#777', lineHeight: 1.6, marginBottom: 24 }}>
                Notre équipe vous répondra dans les 24h ouvrées.<br />
                Un accusé de réception a été envoyé à {user?.email}.
              </div>
              <button onClick={() => { setSent(false); setForm({ subject: '', message: '' }) }} style={{
                padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
              }}>
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <MessageSquare size={18} style={{ color: GOLD }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Nouveau message</div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>
                  Sujet
                </label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1.5px solid rgba(0,0,0,0.1)', background: '#fafafa',
                    fontSize: 13, color: '#111', outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="">Sélectionner un sujet</option>
                  <option>Question sur ma réservation</option>
                  <option>Problème avec un fichier livré</option>
                  <option>Demande de facture</option>
                  <option>Demande de remboursement</option>
                  <option>Question sur les formules</option>
                  <option>Autre</option>
                </select>
              </div>

              {/* Message */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Décrivez votre demande en détail..."
                  rows={6}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '12px 14px', borderRadius: 8,
                    border: '1.5px solid rgba(0,0,0,0.1)', background: '#fafafa',
                    fontSize: 13, color: '#111', outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button type="submit" disabled={loading || !form.subject || !form.message} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 800,
                background: (!form.subject || !form.message) ? '#e0e0e0' : GOLD,
                color: (!form.subject || !form.message) ? '#aaa' : '#000',
                border: 'none', cursor: (!form.subject || !form.message) ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}>
                <Send size={15} />
                {loading ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>

      </div>
    </ClientNeoLayout>
  )
}
