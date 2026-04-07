import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createPageUrl } from '@/utils'

export default function LoginModal({ onClose, mode = 'login', onLoginSuccess }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(mode === 'register' ? 'register' : 'login')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', clientType: 'particulier' })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = login(loginForm.email, loginForm.password)
    setLoading(false)
    if (result.success) {
      if (onLoginSuccess) { onLoginSuccess(result.user); return }
      onClose()
      const routes = { admin: createPageUrl('Dashboard'), employee: createPageUrl('EmployeeDashboard'), client: createPageUrl('ClientDashboard') }
      navigate(routes[result.user.type] || '/')
    } else {
      setError(result.error)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!registerForm.email || !registerForm.password || !registerForm.firstName) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }
    setLoading(true)
    const result = register(registerForm)
    setLoading(false)
    if (result.success) {
      if (onLoginSuccess) { onLoginSuccess(result.user); return }
      onClose()
      navigate(createPageUrl('ClientDashboard'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10">
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="bg-zinc-950 p-6 text-center border-b border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">L</span>
          </div>
          <h2 className="text-white font-bold text-xl">Level Studio</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => { setTab('login'); setError('') }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'login' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            <LogIn size={14} className="inline mr-1" /> Se connecter
          </button>
          <button
            onClick={() => { setTab('register'); setError('') }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'register' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            <UserPlus size={14} className="inline mr-1" /> Créer un compte
          </button>
        </div>

        <div className="p-6">
          {error && <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-zinc-300 text-sm mb-1">Email</label>
                <input
                  type="email" required
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-zinc-300 text-sm mb-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} required
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 font-medium transition-colors">
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <div className="text-center">
                <p className="text-zinc-500 text-xs mt-2">Comptes test :</p>
                <p className="text-zinc-600 text-xs">Admin: joe.rappin@gmail.com / level88</p>
                <p className="text-zinc-600 text-xs">Employé: employe@levelstudio.fr / emp123</p>
                <p className="text-zinc-600 text-xs">Client: client@test.fr / client123</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 text-xs mb-1">Prénom *</label>
                  <input type="text" required value={registerForm.firstName} onChange={e => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-zinc-300 text-xs mb-1">Nom *</label>
                  <input type="text" required value={registerForm.lastName} onChange={e => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dupont" />
                </div>
              </div>
              <div>
                <label className="block text-zinc-300 text-xs mb-1">Email *</label>
                <input type="email" required value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="votre@email.com" />
              </div>
              <div>
                <label className="block text-zinc-300 text-xs mb-1">Mot de passe *</label>
                <input type="password" required value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-zinc-300 text-xs mb-1">Téléphone</label>
                <input type="tel" value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="06 12 34 56 78" />
              </div>
              <div>
                <label className="block text-zinc-300 text-xs mb-1">Type de compte</label>
                <select value={registerForm.clientType} onChange={e => setRegisterForm({ ...registerForm, clientType: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="particulier">Particulier</option>
                  <option value="pro">Professionnel / Entreprise</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 font-medium transition-colors mt-2">
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
