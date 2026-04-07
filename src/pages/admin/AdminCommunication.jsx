import React, { useState, useEffect } from 'react'
import { Plus, Trash2, X, Bell, Clock, User, Users } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'

const INITIAL_CLIENTS = [
  { id: 'LVL3C0001', email: 'client@test.fr', name: 'Thomas Martin', type: 'client' },
  { id: 'LVL3B0001', email: 'pro@company.fr', name: 'Société Media Pro', type: 'client' },
]

function daysRemaining(createdAt, durationDays) {
  if (!durationDays) return null
  const created = new Date(createdAt)
  const expires = new Date(created.getTime() + durationDays * 86400000)
  const diff = Math.ceil((expires - Date.now()) / 86400000)
  return diff
}

function targetLabel(target, clients, employees) {
  if (target === 'all') return 'Tous'
  if (target === 'clients') return 'Tous les clients'
  if (target === 'employees') return 'Tous les employés'
  if (target?.startsWith('client:')) {
    const email = target.slice(7)
    const found = clients.find(c => c.email === email)
    return found ? found.name : email
  }
  if (target?.startsWith('employee:')) {
    const email = target.slice(9)
    const found = employees.find(e => e.email === email)
    return found ? found.name : email
  }
  return target
}

export default function AdminCommunication() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [popups, setPopups] = useState(Store.getPopupMessages())
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target: 'all', duration_days: 7 })
  const [clients, setClients] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    const storeAccounts = Store.getAccounts().filter(a => a.type === 'client')
    const allClients = [...INITIAL_CLIENTS]
    storeAccounts.forEach(a => {
      if (!allClients.find(c => c.email === a.email)) allClients.push(a)
    })
    setClients(allClients)
    setEmployees(Store.getEmployees())
  }, [])

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const inputCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const selectCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const modalBg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200 shadow-xl'
  const labelCls = isDark ? 'text-zinc-400' : 'text-gray-600'
  const btnSecondary = isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
  const notifItem = isDark ? 'bg-zinc-800' : 'bg-gray-50'

  const typeColors = {
    info:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    error:   'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const addPopup = (e) => {
    e.preventDefault()
    Store.addPopupMessage({ ...form, duration_days: Number(form.duration_days) || 7, active: true })
    setPopups(Store.getPopupMessages())
    setShowAdd(false)
    setForm({ title: '', message: '', type: 'info', target: 'all', duration_days: 7 })
  }

  const deletePopup = (id) => {
    Store.deletePopupMessage(id)
    setPopups(Store.getPopupMessages())
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Communication">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`font-bold text-lg ${textPrimary}`}>Messages popup</h2>
            <p className={`text-sm ${textSecondary}`}>Diffusez des annonces à vos utilisateurs</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 transition-colors">
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {popups.length === 0 ? (
            <div className={`col-span-full border rounded-2xl p-12 text-center ${card}`}>
              <Bell className={`w-8 h-8 mx-auto mb-3 opacity-30 ${textSecondary}`} />
              <p className={`text-sm ${textSecondary}`}>Aucun message actif</p>
            </div>
          ) : popups.map(p => {
            const remaining = daysRemaining(p.created_at, p.duration_days)
            const isExpired = remaining !== null && remaining <= 0
            return (
              <div key={p.id} className={`border rounded-2xl p-5 ${typeColors[p.type] || (isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white')} ${isExpired ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold truncate ${textPrimary}`}>{p.title}</span>
                      {isExpired && (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">Expiré</span>
                      )}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{p.message}</p>
                    <div className={`flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs ${textSecondary}`}>
                      <span className="capitalize">{p.type}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {targetLabel(p.target, clients, employees)}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {remaining === null
                          ? 'Sans limite'
                          : isExpired
                          ? `Expiré il y a ${Math.abs(remaining)} j`
                          : `${remaining} j restant${remaining > 1 ? 's' : ''}`
                        }
                      </span>
                      <span>·</span>
                      <span>{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <button onClick={() => deletePopup(p.id)} className={`transition-colors flex-shrink-0 hover:text-red-400 ${textSecondary}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className={`border rounded-2xl p-6 ${card}`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Notifications email</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Confirmation de réservation', desc: 'Envoyée automatiquement lors de la validation', active: true },
              { label: 'Rappel J-1', desc: 'Rappel 24h avant la session', active: true },
              { label: 'Livraison de projet', desc: 'Notifie le client lors de la livraison', active: true },
              { label: 'Newsletter mensuelle', desc: 'Actualités et offres du studio', active: false },
            ].map((n, i) => (
              <div key={i} className={`flex items-start justify-between rounded-xl p-4 ${notifItem}`}>
                <div>
                  <div className={`text-sm font-medium ${textPrimary}`}>{n.label}</div>
                  <div className={`text-xs mt-0.5 ${textSecondary}`}>{n.desc}</div>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center transition-colors flex-shrink-0 ml-3 cursor-pointer ${n.active ? 'bg-green-500 justify-end' : (isDark ? 'bg-zinc-600 justify-start' : 'bg-gray-300 justify-start')}`}>
                  <div className="w-4 h-4 bg-white rounded-full mx-1 shadow" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-md p-6 ${modalBg}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-bold ${textPrimary}`}>Nouveau popup</h3>
              <button onClick={() => setShowAdd(false)} className={`${textSecondary} hover:${textPrimary}`}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={addPopup} className="space-y-4">
              <div>
                <label className={`block text-sm mb-1.5 ${labelCls}`}>Titre</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`} required />
              </div>
              <div>
                <label className={`block text-sm mb-1.5 ${labelCls}`}>Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 resize-none ${inputCls}`} rows={3} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm mb-1.5 ${labelCls}`}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${selectCls}`}>
                    <option value="info">Info</option>
                    <option value="warning">Avertissement</option>
                    <option value="success">Succès</option>
                    <option value="error">Erreur</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-1.5 ${labelCls}`}>
                    <Clock size={11} className="inline mr-1" />
                    Durée (jours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.duration_days}
                    onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm mb-1.5 ${labelCls}`}>
                  <Users size={11} className="inline mr-1" />
                  Destinataire
                </label>
                <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${selectCls}`}>
                  <optgroup label="Groupes">
                    <option value="all">Tous</option>
                    <option value="clients">Tous les clients</option>
                    <option value="employees">Tous les employés</option>
                  </optgroup>
                  {clients.length > 0 && (
                    <optgroup label="Clients individuels">
                      {clients.map(c => (
                        <option key={c.id} value={`client:${c.email}`}>{c.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {employees.length > 0 && (
                    <optgroup label="Employés individuels">
                      {employees.map(e => (
                        <option key={e.id} value={`employee:${e.email}`}>{e.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className={`flex-1 border rounded-xl py-2.5 text-sm transition-colors ${btnSecondary}`}>Annuler</button>
                <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">Publier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
