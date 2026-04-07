import React, { useState } from 'react'
import { Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { Store } from '../../data/store'
import { cn } from '../../utils'

export default function ChefAccount() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const [pwForm, setPwForm] = useState({ old: '', newPw: '', confirm: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const handlePasswordSave = (e) => {
    e.preventDefault()
    setPwError('')
    if (!pwForm.old) return setPwError('Entrez votre mot de passe actuel.')
    if (pwForm.newPw.length < 6) return setPwError('Le nouveau mot de passe doit faire au moins 6 caractères.')
    if (pwForm.newPw !== pwForm.confirm) return setPwError('Les mots de passe ne correspondent pas.')

    const acc = Store.findAccountByEmail(user?.email)
    if (acc) Store.updateAccount(acc.id, { password: pwForm.newPw })

    setPwSuccess(true)
    setPwForm({ old: '', newPw: '', confirm: '' })
    setTimeout(() => setPwSuccess(false), 4000)
  }

  const card = isDark ? 'bg-zinc-900 border border-zinc-800 rounded-2xl' : 'bg-white border border-gray-200 rounded-2xl shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-500'

  return (
    <Layout navItems={CHEF_NAV} title="Profil">
      <div className="space-y-5 max-w-2xl">
        <h2 className={cn('text-2xl font-bold', textPrimary)}>Profil</h2>

        {/* Info card */}
        <div className={cn(card, 'p-5 flex items-center gap-4')}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background: '#0A4C99' }}>
            {user?.name?.charAt(0) || '?'}
          </div>
          <div>
            <div className={cn('font-semibold', textPrimary)}>{user?.name}</div>
            <div className={cn('text-sm', textSecondary)}>{user?.email}</div>
            <div className="mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 inline-block font-medium">
              {user?.role || 'Chef de projet'}
            </div>
          </div>
        </div>

        <div className={cn(card, 'overflow-hidden')}>
          <div className={cn('flex border-b', divider)}>
            <div className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 border-violet-600 text-violet-600">
              <Lock size={14} />
              <span>Mot de passe</span>
            </div>
          </div>

          <div className="p-6">
            {pwSuccess ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Check size={24} className="text-green-600" />
                </div>
                <p className={cn('font-bold', textPrimary)}>Mot de passe mis à jour !</p>
                <p className={cn('text-sm', textSecondary)}>Votre mot de passe a été modifié avec succès.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSave} className="space-y-4 max-w-sm">
                {[
                  { label: 'Mot de passe actuel', key: 'old', show: showOld, toggle: () => setShowOld(v => !v) },
                  { label: 'Nouveau mot de passe', key: 'newPw', show: showNew, toggle: () => setShowNew(v => !v) },
                  { label: 'Confirmer le nouveau mot de passe', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm(v => !v) },
                ].map(f => (
                  <div key={f.key}>
                    <label className={cn('block text-sm font-medium mb-1.5', textPrimary)}>{f.label}</label>
                    <div className="relative">
                      <input
                        type={f.show ? 'text' : 'password'}
                        value={pwForm[f.key]}
                        onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className={cn('w-full px-3 py-2.5 pr-10 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors', inputClass)}
                      />
                      <button type="button" onClick={f.toggle} className={cn('absolute right-3 top-1/2 -translate-y-1/2', textSecondary)}>
                        {f.show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}

                {pwError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle size={14} />
                    <p className="text-xs font-medium">{pwError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Enregistrer
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
