import React, { useState } from 'react'
import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
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
  const [steps, setSteps] = useState(ONBOARDING_STEPS)
  const [openCategories, setOpenCategories] = useState(['Accueil', 'Outils & Accès', 'Administratif'])
  const [selectedEmployee, setSelectedEmployee] = useState('LVL20001')

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
      <div className="space-y-6 max-w-2xl">
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
      </div>
    </Layout>
  )
}
