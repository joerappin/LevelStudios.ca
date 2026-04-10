import React, { useState, useEffect } from 'react'
import { CheckSquare, Square, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'

const ONBOARDING_STEPS = [
  {
    category: 'Accueil',
    items: [
      { id: 1, label: 'Visite des locaux effectuée', done: true },
      { id: 2, label: "Présentation de l'équipe", done: true },
      { id: 3, label: "Remise du badge d'accès", done: true },
      { id: 4, label: 'Explication des horaires', done: false },
    ]
  },
  {
    category: 'Outils & Accès',
    items: [
      { id: 5, label: 'Création du compte email', done: true },
      { id: 6, label: 'Accès au logiciel de réservation', done: true },
      { id: 7, label: 'Formation sur les équipements', done: false },
      { id: 8, label: 'Accès au serveur fichiers', done: false },
    ]
  },
  {
    category: 'Administratif',
    items: [
      { id: 9, label: 'Contrat signé', done: true },
      { id: 10, label: 'RIB fourni', done: true },
      { id: 11, label: 'Mutuelle choisie', done: false },
      { id: 12, label: 'Document de formation sécurité lu et signé', done: false },
    ]
  },
]

export default function AdminBoarding() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [tab, setTab] = useState('checklist')
  const [steps, setSteps] = useState(ONBOARDING_STEPS)
  const [openCategories, setOpenCategories] = useState(['Accueil', 'Outils & Accès', 'Administratif'])
  const [selectedEmployee, setSelectedEmployee] = useState('LVL20001')
  const [accounts, setAccounts] = useState([])
  const [visiblePwd, setVisiblePwd] = useState({})

  useEffect(() => {
    const all = Store.getAccounts()
    const employees = Store.getEmployees().filter(e => !e.deleted)
    const merged = employees.map(emp => {
      const acc = all.find(a => a.id === emp.id) || {}
      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        roleKey: emp.roleKey,
        password: acc.password || '—',
        active: emp.active !== false,
        deleted: !!emp.deleted,
      }
    })
    setAccounts(merged)
  }, [])

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const selectCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'
  const progressBg = isDark ? 'bg-zinc-800' : 'bg-gray-200'
  const rowHover = isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-gray-50'
  const rowDivide = isDark ? 'divide-zinc-800/50' : 'divide-gray-100'
  const catHover = isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'

  const toggleCategory = (cat) => {
    setOpenCategories(o => o.includes(cat) ? o.filter(c => c !== cat) : [...o, cat])
  }

  const toggleItem = (catIdx, itemIdx) => {
    setSteps(s => s.map((cat, ci) => ci === catIdx ? {
      ...cat,
      items: cat.items.map((item, ii) => ii === itemIdx ? { ...item, done: !item.done } : item)
    } : cat))
  }

  const totalItems = steps.reduce((s, c) => s + c.items.length, 0)
  const doneItems = steps.reduce((s, c) => s + c.items.filter(i => i.done).length, 0)
  const progress = Math.round((doneItems / totalItems) * 100)

  return (
    <Layout navItems={ADMIN_NAV} title="Onboarding">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('checklist')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'checklist' ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Checklist intégration
          </button>
          <button onClick={() => setTab('comptes')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'comptes' ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Comptes équipe
          </button>
        </div>

        {/* ── TABLEAU COMPTES ── */}
        {tab === 'comptes' && (
          <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b text-xs font-semibold ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'}`}>
                  <th className="text-left px-5 py-3">Compte</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Identifiant</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Mot de passe</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Rôle</th>
                  <th className="text-center px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 && (
                  <tr><td colSpan={5} className={`px-5 py-8 text-center text-sm ${textSecondary}`}>Aucun compte employé.</td></tr>
                )}
                {accounts.map(acc => (
                  <tr key={acc.id} className={`border-b ${isDark ? 'border-zinc-800/60' : 'border-gray-100'}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">{acc.name.charAt(0)}</div>
                        <span className={`text-sm font-medium ${textPrimary}`}>{acc.name}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 hidden sm:table-cell text-sm ${textSecondary}`}>{acc.email}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-mono ${textPrimary}`}>
                          {visiblePwd[acc.id] ? acc.password : acc.password !== '—' ? '••••••••' : '—'}
                        </span>
                        {acc.password !== '—' && (
                          <button onClick={() => setVisiblePwd(v => ({ ...v, [acc.id]: !v[acc.id] }))} className={`${textSecondary} hover:text-violet-400 transition-colors`}>
                            {visiblePwd[acc.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 hidden lg:table-cell text-sm ${textSecondary}`}>{acc.role}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        acc.deleted ? 'bg-red-500/10 text-red-400' :
                        acc.active  ? 'bg-green-500/10 text-green-400' :
                                      'bg-orange-500/10 text-orange-400'
                      }`}>
                        {acc.deleted ? 'Supprimé' : acc.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CHECKLIST ── */}
        {tab === 'checklist' && <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`font-bold text-lg ${textPrimary}`}>Checklist onboarding</h2>
            <p className={`text-sm ${textSecondary}`}>Suivi de l'intégration des nouveaux employés</p>
          </div>
          <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className={`border rounded-xl px-4 py-2 text-sm focus:outline-none ${selectCls}`}>
            <option value="LVL20001">Marie Dupont</option>
            <option value="LVL20002">Marc Lefebvre</option>
          </select>
        </div>

        <div className={`border rounded-2xl p-5 ${card}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Progression globale</span>
            <span className={`font-bold ${textPrimary}`}>{progress}%</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${progressBg}`}>
            <div className="h-full bg-violet-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className={`text-xs mt-2 ${textSecondary}`}>{doneItems}/{totalItems} étapes complétées</div>
        </div>

        {steps.map((cat, ci) => {
          const isOpen = openCategories.includes(cat.category)
          const catDone = cat.items.filter(i => i.done).length
          return (
            <div key={cat.category} className={`border rounded-2xl overflow-hidden ${card}`}>
              <button
                onClick={() => toggleCategory(cat.category)}
                className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${catHover}`}
              >
                <div className="flex items-center gap-3">
                  <h3 className={`font-semibold ${textPrimary}`}>{cat.category}</h3>
                  <span className={`text-xs ${textSecondary}`}>{catDone}/{cat.items.length}</span>
                </div>
                {isOpen ? <ChevronUp className={`w-4 h-4 ${textSecondary}`} /> : <ChevronDown className={`w-4 h-4 ${textSecondary}`} />}
              </button>
              {isOpen && (
                <div className={`border-t divide-y ${divider} ${rowDivide}`}>
                  {cat.items.map((item, ii) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(ci, ii)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors text-left ${rowHover}`}
                    >
                      {item.done
                        ? <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
                        : <Square className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`} />}
                      <span className={`text-sm ${item.done ? (isDark ? 'text-zinc-400 line-through' : 'text-gray-400 line-through') : (isDark ? 'text-zinc-200' : 'text-gray-700')}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        </div>}
      </div>
    </Layout>
  )
}
