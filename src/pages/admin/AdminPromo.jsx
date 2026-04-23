import React, { useState, useEffect } from 'react'
import { Plus, Trash2, X, ToggleLeft, ToggleRight, Pencil, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { formatPrice, formatDate } from '../../utils'
import { useApp } from '../../contexts/AppContext'

const INITIAL_CLIENTS = [
  { id: 'LVL3C0001', email: 'client@test.fr', name: 'Thomas Martin', type: 'client' },
  { id: 'LVL3B0001', email: 'pro@company.fr', name: 'Société Media Pro', type: 'client' },
]

function resolveAssignee(assigned_to, clients, employees) {
  if (!assigned_to) return null
  if (assigned_to.startsWith('client:')) {
    const email = assigned_to.slice(7)
    return clients.find(c => c.email === email)?.name || email
  }
  if (assigned_to.startsWith('employee:')) {
    const email = assigned_to.slice(9)
    return employees.find(e => e.email === email)?.name || email
  }
  return null
}

const EMPTY_FORM = { code: '', type: 'percentage', value: '', max_uses: '', expires_at: '', assigned_to: '' }

export default function AdminPromo() {
  const { theme } = useApp()
  const location = useLocation()
  const isDark = theme === 'dark'
  const [codes, setCodes] = useState(Store.getPromoCodes())
  const [showAdd, setShowAdd] = useState(false)
  const [editingCode, setEditingCode] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [clients, setClients] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => { if (location.state?.openAdd) setShowAdd(true) }, [])

  useEffect(() => {
    const handler = () => { if (showAdd) closeModal() }
    window.addEventListener('app:escape', handler)
    return () => window.removeEventListener('app:escape', handler)
  }, [showAdd])

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
  const tableRow = isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-gray-100 hover:bg-gray-50'
  const tableHead = isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'
  const modalBg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200 shadow-xl'
  const labelCls = isDark ? 'text-zinc-400' : 'text-gray-600'
  const btnSecondary = isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
  const codeBadge = isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-800'
  const actionBtn = isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'

  const refresh = () => setCodes(Store.getPromoCodes())

  const openEdit = (c) => {
    setEditingCode(c)
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      max_uses: c.max_uses != null ? String(c.max_uses) : '',
      expires_at: c.expires_at || '',
      assigned_to: c.assigned_to || '',
    })
    setShowAdd(true)
  }

  const closeModal = () => {
    setShowAdd(false)
    setEditingCode(null)
    setForm(EMPTY_FORM)
  }

  const saveCode = (e) => {
    e.preventDefault()
    const data = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      assigned_to: form.assigned_to || null,
    }
    if (editingCode) {
      Store.updatePromoCode(editingCode.id, data)
    } else {
      Store.addPromoCode({ ...data, active: true })
    }
    refresh()
    closeModal()
  }

  const toggleActive = (id, active) => {
    Store.updatePromoCode(id, { active: !active })
    refresh()
  }

  const deleteCode = (id) => {
    Store.deletePromoCode(id)
    refresh()
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Codes promo">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`font-bold text-lg ${textPrimary}`}>Codes promotionnels</h2>
            <p className={`text-sm ${textSecondary}`}>{codes.filter(c => c.active).length} code(s) actif(s)</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 transition-colors">
            <Plus className="w-4 h-4" /> Créer
          </button>
        </div>

        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${tableHead}`}>
                  <th className="text-left text-xs font-semibold px-5 py-3">Code</th>
                  <th className="text-left text-xs font-semibold px-5 py-3">Réduction</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden sm:table-cell">Utilisations</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden lg:table-cell">Assigné à</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden md:table-cell">Expiration</th>
                  <th className="text-left text-xs font-semibold px-5 py-3">Statut</th>
                  <th className="text-left text-xs font-semibold px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(c => {
                  const assignee = resolveAssignee(c.assigned_to, clients, employees)
                  return (
                    <tr key={c.id} className={`border-b transition-colors ${tableRow}`}>
                      <td className="px-5 py-3.5">
                        <span className={`font-mono font-bold px-2 py-1 rounded-lg text-sm ${codeBadge}`}>{c.code}</span>
                      </td>
                      <td className={`px-5 py-3.5 text-sm font-medium ${textPrimary}`}>
                        {c.type === 'percentage' ? `-${c.value}%` : `-${formatPrice(c.value)}`}
                      </td>
                      <td className={`px-5 py-3.5 hidden sm:table-cell text-sm ${textSecondary}`}>
                        {c.uses}{c.max_uses ? `/${c.max_uses}` : ''}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {assignee ? (
                          <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg ${isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-700'}`}>
                            <User size={10} />
                            {assignee}
                          </span>
                        ) : (
                          <span className={`text-xs ${textSecondary}`}>Tous</span>
                        )}
                      </td>
                      <td className={`px-5 py-3.5 hidden md:table-cell text-sm ${textSecondary}`}>
                        {c.expires_at ? formatDate(c.expires_at) : 'Sans limite'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${c.active ? 'bg-green-500/10 text-green-400' : (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500')}`}>
                          {c.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          <button onClick={() => toggleActive(c.id, c.active)} className={`p-1.5 rounded-lg transition-colors ${actionBtn}`}>
                            {c.active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(c)} className={`p-1.5 rounded-lg transition-colors ${actionBtn}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteCode(c.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {codes.length === 0 && (
                  <tr><td colSpan={7} className={`px-5 py-12 text-center text-sm ${textSecondary}`}>Aucun code promo</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-md p-6 ${modalBg}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-bold ${textPrimary}`}>{editingCode ? 'Modifier le code promo' : 'Nouveau code promo'}</h3>
              <button onClick={closeModal} className={`${textSecondary} hover:${textPrimary}`}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveCode} className="space-y-4">
              <div>
                <label className={`block text-sm mb-1.5 ${labelCls}`}>Code</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono uppercase ${inputCls}`}
                  placeholder="EX: SUMMER25"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm mb-1.5 ${labelCls}`}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${selectCls}`}>
                    <option value="percentage">Pourcentage</option>
                    <option value="fixed">Montant fixe</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-1.5 ${labelCls}`}>{form.type === 'percentage' ? 'Valeur (%)' : 'Valeur (CAD)'}</label>
                  <input
                    type="number" min="1" max={form.type === 'percentage' ? 100 : undefined}
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm mb-1.5 ${labelCls}`}>Nb d'utilisations</label>
                  <input
                    type="number" min="1"
                    value={form.max_uses}
                    onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
                    placeholder="Illimité"
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1.5 ${labelCls}`}>Date d'expiration</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm mb-1.5 ${labelCls}`}>
                  <User size={11} className="inline mr-1" />
                  Assigner à une personne
                </label>
                <select
                  value={form.assigned_to}
                  onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${selectCls}`}
                >
                  <option value="">— Tout le monde</option>
                  {clients.length > 0 && (
                    <optgroup label="Clients">
                      {clients.map(c => (
                        <option key={c.id} value={`client:${c.email}`}>{c.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {employees.length > 0 && (
                    <optgroup label="Employés">
                      {employees.map(e => (
                        <option key={e.id} value={`employee:${e.email}`}>{e.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className={`flex-1 border rounded-xl py-2.5 text-sm transition-colors ${btnSecondary}`}>Annuler</button>
                <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">
                  {editingCode ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
