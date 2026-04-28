import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const GOLD = '#F5C518'

export default function ClientNeoLogin() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const result = login(loginForm.email, loginForm.password)
    setLoading(false)
    if (result.success) {
      navigate('/pathe/dashboard')
    } else {
      setError(result.error || 'Email ou mot de passe incorrect.')
    }
  }

  const handleRegister = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const result = register({ ...regForm, clientType: 'particulier' })
    setLoading(false)
    if (result.success) {
      navigate('/pathe/dashboard')
    } else {
      setError(result.error || 'Erreur lors de la création du compte.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F2F2F2',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '32px 16px',
    }}>

      {/* Logo */}
      <div onClick={() => navigate('/neo')} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, cursor: 'pointer' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: '#191919',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src="/logo.png" alt="Level" style={{ height: 26, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>
        <span style={{ fontWeight: 900, fontSize: 18, color: '#111', letterSpacing: '-0.02em' }}>Level Studios</span>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#fff', borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          {[
            { id: 'login', label: 'Connexion' },
            { id: 'register', label: 'Créer un compte' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => { setTab(id); setError('') }} style={{
              flex: 1, padding: '16px', fontSize: 14, fontWeight: 700,
              border: 'none', cursor: 'pointer', background: 'transparent',
              color: tab === id ? '#111' : '#aaa',
              borderBottom: tab === id ? `2px solid ${GOLD}` : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: '28px' }}>
          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                  <input
                    type="email" required
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="votre@email.com"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 12px 11px 36px', borderRadius: 8,
                      border: '1.5px solid rgba(0,0,0,0.1)', background: '#fafafa',
                      fontSize: 13, color: '#111', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                  <input
                    type={showPw ? 'text' : 'password'} required
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 40px 11px 36px', borderRadius: 8,
                      border: '1.5px solid rgba(0,0,0,0.1)', background: '#fafafa',
                      fontSize: 13, color: '#111', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0,
                  }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                  background: '#fff5f5', border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: 13, color: '#ef4444',
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 9, fontSize: 14, fontWeight: 800,
                background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
              }}>
                {loading ? 'Connexion...' : <>Se connecter <ArrowRight size={15} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                {[
                  { key: 'firstName', label: 'Prénom', ph: 'Jonathan' },
                  { key: 'lastName',  label: 'Nom',    ph: 'Dupont' },
                ].map(({ key, label, ph }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input
                      required value={regForm[key]}
                      onChange={e => setRegForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={ph}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '11px 12px', borderRadius: 8,
                        border: '1.5px solid rgba(0,0,0,0.1)', background: '#fafafa',
                        fontSize: 13, color: '#111', outline: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                  <input
                    type="email" required value={regForm.email}
                    onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="votre@email.com"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 12px 11px 36px', borderRadius: 8,
                      border: '1.5px solid rgba(0,0,0,0.1)', background: '#fafafa',
                      fontSize: 13, color: '#111', outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                  <input
                    type={showPw ? 'text' : 'password'} required value={regForm.password}
                    onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 40px 11px 36px', borderRadius: 8,
                      border: '1.5px solid rgba(0,0,0,0.1)', background: '#fafafa',
                      fontSize: 13, color: '#111', outline: 'none',
                    }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0,
                  }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                  background: '#fff5f5', border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: 13, color: '#ef4444',
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 9, fontSize: 14, fontWeight: 800,
                background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
              }}>
                {loading ? 'Création...' : <>Créer mon compte <ArrowRight size={15} /></>}
              </button>
            </form>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
        En continuant, vous acceptez les{' '}
        <span style={{ color: GOLD, cursor: 'pointer' }}>Conditions générales</span>{' '}
        et la{' '}
        <span style={{ color: GOLD, cursor: 'pointer' }}>Politique de confidentialité</span>
        {' '}de Level Studios.
      </div>

      <button onClick={() => navigate('/neo')} style={{
        marginTop: 16, fontSize: 13, color: '#888', background: 'none',
        border: 'none', cursor: 'pointer', textDecoration: 'underline',
      }}>
        ← Retour à l'accueil
      </button>
    </div>
  )
}
