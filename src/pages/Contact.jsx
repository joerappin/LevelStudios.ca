import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'

// ── DESIGN.md tokens — dark only ─────────────────────────────────────────────
const D = {
  surface:     '#080808',
  surfaceLow:  '#111111',
  primary:     '#ff89ac',
  secondary:   '#ea73fb',
  tertiary:    '#88ebff',
  muted:       '#adaaaa',
  gradPrimary: 'linear-gradient(135deg, #ff89ac 0%, #ea73fb 100%)',
  gradFull:    'linear-gradient(135deg, #ff89ac 0%, #ea73fb 50%, #88ebff 100%)',
}

const border = 'rgba(255,255,255,0.06)'
const text   = '#f0eef8'

export default function Contact() {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [form, setForm]       = useState({ name: user?.name || '', email: user?.email || '', subject: '', message: '' })
  const [sent, setSent]       = useState(false)
  const [focused, setFocused] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    Store.addMessage({ from_email: form.email, from_name: form.name, subject: form.subject, body: form.message, type: 'contact' })
    Store.addLead({
      name:    form.name,
      email:   form.email,
      phone:   '',
      formula: null,
      subject: form.subject,
      message: `[VISITOR_INFO: ${form.name}|${form.email}|page contact] ${form.subject} — ${form.message.slice(0, 120)}`,
      source:  'contact',
      column:  'Pool Leads',
    })
    setSent(true)
  }

  const inputStyle = (name) => ({
    width: '100%',
    background: '#060606',
    border: 'none',
    borderBottom: `2px solid ${focused === name ? D.tertiary : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '0',
    color: text,
    fontSize: '14px',
    padding: '10px 4px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  })

  const infos = [
    { icon: Mail,   title: 'Email',     lines: ['contact@levelstudio.fr'],                              accent: D.primary,   glow: 'rgba(255,137,172,0.14)' },
    { icon: Phone,  title: 'Téléphone', lines: ['+1 514 123-4567', 'Lun–Ven 9h–18h'],                  accent: D.secondary, glow: 'rgba(234,115,251,0.14)' },
    { icon: MapPin, title: 'Adresse',   lines: ['123 Rue Saint-Laurent', 'Montréal, QC H2Y 1N7'],      accent: D.tertiary,  glow: 'rgba(136,235,255,0.14)' },
  ]

  const labelColor = (key) => {
    if (focused !== key) return D.muted
    const map = { name: D.primary, email: D.primary, subject: D.secondary, message: D.tertiary }
    return map[key] || D.tertiary
  }

  const focusBorder = (key) => {
    const map = { name: D.primary, email: D.primary, subject: D.secondary, message: D.tertiary }
    return focused === key ? map[key] : 'rgba(255,255,255,0.1)'
  }

  return (
    <div style={{ minHeight: '100vh', background: D.surface, color: text, fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        height: '64px', display: 'flex', alignItems: 'center',
        padding: '0 32px',
        background: 'rgba(8,8,8,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: D.muted, padding: '6px', borderRadius: '8px', transition: 'color 0.2s',
            display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => e.currentTarget.style.color = text}
            onMouseLeave={e => e.currentTarget.style.color = D.muted}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" style={{ width: '56px', height: '56px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} alt="Level Studios" />
            <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.01em', fontFamily: 'Montserrat, sans-serif', color: text }}>
              Level Studios
            </span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '72px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '64px' }}>
          <p style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: '16px', backgroundImage: D.gradFull,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', display: 'inline-block',
          }}>Contact</p>
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 16px',
            fontFamily: 'Montserrat, sans-serif', color: text,
          }}>Nous contacter</h1>
          <p style={{ fontSize: '1.05rem', color: D.muted, maxWidth: '480px', lineHeight: 1.7 }}>
            Une question, un projet, une idée ? Notre équipe vous répond rapidement.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '40px', alignItems: 'start' }}>

          {/* Info cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {infos.map(({ icon: Icon, title, lines, accent, glow }) => (
              <div key={title} style={{
                background: D.surfaceLow, borderRadius: '16px', padding: '20px 22px',
                display: 'flex', alignItems: 'flex-start', gap: '16px',
                boxShadow: `0 0 0 1px ${border}, 0 4px 24px ${glow}`,
              }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                  background: glow, border: `1px solid ${accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 16px ${glow}`,
                }}>
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '13px', margin: '0 0 6px', color: text }}>{title}</p>
                  {lines.map((l, i) => (
                    <p key={i} style={{ fontSize: '12px', margin: 0, color: i === 0 ? D.muted : 'rgba(173,170,170,0.5)', lineHeight: 1.6 }}>{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          {sent ? (
            <div style={{
              background: D.surfaceLow, borderRadius: '20px', padding: '60px 40px',
              textAlign: 'center', boxShadow: `0 0 0 1px ${border}`,
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(136,235,255,0.08)', border: `1px solid ${D.tertiary}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', boxShadow: `0 0 24px rgba(136,235,255,0.2)`,
              }}>
                <CheckCircle size={28} style={{ color: D.tertiary }} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px', fontFamily: 'Montserrat, sans-serif', color: text }}>Message envoyé !</h2>
              <p style={{ color: D.muted, fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
                Nous vous répondrons dans les plus brefs délais.
              </p>
              <button onClick={() => navigate('/')} style={{
                background: D.gradPrimary, color: '#fff', fontWeight: 700, fontSize: '13px',
                padding: '12px 28px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                boxShadow: `0 4px 20px rgba(255,137,172,0.35)`,
              }}>
                Retour à l'accueil
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              background: D.surfaceLow, borderRadius: '20px', padding: '40px',
              boxShadow: `0 0 0 1px ${border}`,
            }}>
              <div style={{ height: '3px', background: D.gradFull, borderRadius: '999px', marginBottom: '32px' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {[
                  { key: 'name', label: 'Nom complet', type: 'text' },
                  { key: 'email', label: 'Email', type: 'email' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: labelColor(key), marginBottom: '10px', transition: 'color 0.2s' }}>
                      {label}
                    </label>
                    <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required
                      style={{ ...inputStyle(key), borderBottomColor: focusBorder(key) }}
                      onFocus={() => setFocused(key)} onBlur={() => setFocused(null)}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: labelColor('subject'), marginBottom: '10px', transition: 'color 0.2s' }}>
                  Sujet
                </label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Demande d'information..." required
                  style={{ ...inputStyle('subject'), borderBottomColor: focusBorder('subject') }}
                  onFocus={() => setFocused('subject')} onBlur={() => setFocused(null)}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: labelColor('message'), marginBottom: '10px', transition: 'color 0.2s' }}>
                  Message
                </label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={5} placeholder="Votre message..." required
                  style={{ ...inputStyle('message'), borderBottomColor: focusBorder('message'), resize: 'none' }}
                  onFocus={() => setFocused('message')} onBlur={() => setFocused(null)}
                />
              </div>

              <button type="submit" style={{
                width: '100%', background: D.gradPrimary, color: '#fff',
                fontWeight: 700, fontSize: '14px', padding: '14px', borderRadius: '12px',
                border: 'none', cursor: 'pointer', letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: `0 4px 24px rgba(255,137,172,0.35)`, transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Send size={15} /> Envoyer le message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
