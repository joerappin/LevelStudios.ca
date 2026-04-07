import React, { useState, useEffect } from 'react'
import { User, Lock, FileText, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import ClientLayout from '../../components/ClientLayout'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { translations } from '../../i18n/translations'

const TABS = [
  { key: 'info',     icon: User,     label_fr: 'Informations personnelles', label_en: 'Personal information' },
  { key: 'password', icon: Lock,     label_fr: 'Mot de passe',              label_en: 'Password' },
  { key: 'invoices', icon: FileText, label_fr: 'Factures',                  label_en: 'Invoices' },
]

export default function ClientAccount() {
  const { user, updateUser } = useAuth()
  const { theme, lang } = useApp()
  const t = (k) => translations[lang]?.[k] || k
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState('info')

  // Personal info form
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    vat: '',
  })
  const [infoSuccess, setInfoSuccess] = useState(false)
  const [infoError, setInfoError] = useState('')

  // Password form
  const [pwForm, setPwForm] = useState({ old: '', newPw: '', confirm: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  // Invoices (from hour packs purchased)
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    if (!user) return
    const nameParts = (user.name || '').split(' ')
    setForm({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      phone: user.phone || '',
      company: user.company || '',
      vat: user.vat || '',
    })
    setInvoices(Store.getHourPacks().filter(p => p.client_email === user.email))
  }, [user])

  const handleInfoSave = (e) => {
    e.preventDefault()
    setInfoError('')
    if (!form.firstName.trim()) {
      setInfoError(lang === 'fr' ? 'Le prénom est requis.' : 'First name is required.')
      return
    }
    if (updateUser) {
      updateUser({
        ...user,
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        company: form.company,
        vat: form.vat,
      })
    }
    setInfoSuccess(true)
    setTimeout(() => setInfoSuccess(false), 3000)
  }

  const handlePasswordSave = (e) => {
    e.preventDefault()
    setPwError('')
    if (!pwForm.old) {
      setPwError(lang === 'fr' ? 'Entrez votre mot de passe actuel.' : 'Enter your current password.')
      return
    }
    if (pwForm.newPw.length < 6) {
      setPwError(lang === 'fr' ? 'Le nouveau mot de passe doit faire au moins 6 caractères.' : 'New password must be at least 6 characters.')
      return
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.')
      return
    }
    setPwSuccess(true)
    setPwForm({ old: '', newPw: '', confirm: '' })
    setTimeout(() => setPwSuccess(false), 4000)
  }

  const card = isDark
    ? 'bg-zinc-900 border border-zinc-800 rounded-2xl'
    : 'bg-white border border-gray-200 rounded-2xl shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'

  const LabeledInput = ({ label, value, onChange, type = 'text', disabled, note, rightEl }) => (
    <div>
      <label className={`block text-sm font-medium mb-1.5 ${textPrimary}`}>{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors ${inputClass} ${
            disabled
              ? isDark ? 'opacity-50 cursor-not-allowed' : 'bg-gray-50 cursor-not-allowed opacity-70'
              : ''
          }`}
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
      {note && <p className={`text-xs mt-1 ${textSecondary}`}>{note}</p>}
    </div>
  )

  return (
    <ClientLayout title={t('profile')}>
      <div className="space-y-5 max-w-2xl">
        <h2 className={`text-2xl font-bold ${textPrimary}`}>{t('profile')}</h2>

        {/* Tabs */}
        <div className={`${card} overflow-hidden`}>
          <div className={`flex border-b ${divider}`}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.key
                    ? 'border-violet-600 text-violet-600'
                    : `border-transparent ${textSecondary}`
                }`}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{lang === 'fr' ? tab.label_fr : tab.label_en}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Tab 1 — Personal info */}
            {activeTab === 'info' && (
              <form onSubmit={handleInfoSave} className="space-y-4">
                <LabeledInput
                  label={t('email')}
                  value={user?.email || ''}
                  disabled
                  note={t('email_locked')}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <LabeledInput
                    label={t('first_name')}
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  />
                  <LabeledInput
                    label={t('last_name')}
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
                <LabeledInput
                  label={t('phone')}
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  type="tel"
                />
                <LabeledInput
                  label={t('company')}
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                />
                <LabeledInput
                  label={t('vat')}
                  value={form.vat}
                  onChange={e => setForm(f => ({ ...f, vat: e.target.value }))}
                />

                {infoError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle size={14} />
                    <p className="text-xs font-medium">{infoError}</p>
                  </div>
                )}
                {infoSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700">
                    <Check size={14} />
                    <p className="text-xs font-medium">
                      {lang === 'fr' ? 'Modifications enregistrées !' : 'Changes saved!'}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {t('save_changes')}
                </button>
              </form>
            )}

            {/* Tab 2 — Password */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSave} className="space-y-4">
                {pwSuccess ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                      <Check size={24} className="text-green-600" />
                    </div>
                    <p className={`font-bold ${textPrimary}`}>
                      {lang === 'fr' ? 'Mot de passe mis à jour !' : 'Password updated!'}
                    </p>
                    <p className={`text-sm ${textSecondary}`}>
                      {lang === 'fr' ? 'Votre mot de passe a été modifié avec succès.' : 'Your password has been successfully changed.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${textPrimary}`}>
                        {lang === 'fr' ? 'Mot de passe actuel' : 'Current password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showOld ? 'text' : 'password'}
                          value={pwForm.old}
                          onChange={e => setPwForm(f => ({ ...f, old: e.target.value }))}
                          className={`w-full px-3 py-2.5 pr-10 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors ${inputClass}`}
                        />
                        <button type="button" onClick={() => setShowOld(v => !v)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary}`}>
                          {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${textPrimary}`}>
                        {lang === 'fr' ? 'Nouveau mot de passe' : 'New password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={pwForm.newPw}
                          onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                          className={`w-full px-3 py-2.5 pr-10 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors ${inputClass}`}
                        />
                        <button type="button" onClick={() => setShowNew(v => !v)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary}`}>
                          {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${textPrimary}`}>
                        {lang === 'fr' ? 'Confirmer le nouveau mot de passe' : 'Confirm new password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={pwForm.confirm}
                          onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                          className={`w-full px-3 py-2.5 pr-10 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors ${inputClass}`}
                        />
                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary}`}>
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {pwError && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                        <AlertCircle size={14} />
                        <p className="text-xs font-medium">{pwError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {lang === 'fr' ? 'Mettre à jour le mot de passe' : 'Update password'}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Tab 3 — Invoices */}
            {activeTab === 'invoices' && (
              <div>
                {invoices.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                      <FileText size={24} className={textSecondary} />
                    </div>
                    <p className={`font-semibold ${textPrimary}`}>
                      {lang === 'fr' ? 'Aucune facture' : 'No invoices yet'}
                    </p>
                    <p className={`text-sm ${textSecondary}`}>
                      {lang === 'fr' ? 'Vos factures apparaîtront ici après un achat.' : 'Your invoices will appear here after a purchase.'}
                    </p>
                  </div>
                ) : (
                  <div className={`divide-y ${divider}`}>
                    {invoices.map(inv => (
                      <div key={inv.id} className={`flex items-center justify-between py-4 ${isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'} -mx-2 px-2 rounded-xl transition-colors`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-violet-50'}`}>
                            <FileText size={15} className="text-violet-500" />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${textPrimary}`}>{inv.name}</p>
                            <p className={`text-xs ${textSecondary}`}>{formatDate(inv.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${textPrimary}`}>
                            {inv.price_cad?.toLocaleString('fr-CA')} CAD
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                            {lang === 'fr' ? 'Payé' : 'Paid'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
