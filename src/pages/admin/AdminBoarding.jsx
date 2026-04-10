import React, { useState, useEffect } from 'react'
import { CheckSquare, Square, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2, Save, User } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'

const ONBOARDING_STEPS = [
  {
    category: 'Accueil',
    items: [
      { id: 1, label: 'Visite des locaux effectuée', done: false },
      { id: 2, label: "Présentation de l'équipe", done: false },
      { id: 3, label: "Remise du badge d'accès", done: false },
      { id: 4, label: 'Explication des horaires', done: false },
    ]
  },
  {
    category: 'Outils & Accès',
    items: [
      { id: 5, label: 'Création du compte email', done: false },
      { id: 6, label: 'Accès au logiciel de réservation', done: false },
      { id: 7, label: 'Formation sur les équipements', done: false },
      { id: 8, label: 'Accès au serveur fichiers', done: false },
    ]
  },
  {
    category: 'Administratif',
    items: [
      { id: 9,  label: 'Contrat signé', done: false },
      { id: 10, label: 'RIB fourni', done: false },
      { id: 11, label: 'Mutuelle choisie', done: false },
      { id: 12, label: 'Document de formation sécurité lu et signé', done: false },
    ]
  },
]

const EMPTY_PROFILE = {
  firstName: '', lastName: '', photo: '', birthDate: '', birthPlace: '', nationality: '',
  maritalStatus: '', address: '', city: '', postalCode: '', province: '', phone: '',
  sin: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '', notes: '',
}

const EMPTY_SOFTWARE = { name: '', password: '', machine: '', price: '', active: true }

