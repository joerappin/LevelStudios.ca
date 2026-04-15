import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ACCENT = '#00bcd4'
const GRAD   = 'linear-gradient(135deg, #00bcd4 0%, #ea73fb 50%, #ff89ac 100%)'

export default function ClientTestLogin() {
  const { login, user, loading: authLoading } = useAuth()
  const navigate  = useNavigate()
  const [id, setId]           = useState('')
  const [pw, setPw]           = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated as clienttest
  useEffect(() => {
    if (!authLoading && user?.type === 'clienttest') {
      navigate('/clienttest/dashboard', { replace: true })
    }
  }, [authLoading, user]) // eslint-disable-line

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(id.trim(), pw)
    setLoading(false)
    if (!result.success || result.user.type !== 'clienttest') {
      setError('Identifiant ou mot de passe incorrect.')
      return
    }
    navigate('/clienttest/dashboard', { replace: true })
  }

  if (authLoading) return null

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a', padding: '0 16px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow behind card */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,188,212,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400, borderRadius: 20, padding: '40px 36px',
        background: '#111111', border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <img
            src="/logo.png" alt="Level Studios"
            style={{ width: 48, height: 48, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'Montserrat, sans-serif' }}>
              Level Studios
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.9 }}>
              Espace Client
            </div>
          </div>
        </div>

        {/* Gradient rule */}
        <div style={{ height: 2, background: GRAD, borderRadius: 1, margin: '20px 0 24px', opacity: 0.7 }} />

        <h1 style={{
          color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 6px',
          fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em',
        }}>
          Connexion
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>
          Interface de démonstration client
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Identifier */}
          <div>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 700,
              color: 'rgba(255,255,255,0.4)', marginBottom: 7,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Email
            </label>
            <input
              type="email"
              value={id}
              onChange={e => setId(e.target.value)}
              required
              autoComplete="email"
              placeholder="clienttest@gmail.com"
              style={{
                width: '100%', borderRadius: 12, padding: '12px 14px',
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                color: '#fff', fontSize: 14, outline: 'none',
                transition: 'border-color 0.15s', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 700,
              color: 'rgba(255,255,255,0.4)', marginBottom: 7,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%', borderRadius: 12, padding: '12px 42px 12px 14px',
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  color: '#fff', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.15s', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', padding: 0,
              }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              borderRadius: 12, padding: '10px 14px', fontSize: 12,
              background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6b6b',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: ACCENT, color: '#060606', fontSize: 14, fontWeight: 700,
              boxShadow: `0 4px 20px rgba(0,188,212,0.3)`,
              transition: 'all 0.15s', marginTop: 4, opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0097a7' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = ACCENT }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.12)', position: 'relative', zIndex: 1 }}>
        © 2025 Level Studios Inc. · Montréal, QC
      </p>
    </div>
  )
}
