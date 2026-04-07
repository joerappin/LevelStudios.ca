import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, XCircle, Lock } from 'lucide-react'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { cn } from '../utils'

export default function SetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAccountPassword } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const token = searchParams.get('token') || ''
  const [tokenData, setTokenData] = useState(null)
  const [tokenValid, setTokenValid] = useState(null) // null=loading, true, false

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) { setTokenValid(false); return }
    const data = Store.validatePwdToken(token)
    if (data) { setTokenData(data); setTokenValid(true) }
    else setTokenValid(false)
  }, [token])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.')
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.')
    const result = setAccountPassword(token, password)
    if (result.success) setDone(true)
    else setError(result.error)
  }

  const bg = isDark ? 'bg-zinc-950' : 'bg-gray-50'
  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const inputCls = cn(
    'w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors',
    isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
  )
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'

  if (tokenValid === null) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', bg)}>
        <div className={`w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin`} />
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4', bg)}>
      <div className={cn('w-full max-w-md border rounded-2xl p-8', card)}>

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" className="w-12 h-12 object-contain rounded-xl mx-auto mb-3" alt="Level Studios" />
          <div className={cn('text-xs font-bold tracking-widest uppercase', textSecondary)}>Level Studios</div>
        </div>

        {/* Invalid token */}
        {!tokenValid && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className={cn('text-xl font-bold mb-2', textPrimary)}>Lien invalide ou expiré</h1>
            <p className={cn('text-sm mb-6', textSecondary)}>
              Ce lien de création de mot de passe n'est plus valide. Contactez votre administrateur pour en obtenir un nouveau.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        )}

        {/* Success */}
        {tokenValid && done && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className={cn('text-xl font-bold mb-2', textPrimary)}>Mot de passe créé !</h1>
            <p className={cn('text-sm mb-6', textSecondary)}>
              Votre compte est activé. Vous pouvez maintenant vous connecter avec votre email et votre nouveau mot de passe.
            </p>
            <button
              onClick={() => navigate('/reservation')}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Se connecter →
            </button>
          </div>
        )}

        {/* Form */}
        {tokenValid && !done && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className={cn('text-lg font-bold', textPrimary)}>Créer votre mot de passe</h1>
                <p className={cn('text-xs mt-0.5', textSecondary)}>Compte : {tokenData?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1.5', textSecondary)}>
                  Mot de passe <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={cn(inputCls, 'pr-11')}
                    placeholder="Minimum 6 caractères"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className={cn('absolute right-3 top-1/2 -translate-y-1/2', textSecondary)}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-1.5', textSecondary)}>
                  Confirmer le mot de passe <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={cn(inputCls, 'pr-11')}
                    placeholder=""
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className={cn('absolute right-3 top-1/2 -translate-y-1/2', textSecondary)}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors mt-2"
              >
                Activer mon compte
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