export default function AdminBoarding() {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const [tab, setTab] = useState('checklist')
  const [employees, setEmployees] = useState([])

  // ── Checklist ──────────────────────────────────────────────────────────────
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [steps, setSteps] = useState(ONBOARDING_STEPS)
  const [openCategories, setOpenCategories] = useState(['Accueil', 'Outils & Accès', 'Administratif'])

  // ── Fiche employé ──────────────────────────────────────────────────────────
  const [ficheEmpId, setFicheEmpId] = useState('')
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [profileSaved, setProfileSaved] = useState(false)

  // ── Comptes (software) ─────────────────────────────────────────────────────
  const [compteEmpId, setCompteEmpId] = useState('')
  const [visiblePwd, setVisiblePwd] = useState({})
  const [software, setSoftware] = useState([])

  useEffect(() => {
    const emps = Store.getEmployees().filter(e => !e.deleted)
    setEmployees(emps)
    if (emps.length > 0) {
      setSelectedEmpId(emps[0].id)
      setFicheEmpId(emps[0].id)
      setCompteEmpId(emps[0].id)
    }
  }, [])

  // Load profile when fiche employee changes
  useEffect(() => {
    if (!ficheEmpId) return
    const saved = Store.getEmployeeProfile(ficheEmpId)
    setProfile({ ...EMPTY_PROFILE, ...saved })
    setProfileSaved(false)
  }, [ficheEmpId])

  // Load software when compte employee changes
  useEffect(() => {
    if (!compteEmpId) return
    setSoftware(Store.getEmployeeSoftware(compteEmpId))
    setVisiblePwd({})
  }, [compteEmpId])

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const selectCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
  const inputCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const labelCls = isDark ? 'text-zinc-400' : 'text-gray-600'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'
  const progressBg = isDark ? 'bg-zinc-800' : 'bg-gray-200'
  const rowHover = isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-gray-50'
  const rowDivide = isDark ? 'divide-zinc-800/50' : 'divide-gray-100'
  const catHover = isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'
  const tableHead = isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'
  const tableRow = isDark ? 'border-zinc-800/50' : 'border-gray-100'

  // ── Checklist helpers ───────────────────────────────────────────────────────
  const toggleCategory = (cat) => setOpenCategories(o => o.includes(cat) ? o.filter(c => c !== cat) : [...o, cat])
  const toggleItem = (ci, ii) => setSteps(s => s.map((cat, c) => c === ci ? { ...cat, items: cat.items.map((item, i) => i === ii ? { ...item, done: !item.done } : item) } : cat))
  const totalItems = steps.reduce((s, c) => s + c.items.length, 0)
  const doneItems  = steps.reduce((s, c) => s + c.items.filter(i => i.done).length, 0)
  const progress   = Math.round((doneItems / totalItems) * 100)

  // ── Profile helpers ─────────────────────────────────────────────────────────
  const saveProfile = () => {
    Store.saveEmployeeProfile(ficheEmpId, profile)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  // ── Software helpers ────────────────────────────────────────────────────────
  const addSoftwareRow = () => {
    const updated = [...software, { ...EMPTY_SOFTWARE, id: Date.now() }]
    setSoftware(updated)
    Store.saveEmployeeSoftware(compteEmpId, updated)
  }
  const updateSoftwareRow = (idx, field, value) => {
    const updated = software.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    setSoftware(updated)
    Store.saveEmployeeSoftware(compteEmpId, updated)
  }
  const deleteSoftwareRow = (idx) => {
    const updated = software.filter((_, i) => i !== idx)
    setSoftware(updated)
    Store.saveEmployeeSoftware(compteEmpId, updated)
  }

  const TABS = [
    { key: 'checklist', label: 'Checklist intégration' },
    { key: 'fiche',     label: 'Fiche employé' },
    { key: 'comptes',   label: 'Comptes' },
  ]

  return (
    <Layout navItems={ADMIN_NAV} title="Onboarding">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ CHECKLIST ══════════════════════════════════════════════════════════ */}
        {tab === 'checklist' && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`font-bold text-lg ${textPrimary}`}>Checklist onboarding</h2>
                <p className={`text-sm ${textSecondary}`}>Suivi de l'intégration des nouveaux employés</p>
              </div>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                className={`border rounded-xl px-4 py-2 text-sm focus:outline-none ${selectCls}`}
              >
                {employees.length === 0
                  ? <option value="">Aucun employé</option>
                  : employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)
                }
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
                          <span className={`text-sm ${item.done ? 'text-zinc-400 line-through' : (isDark ? 'text-zinc-200' : 'text-gray-700')}`}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ══ FICHE EMPLOYÉ ══════════════════════════════════════════════════════ */}
        {tab === 'fiche' && (
          <div className="space-y-6 max-w-3xl">
            {/* Employee selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h2 className={`font-bold text-lg ${textPrimary}`}>Fiche employé</h2>
                  <p className={`text-xs ${textSecondary}`}>État civil et informations RH</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={ficheEmpId}
                  onChange={e => setFicheEmpId(e.target.value)}
                  className={`border rounded-xl px-4 py-2 text-sm focus:outline-none ${selectCls}`}
                >
                  {employees.length === 0
                    ? <option value="">Aucun employé</option>
                    : employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>)
                  }
                </select>
                {ficheEmpId && (
                  <button
                    onClick={saveProfile}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${profileSaved ? 'bg-green-500/20 text-green-400' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {profileSaved ? 'Enregistré !' : 'Enregistrer'}
                  </button>
                )}
              </div>
            </div>

            {ficheEmpId && (
              <div className="space-y-5">
                {/* Photo + Identity */}
                <div className={`border rounded-2xl p-5 ${card}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${textPrimary}`}>Identité</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Prénom" value={profile.firstName} onChange={v => setProfile(p => ({ ...p, firstName: v }))} cls={inputCls} labelCls={labelCls} />
                    <Field label="Nom" value={profile.lastName} onChange={v => setProfile(p => ({ ...p, lastName: v }))} cls={inputCls} labelCls={labelCls} />
                    <Field label="Date de naissance" type="date" value={profile.birthDate} onChange={v => setProfile(p => ({ ...p, birthDate: v }))} cls={inputCls} labelCls={labelCls} />
                    <Field label="Lieu de naissance" value={profile.birthPlace} onChange={v => setProfile(p => ({ ...p, birthPlace: v }))} cls={inputCls} labelCls={labelCls} />
                    <Field label="Nationalité" value={profile.nationality} onChange={v => setProfile(p => ({ ...p, nationality: v }))} cls={inputCls} labelCls={labelCls} />
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${labelCls}`}>État civil</label>
                      <select
                        value={profile.maritalStatus}
                        onChange={e => setProfile(p => ({ ...p, maritalStatus: e.target.value }))}
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none ${selectCls}`}
                      >
                        <option value="">— Sélectionner —</option>
                        {['Célibataire', 'Marié(e)', 'Pacsé(e)', 'Divorcé(e)', 'Veuf/Veuve'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <Field label="NAS (Numéro d'assurance sociale)" value={profile.sin} onChange={v => setProfile(p => ({ ...p, sin: v }))} cls={inputCls} labelCls={labelCls} placeholder="XXX-XXX-XXX" />
                    <Field label="Téléphone" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} cls={inputCls} labelCls={labelCls} />
                    <Field label="URL photo" value={profile.photo} onChange={v => setProfile(p => ({ ...p, photo: v }))} cls={inputCls} labelCls={labelCls} placeholder="https://..." />
                  </div>
                </div>

                {/* Address */}
                <div className={`border rounded-2xl p-5 ${card}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${textPrimary}`}>Adresse</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Adresse (numéro et rue)" value={profile.address} onChange={v => setProfile(p => ({ ...p, address: v }))} cls={inputCls} labelCls={labelCls} />
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Ville" value={profile.city} onChange={v => setProfile(p => ({ ...p, city: v }))} cls={inputCls} labelCls={labelCls} />
                      <Field label="Province / État" value={profile.province} onChange={v => setProfile(p => ({ ...p, province: v }))} cls={inputCls} labelCls={labelCls} />
                      <Field label="Code postal" value={profile.postalCode} onChange={v => setProfile(p => ({ ...p, postalCode: v }))} cls={inputCls} labelCls={labelCls} />
                    </div>
                  </div>
                </div>

                {/* Emergency contact */}
                <div className={`border rounded-2xl p-5 ${card}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${textPrimary}`}>Personne à contacter en cas d'urgence</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Nom complet" value={profile.emergencyName} onChange={v => setProfile(p => ({ ...p, emergencyName: v }))} cls={inputCls} labelCls={labelCls} />
                    <Field label="Téléphone" value={profile.emergencyPhone} onChange={v => setProfile(p => ({ ...p, emergencyPhone: v }))} cls={inputCls} labelCls={labelCls} />
                    <Field label="Relation" value={profile.emergencyRelation} onChange={v => setProfile(p => ({ ...p, emergencyRelation: v }))} cls={inputCls} labelCls={labelCls} placeholder="Ex : Conjoint(e), Parent..." />
                  </div>
                </div>

                {/* Notes */}
                <div className={`border rounded-2xl p-5 ${card}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${textPrimary}`}>Notes internes</h3>
                  <textarea
                    value={profile.notes}
                    onChange={e => setProfile(p => ({ ...p, notes: e.target.value }))}
                    rows={4}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none ${inputCls}`}
                    placeholder="Notes confidentielles sur cet employé..."
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ COMPTES ════════════════════════════════════════════════════════════ */}
        {tab === 'comptes' && (
          <div className="space-y-5">
            {/* Employee selector */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className={`font-bold text-lg ${textPrimary}`}>Comptes & Licences logiciels</h2>
                <p className={`text-xs ${textSecondary}`}>Logiciels attribués, machines, mots de passe</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={compteEmpId}
                  onChange={e => setCompteEmpId(e.target.value)}
                  className={`border rounded-xl px-4 py-2 text-sm focus:outline-none ${selectCls}`}
                >
                  {employees.length === 0
                    ? <option value="">Aucun employé</option>
                    : employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>)
                  }
                </select>
                {compteEmpId && (
                  <button
                    onClick={addSoftwareRow}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                )}
              </div>
            </div>

            {compteEmpId && (
              <div className={`border rounded-2xl overflow-hidden ${card}`}>
                <table className="w-full">
                  <thead>
                    <tr className={`border-b text-xs font-semibold ${tableHead}`}>
                      <th className="text-left px-4 py-3">Logiciel</th>
                      <th className="text-left px-4 py-3">Mot de passe</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Machine</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Prix</th>
                      <th className="text-center px-4 py-3">Statut</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {software.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`px-5 py-8 text-center text-sm ${textSecondary}`}>
                          Aucun logiciel enregistré — cliquez sur « Ajouter »
                        </td>
                      </tr>
                    )}
                    {software.map((row, idx) => (
                      <tr key={row.id || idx} className={`border-b ${tableRow}`}>
                        <td className="px-3 py-2">
                          <input
                            value={row.name}
                            onChange={e => updateSoftwareRow(idx, 'name', e.target.value)}
                            placeholder="Ex : Adobe CC"
                            className={`w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${inputCls}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              value={row.password}
                              onChange={e => updateSoftwareRow(idx, 'password', e.target.value)}
                              type={visiblePwd[idx] ? 'text' : 'password'}
                              placeholder="Mot de passe"
                              className={`flex-1 border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none ${inputCls}`}
                            />
                            <button
                              onClick={() => setVisiblePwd(v => ({ ...v, [idx]: !v[idx] }))}
                              className={`${textSecondary} hover:text-violet-400 transition-colors`}
                            >
                              {visiblePwd[idx] ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <input
                            value={row.machine}
                            onChange={e => updateSoftwareRow(idx, 'machine', e.target.value)}
                            placeholder="Ex : MacBook Pro Joe"
                            className={`w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${inputCls}`}
                          />
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <input
                            value={row.price}
                            onChange={e => updateSoftwareRow(idx, 'price', e.target.value)}
                            placeholder="Ex : 59.99 CAD"
                            className={`w-36 border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${inputCls}`}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <select
                            value={row.active === true ? 'actif' : row.active === false ? 'inactif' : 'supprimé'}
                            onChange={e => updateSoftwareRow(idx, 'active', e.target.value === 'actif' ? true : e.target.value === 'inactif' ? false : 'deleted')}
                            className={`border rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none ${
                              row.active === true ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                              row.active === false ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                              'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                          >
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                            <option value="supprimé">Supprimé</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => deleteSoftwareRow(idx)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

// ── Reusable field ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, cls, labelCls, type = 'text', placeholder }) {
  return (
    <div>
      <label className={`block text-xs font-medium mb-1.5 ${labelCls}`}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none ${cls}`}
      />
    </div>
  )
}
