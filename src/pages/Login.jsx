import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronDown, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const SAVED_EMAILS_KEY = 'ls_electron_saved_emails'
const isElectron = () => typeof window !== 'undefined' && window.electronApp?.isElectron === true

function getSavedEmails() {
  try { return JSON.parse(localStorage.getItem(SAVED_EMAILS_KEY) || '[]') } catch { return [] }
}
function saveEmail(email) {
  const list = getSavedEmails().filter(e => e !== email)
  localStorage.setItem(SAVED_EMAILS_KEY, JSON.stringify([email, ...list].slice(0, 10)))
}
function removeEmail(email) {
  localStorage.setItem(SAVED_EMAILS_KEY, JSON.stringify(getSavedEmails().filter(e => e !== email)))
}

function dashboardFor(user) {
  if (user.type === 'admin') return '/admin/dashboard'
  if (user.type === 'employee') {
    return user.roleKey === 'chef_projet' ? '/chef/dashboard' : '/employee/dashboard'
  }
  if (user.type === 'client') return '/client/dashboard'
  if (user.type === 'freelance') return '/freelance/dashboard'
  if (user.type === 'clienttest') return '/clienttest/dashboard'
  return null
}

export default function Login() {
  const { login, logout, user, loading: authLoading } = useAuth()
  const navigate    = useNavigate()
  const passwordRef = useRef(null)
  const emailRef    = useRef(null)
  const dropdownRef = useRef(null)

  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [error, setError]             = useState('')
  const [savedEmails, setSavedEmails] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [typingNew, setTypingNew]     = useState(false) // "Autre compte" selected

  const electron = isElectron()

  useEffect(() => {
    if (electron) setSavedEmails(getSavedEmails())
  }, [electron])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => { if (!dropdownRef.current?.contains(e.target)) setDropdownOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (window.parent !== window) return // loaded in editor iframe — don't redirect
    const dest = dashboardFor(user)
    if (dest) navigate(dest, { replace: true })
  }, [authLoading, user]) // eslint-disable-line

  const selectSavedEmail = (e) => {
    setEmail(e)
    setTypingNew(false)
    setDropdownOpen(false)
    setTimeout(() => passwordRef.current?.focus(), 50)
  }

  const handleRemoveEmail = (ev, emailToRemove) => {
    ev.stopPropagation()
    removeEmail(emailToRemove)
    const updated = getSavedEmails()
    setSavedEmails(updated)
    if (email === emailToRemove) { setEmail(''); setTypingNew(true) }
  }

  const handleOtherAccount = () => {
    setEmail('')
    setTypingNew(true)
    setDropdownOpen(false)
    setTimeout(() => emailRef.current?.focus(), 50)
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setError('')

    const result = await login(email, password)

    if (!result.success) {
      setError('Identifiant ou mot de passe incorrect.')
      return
    }

    if (result.user.type === 'client') {
      logout()
      setError('Cet espace est réservé aux équipes Level Studios.')
      return
    }

    if (electron) saveEmail(email)

    const dest = dashboardFor(result.user)
    if (dest) navigate(dest, { replace: true })
  }

  if (authLoading) return null

  // Show dropdown when in Electron, there are saved emails, and not in "type new" mode
  const showDropdown = electron && savedEmails.length > 0 && !typingNew

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#060606' }}
    >

      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="Level Studios"
            style={{ width: 72, height: 72, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span className="text-white font-bold text-lg tracking-tight">Level Studios</span>
        </div>

        <h1 className="text-white text-2xl font-bold mb-1">Espace équipe</h1>
        <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Connexion réservée aux administrateurs et employés.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Identifier field ── */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Identifiant
            </label>

            {showDropdown ? (
              /* Saved accounts dropdown */
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setDropdownOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#171717', borderRadius: '12px', padding: '12px 16px',
                    cursor: 'pointer', border: `1px solid ${dropdownOpen ? '#00BCD4' : '#252525'}`,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: '14px', color: email ? '#fff' : '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email || 'Sélectionner un compte…'}
                  </span>
                  <ChevronDown size={14} style={{ color: '#555', flexShrink: 0, marginLeft: '8px', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </div>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                    background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px',
                    overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}>
                    {savedEmails.map(e => (
                      <div key={e} onClick={() => selectSavedEmail(e)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', cursor: 'pointer' }}
                        onMouseEnter={el => el.currentTarget.style.background = '#242424'}
                        onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '13px', color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e}</span>
                        <button type="button" onClick={(ev) => handleRemoveEmail(ev, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '2px', marginLeft: '8px', flexShrink: 0 }}
                          onMouseEnter={el => el.currentTarget.style.color = '#e8175d'}
                          onMouseLeave={el => el.currentTarget.style.color = '#555'}
                          title="Supprimer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div onClick={handleOtherAccount}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderTop: '1px solid #2a2a2a' }}
                      onMouseEnter={el => el.currentTarget.style.background = '#242424'}
                      onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: '12px', color: '#00BCD4' }}>+ Autre compte</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Plain identifier input (first use or "Autre compte") */
              <div style={{ position: 'relative' }}>
                <input
                  ref={emailRef}
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Email ou identifiant"
                  className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none"
                  style={{ background: '#171717', border: '1px solid #252525', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.target.style.borderColor = '#00BCD4')}
                  onBlur={e => (e.target.style.borderColor = '#252525')}
                />
                {typingNew && savedEmails.length > 0 && (
                  <button type="button" onClick={() => { setTypingNew(false); setEmail('') }}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '11px' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#00BCD4'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555'}
                  >
                    ← Retour
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Password ── */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-zinc-600 focus:outline-none"
                style={{ background: '#171717', border: '1px solid #252525', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = '#00BCD4')}
                onBlur={e => (e.target.style.borderColor = '#252525')}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs rounded-xl px-4 py-3"
              style={{ background: 'rgba(232,23,93,0.08)', border: '1px solid rgba(232,23,93,0.2)', color: '#e8175d' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="w-full font-bold text-sm rounded-xl py-3 mt-1"
            style={{ background: '#00BCD4', color: '#060606', boxShadow: '0 4px 20px rgba(0,188,212,0.25)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0097A7')}
            onMouseLeave={e => (e.currentTarget.style.background = '#00BCD4')}
          >
            Se connecter
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
        © 2025 Level Studios Inc. · Montréal, QC
      </p>
    </div>
  )
}
