import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function dashboardFor(user) {
  if (user.type === 'admin') return '/admin/dashboard'
  if (user.type === 'employee') {
    return user.roleKey === 'chef_projet' ? '/chef/dashboard' : '/employee/dashboard'
  }
  return null
}

export default function Login() {
  const { login, logout, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')

  // If already authenticated as staff, redirect immediately
  useEffect(() => {
    if (authLoading) return
    if (!user) return
    const dest = dashboardFor(user)
    if (dest) navigate(dest, { replace: true })
    // clients: stay on page — they shouldn't be here
  }, [authLoading, user]) // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const result = login(email, password)

    if (!result.success) {
      setError('Email ou mot de passe incorrect.')
      return
    }

    // Block client accounts — undo the login() side-effect
    if (result.user.type === 'client') {
      logout()
      setError('Cet espace est réservé aux équipes Level Studios.')
      return
    }

    const dest = dashboardFor(result.user)
    if (dest) navigate(dest, { replace: true })
  }

  if (authLoading) return null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#060606' }}
    >
      {/* Back */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm"
        style={{ color: 'rgba(255,255,255,0.35)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
      >
        <ArrowLeft size={15} />
        Retour
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/logo.png"
            alt="Level Studios"
            style={{ width: 72, height: 72, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
          <span className="text-white font-bold text-lg tracking-tight">Level Studios</span>
        </div>

        <h1 className="text-white text-2xl font-bold mb-1">Espace équipe</h1>
        <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Connexion réservée aux administrateurs et employés.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="votre@email.com"
              className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none"
              style={{ background: '#171717', border: '1px solid #252525', transition: 'border-color 0.15s' }}
              onFocus={e => (e.target.style.borderColor = '#00BCD4')}
              onBlur={e => (e.target.style.borderColor = '#252525')}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Mot de passe
            </label>
            <div className="relative">
              <input
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
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="text-xs rounded-xl px-4 py-3"
              style={{
                background: 'rgba(232,23,93,0.08)',
                border: '1px solid rgba(232,23,93,0.2)',
                color: '#e8175d',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full font-bold text-sm rounded-xl py-3 mt-1"
            style={{
              background: '#00BCD4',
              color: '#060606',
              boxShadow: '0 4px 20px rgba(0,188,212,0.25)',
              transition: 'background 0.15s',
            }}
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
