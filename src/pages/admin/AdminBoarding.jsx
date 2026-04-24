import React, { useState, useEffect, useRef } from 'react'
import { CheckSquare, Square, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2, Save, User } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'

// ─── Onboarding steps template ────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  { category: 'Accueil', items: [
    { id: 1, label: 'Visite des locaux effectuée', done: false },
    { id: 2, label: "Présentation de l'équipe", done: false },
    { id: 3, label: "Remise du badge d'accès", done: false },
    { id: 4, label: 'Explication des horaires', done: false },
  ]},
  { category: 'Outils & Accès', items: [
    { id: 5, label: 'Création du compte email', done: false },
    { id: 6, label: 'Accès au logiciel de réservation', done: false },
    { id: 7, label: 'Formation sur les équipements', done: false },
    { id: 8, label: 'Accès au serveur fichiers', done: false },
  ]},
  { category: 'Administratif', items: [
    { id: 9,  label: 'Contrat signé', done: false },
    { id: 10, label: 'RIB fourni', done: false },
    { id: 11, label: 'Mutuelle choisie', done: false },
    { id: 12, label: 'Document de formation sécurité lu et signé', done: false },
  ]},
]

const EMPTY_PROFILE = {
  firstName: '', lastName: '', photo: '', birthDate: '', birthPlace: '',
  nationality: '', maritalStatus: '', address: '', city: '', postalCode: '',
  province: '', phone: '', sin: '', emergencyName: '', emergencyPhone: '',
  emergencyRelation: '', notes: '',
}

// ─── Isolated row for software table — own local state → no cursor loss ───────
function SoftwareRow({ initialRow, rowKey, inputCls, selectCls, textSecondary, onSave, onDelete }) {
  const [row, setRow] = useState(initialRow)
  const [showPwd, setShowPwd] = useState(false)

  // Sync only when the employee changes (rowKey changes)
  useEffect(() => { setRow(initialRow) }, [rowKey]) // eslint-disable-line

  const update = (field, value) => setRow(prev => ({ ...prev, [field]: value }))
  const persist  = () => onSave({ ...row })

  const statusCls =
    row.active === true    ? 'bg-green-500/10 text-green-400 border-green-500/30' :
    row.active === false   ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                             'bg-red-500/10 text-red-400 border-red-500/30'

  return (
    <tr className="border-b border-inherit">
      {/* Logiciel */}
      <td className="px-3 py-2">
        <input
          value={row.name}
          onChange={e => update('name', e.target.value)}
          onBlur={persist}
          placeholder="Ex : Adobe CC"
          className={`w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${inputCls}`}
        />
      </td>
      {/* Mot de passe */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <input
            value={row.password}
            type={showPwd ? 'text' : 'password'}
            onChange={e => update('password', e.target.value)}
            onBlur={persist}
            placeholder="Mot de passe"
            className={`flex-1 border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none ${inputCls}`}
          />
          <button
            type="button"
            onMouseDown={e => e.preventDefault()} // prevent blur on input
            onClick={() => setShowPwd(s => !s)}
            className={`${textSecondary} hover:text-violet-400 transition-colors`}
          >
            {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </td>
      {/* Machine */}
      <td className="px-3 py-2 hidden md:table-cell">
        <input
          value={row.machine}
          onChange={e => update('machine', e.target.value)}
          onBlur={persist}
          placeholder="Ex : MacBook Pro Joe"
          className={`w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${inputCls}`}
        />
      </td>
      {/* Prix */}
      <td className="px-3 py-2 hidden lg:table-cell">
        <input
          value={row.price}
          onChange={e => update('price', e.target.value)}
          onBlur={persist}
          placeholder="Ex : 59.99 CAD"
          className={`w-36 border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${inputCls}`}
        />
      </td>
      {/* Statut */}
      <td className="px-3 py-2 text-center">
        <select
          value={row.active === true ? 'actif' : row.active === false ? 'inactif' : 'supprimé'}
          onChange={e => {
            const v = e.target.value === 'actif' ? true : e.target.value === 'inactif' ? false : 'deleted'
            const updated = { ...row, active: v }
            setRow(updated)
            onSave(updated)
          }}
          className={`border rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none ${statusCls}`}
        >
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="supprimé">Supprimé</option>
        </select>
      </td>
      {/* Supprimer */}
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={onDelete}
          className={`p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors`}
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}

// ─── Isolated profile field — own local state → no cursor loss ────────────────
function ProfileField({ label, storeValue, onCommit, cls, labelCls, type = 'text', placeholder }) {
  const [val, setVal] = useState(storeValue)
  // Sync if external value changes (employee switch)
  useEffect(() => { setVal(storeValue) }, [storeValue])
  return (
    <div>
      <label className={`block text-xs font-medium mb-1.5 ${labelCls}`}>{label}</label>
      <input
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => onCommit(val)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none ${cls}`}
      />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminBoarding() {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const [tab, setTab] = useState('checklist')
  const [employees, setEmployees] = useState([])

  // ── Checklist ──────────────────────────────────────────────────────────────
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [steps, setSteps] = useState(ONBOARDING_STEPS)
  const [openCats, setOpenCats] = useState(['Accueil', 'Outils & Accès', 'Administratif'])

  // ── Fiche employé ──────────────────────────────────────────────────────────
  const [ficheEmpId, setFicheEmpId] = useState('')
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [profileSaved, setProfileSaved] = useState(false)

  // ── Comptes (software) ─────────────────────────────────────────────────────
  const [compteEmpId, setCompteEmpId] = useState('')
  // software is the source-of-truth list; each SoftwareRow has its own local state
  const [software, setSoftware] = useState([])
  const softwareRef = useRef([])

  // ── Freelance ─────────────────────────────────────────────────────────────
  const [freelances, setFreelances]       = useState([])
  const [freelanceId, setFreelanceId]     = useState('')
  const [freelanceForm, setFreelanceForm] = useState({ mission: '', startDate: '', endDate: '', amountHT: '', taxRate: '14.975', notes: '' })
  const [freelanceSaved, setFreelanceSaved] = useState(false)

  useEffect(() => {
    fetch('/api/accounts.php')
      .then(r => r.json())
      .then(accounts => {
        const emps = accounts.filter(a => a.type !== 'client' && !a.deleted)
        setEmployees(emps.filter(e => e.roleKey !== 'freelance'))
        const fls = emps.filter(e => e.roleKey === 'freelance')
        setFreelances(fls)
        const nonFl = emps.filter(e => e.roleKey !== 'freelance')
        if (nonFl.length > 0) { setSelectedEmpId(nonFl[0].id); setFicheEmpId(nonFl[0].id); setCompteEmpId(nonFl[0].id) }
        if (fls.length > 0) setFreelanceId(fls[0].id)
      })
      .catch(() => {
        const emps = Store.getEmployees().filter(e => !e.deleted)
        const nonFl = emps.filter(e => e.roleKey !== 'freelance')
        const fls   = emps.filter(e => e.roleKey === 'freelance')
        setEmployees(nonFl)
        setFreelances(fls)
        if (nonFl.length > 0) { setSelectedEmpId(nonFl[0].id); setFicheEmpId(nonFl[0].id); setCompteEmpId(nonFl[0].id) }
        if (fls.length > 0) setFreelanceId(fls[0].id)
      })
  }, [])

  useEffect(() => {
    if (!freelanceId) return
    const m = Store.getFreelanceMission(freelanceId)
    setFreelanceForm({ mission: '', startDate: '', endDate: '', amountHT: '', taxRate: '14.975', notes: '', ...m })
    setFreelanceSaved(false)
  }, [freelanceId])

  // Load profile when employee changes
  useEffect(() => {
    if (!ficheEmpId) return
    setProfile({ ...EMPTY_PROFILE, ...Store.getEmployeeProfile(ficheEmpId) })
    setProfileSaved(false)
  }, [ficheEmpId])

  // Load software when employee changes — assign stable _key to each row
  useEffect(() => {
    if (!compteEmpId) return
    const rows = Store.getEmployeeSoftware(compteEmpId).map((r, i) => ({
      _key: r._key || `${compteEmpId}-${i}-${Date.now()}`,
      name: '', password: '', machine: '', price: '', active: true,
      ...r,
    }))
    setSoftware(rows)
    softwareRef.current = rows
  }, [compteEmpId])

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary   = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const selectCls  = isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
  const inputCls   = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const labelCls   = isDark ? 'text-zinc-400' : 'text-gray-600'
  const divider    = isDark ? 'border-zinc-800' : 'border-gray-100'
  const progressBg = isDark ? 'bg-zinc-800' : 'bg-gray-200'
  const rowDivide  = isDark ? 'divide-zinc-800/50' : 'divide-gray-100'
  const catHover   = isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'
  const rowHover   = isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-gray-50'
  const tableHead  = isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'

  // ── Checklist ──────────────────────────────────────────────────────────────
  const toggleCat  = (cat) => setOpenCats(o => o.includes(cat) ? o.filter(c => c !== cat) : [...o, cat])
  const toggleItem = (ci, ii) => setSteps(s => s.map((cat, c) => c !== ci ? cat : {
    ...cat, items: cat.items.map((item, i) => i !== ii ? item : { ...item, done: !item.done })
  }))
  const totalItems = steps.reduce((s, c) => s + c.items.length, 0)
  const doneItems  = steps.reduce((s, c) => s + c.items.filter(i => i.done).length, 0)
  const progress   = Math.round((doneItems / totalItems) * 100)

  // ── Profile ────────────────────────────────────────────────────────────────
  const commitProfile = (field, value) => {
    const updated = { ...profile, [field]: value }
    setProfile(updated)
    Store.saveEmployeeProfile(ficheEmpId, updated)
  }
  const saveAll = () => {
    Store.saveEmployeeProfile(ficheEmpId, profile)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  // ── Software ───────────────────────────────────────────────────────────────
  const addRow = () => {
    const newRow = {
      _key: `${compteEmpId}-new-${Date.now()}`,
      name: '', password: '', machine: '', price: '', active: true,
    }
    const updated = [...softwareRef.current, newRow]
    softwareRef.current = updated
    setSoftware(updated)
    Store.saveEmployeeSoftware(compteEmpId, updated)
  }

  const saveRow = (idx, row) => {
    const updated = softwareRef.current.map((r, i) => i === idx ? row : r)
    softwareRef.current = updated
    setSoftware(updated)
    Store.saveEmployeeSoftware(compteEmpId, updated)
  }

  const deleteRow = (idx) => {
    const updated = softwareRef.current.filter((_, i) => i !== idx)
    softwareRef.current = updated
    setSoftware(updated)
    Store.saveEmployeeSoftware(compteEmpId, updated)
  }

  // ── Freelance save ─────────────────────────────────────────────────────────
  const saveFreelance = () => {
    if (!freelanceId) return
    Store.saveFreelanceMission(freelanceId, freelanceForm)
    setFreelanceSaved(true)
    setTimeout(() => setFreelanceSaved(false), 2000)
  }

  const freelanceTTC = freelanceForm.amountHT && freelanceForm.taxRate
    ? (parseFloat(freelanceForm.amountHT) * (1 + parseFloat(freelanceForm.taxRate) / 100)).toFixed(2)
    : ''

  const TABS = [
    { key: 'checklist', label: 'Checklist intégration' },
    { key: 'fiche',     label: 'Fiche employé' },
    { key: 'comptes',   label: 'Comptes' },
    { key: 'freelance', label: `Freelance${freelances.length ? ` (${freelances.length})` : ''}` },
  ]

  return (
    <Layout navItems={ADMIN_NAV} title="Onboarding">
      <div className="space-y-6">

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? t.key === 'freelance' ? 'bg-amber-500 text-black' : 'bg-violet-600 text-white'
                  : isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {/* ══ CHECKLIST ══════════════════════════════════════════════════════ */}
        {tab === 'checklist' && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`font-bold text-lg ${textPrimary}`}>Checklist onboarding</h2>
                <p className={`text-sm ${textSecondary}`}>Suivi de l'intégration des nouveaux employés</p>
              </div>
              <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}
                className={`border rounded-xl px-4 py-2 text-sm focus:outline-none ${selectCls}`}>
                {employees.length === 0
                  ? <option value="">Aucun employé</option>
                  : employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
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
              const isOpen = openCats.includes(cat.category)
              return (
                <div key={cat.category} className={`border rounded-2xl overflow-hidden ${card}`}>
                  <button onClick={() => toggleCat(cat.category)}
                    className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${catHover}`}>
                    <div className="flex items-center gap-3">
                      <h3 className={`font-semibold ${textPrimary}`}>{cat.category}</h3>
                      <span className={`text-xs ${textSecondary}`}>{cat.items.filter(i => i.done).length}/{cat.items.length}</span>
                    </div>
                    {isOpen ? <ChevronUp className={`w-4 h-4 ${textSecondary}`} /> : <ChevronDown className={`w-4 h-4 ${textSecondary}`} />}
                  </button>
                  {isOpen && (
                    <div className={`border-t divide-y ${divider} ${rowDivide}`}>
                      {cat.items.map((item, ii) => (
                        <button key={item.id} onClick={() => toggleItem(ci, ii)}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors text-left ${rowHover}`}>
                          {item.done
                            ? <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
                            : <Square className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`} />}
                          <span className={`text-sm ${item.done ? 'text-zinc-400 line-through' : isDark ? 'text-zinc-200' : 'text-gray-700'}`}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ══ FICHE EMPLOYÉ ══════════════════════════════════════════════════ */}
        {tab === 'fiche' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h2 className={`font-bold text-lg ${textPrimary}`}>Fiche employé</h2>
                  <p className={`text-xs ${textSecondary}`}>État civil et informations RH — sauvegarde automatique à la sortie de chaque champ</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={ficheEmpId} onChange={e => setFicheEmpId(e.target.value)}
                  className={`border rounded-xl px-4 py-2 text-sm focus:outline-none ${selectCls}`}>
                  {employees.length === 0
                    ? <option value="">Aucun employé</option>
                    : employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>)}
                </select>
                {ficheEmpId && (
                  <button onClick={saveAll}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${profileSaved ? 'bg-green-500/20 text-green-400' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
                    <Save className="w-3.5 h-3.5" />
                    {profileSaved ? 'Enregistré !' : 'Tout enregistrer'}
                  </button>
                )}
              </div>
            </div>

            {ficheEmpId && (
              <div className="space-y-5">
                {/* Identité */}
                <div className={`border rounded-2xl p-5 ${card}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${textPrimary}`}>Identité</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <PF label="Prénom"           field="firstName"     profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                    <PF label="Nom"              field="lastName"      profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                    <PF label="Date de naissance" field="birthDate"    profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} type="date" />
                    <PF label="Lieu de naissance" field="birthPlace"   profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                    <PF label="Nationalité"      field="nationality"   profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${labelCls}`}>État civil</label>
                      <select
                        value={profile.maritalStatus}
                        onChange={e => { const v = e.target.value; setProfile(p => ({ ...p, maritalStatus: v })); Store.saveEmployeeProfile(ficheEmpId, { ...profile, maritalStatus: v }) }}
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none ${selectCls}`}>
                        <option value="">— Sélectionner —</option>
                        {['Célibataire', 'Marié(e)', 'Pacsé(e)', 'Divorcé(e)', 'Veuf/Veuve'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <PF label="NAS (Numéro d'assurance sociale)" field="sin"  profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} placeholder="XXX-XXX-XXX" />
                    <PF label="Téléphone"        field="phone"         profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                    <PF label="URL photo"         field="photo"        profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} placeholder="https://..." />
                  </div>
                </div>

                {/* Adresse */}
                <div className={`border rounded-2xl p-5 ${card}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${textPrimary}`}>Adresse</h3>
                  <div className="space-y-4">
                    <PF label="Adresse (numéro et rue)" field="address" profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                    <div className="grid grid-cols-3 gap-4">
                      <PF label="Ville"            field="city"       profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                      <PF label="Province / État"  field="province"   profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                      <PF label="Code postal"      field="postalCode" profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                    </div>
                  </div>
                </div>

                {/* Urgence */}
                <div className={`border rounded-2xl p-5 ${card}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${textPrimary}`}>Personne à contacter en cas d'urgence</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <PF label="Nom complet"  field="emergencyName"     profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                    <PF label="Téléphone"    field="emergencyPhone"    profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} />
                    <PF label="Relation"     field="emergencyRelation" profile={profile} onCommit={commitProfile} inputCls={inputCls} labelCls={labelCls} placeholder="Ex : Conjoint(e), Parent..." />
                  </div>
                </div>

                {/* Notes */}
                <div className={`border rounded-2xl p-5 ${card}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${textPrimary}`}>Notes internes</h3>
                  <NotesField value={profile.notes} onCommit={v => commitProfile('notes', v)} inputCls={inputCls} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ COMPTES ════════════════════════════════════════════════════════ */}
        {tab === 'comptes' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className={`font-bold text-lg ${textPrimary}`}>Comptes & Licences logiciels</h2>
                <p className={`text-xs ${textSecondary}`}>Sauvegarde automatique à la sortie de chaque champ</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={compteEmpId} onChange={e => setCompteEmpId(e.target.value)}
                  className={`border rounded-xl px-4 py-2 text-sm focus:outline-none ${selectCls}`}>
                  {employees.length === 0
                    ? <option value="">Aucun employé</option>
                    : employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>)}
                </select>
                {compteEmpId && (
                  <button onClick={addRow}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                )}
              </div>
            </div>

            {compteEmpId && (
              <div className={`border rounded-2xl overflow-hidden ${card}`}>
                <table className="w-full" style={{ borderColor: isDark ? '#27272a' : '#e5e7eb' }}>
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
                      <tr><td colSpan={6} className={`px-5 py-8 text-center text-sm ${textSecondary}`}>
                        Aucun logiciel enregistré — cliquez sur « Ajouter »
                      </td></tr>
                    )}
                    {software.map((row, idx) => (
                      <SoftwareRow
                        key={row._key}
                        rowKey={row._key}
                        initialRow={row}
                        inputCls={inputCls}
                        selectCls={selectCls}
                        textSecondary={textSecondary}
                        onSave={(updated) => saveRow(idx, updated)}
                        onDelete={() => deleteRow(idx)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ FREELANCE ════════════════════════════════════════════════════════ */}
        {tab === 'freelance' && (
          <div>
            {freelances.length === 0 ? (
              <div className={`border rounded-xl p-12 text-center ${card}`}>
                <div className={`text-sm ${textSecondary}`}>
                  Aucun compte Freelance créé.<br/>
                  Ajoutez un compte de type <span className="text-amber-400 font-semibold">Freelance</span> depuis la gestion des comptes.
                </div>
              </div>
            ) : (
              <div className="flex gap-5" style={{ minHeight: 480 }}>
                {/* Liste */}
                <div className={`border rounded-xl overflow-hidden flex-shrink-0 ${card}`} style={{ width: 240 }}>
                  <div className={`px-4 py-3 border-b text-xs font-semibold uppercase tracking-widest text-amber-400 ${divider}`}>
                    Freelances
                  </div>
                  {freelances.map(f => {
                    const m = Store.getFreelanceMission(f.id)
                    const isActive = freelanceId === f.id
                    return (
                      <button key={f.id} onClick={() => setFreelanceId(f.id)}
                        className={`w-full text-left px-4 py-3 border-b transition-colors ${divider} ${isActive ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' : isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'}`}>
                        <div className={`text-sm font-semibold ${isActive ? 'text-amber-400' : textPrimary}`}>{f.name}</div>
                        <div className={`text-xs font-mono ${textSecondary}`}>{f.id}</div>
                        {m.mission && <div className={`text-xs truncate mt-0.5 ${textSecondary}`}>{m.mission}</div>}
                        {m.startDate && m.endDate && (
                          <div className={`text-xs mt-0.5 ${textSecondary}`}>
                            {new Date(m.startDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            {' – '}
                            {new Date(m.endDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Fiche mission */}
                {freelanceId && (() => {
                  const fl = freelances.find(f => f.id === freelanceId)
                  if (!fl) return null
                  return (
                    <div className={`flex-1 border rounded-xl p-6 ${card}`}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className={`text-lg font-bold ${textPrimary}`}>{fl.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{fl.id}</span>
                            <span className="text-xs font-semibold text-amber-400">Freelance</span>
                          </div>
                        </div>
                        <button onClick={saveFreelance}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                            freelanceSaved
                              ? 'bg-green-500 text-white'
                              : 'bg-amber-500 hover:bg-amber-400 text-black'
                          }`}>
                          <Save size={14} />{freelanceSaved ? 'Sauvegardé !' : 'Enregistrer'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Mission */}
                        <div className="sm:col-span-2">
                          <label className={`block text-xs font-semibold mb-1.5 ${labelCls}`}>Mission / Description</label>
                          <textarea
                            value={freelanceForm.mission}
                            onChange={e => setFreelanceForm(f => ({ ...f, mission: e.target.value }))}
                            rows={3} placeholder="Décrire la mission du prestataire…"
                            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none ${inputCls}`}
                          />
                        </div>

                        {/* Dates */}
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${labelCls}`}>Date de début</label>
                          <input type="date" value={freelanceForm.startDate}
                            onChange={e => setFreelanceForm(f => ({ ...f, startDate: e.target.value }))}
                            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${inputCls}`} />
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${labelCls}`}>Date de fin</label>
                          <input type="date" value={freelanceForm.endDate}
                            onChange={e => setFreelanceForm(f => ({ ...f, endDate: e.target.value }))}
                            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${inputCls}`} />
                        </div>

                        {/* Durée calculée */}
                        {freelanceForm.startDate && freelanceForm.endDate && (() => {
                          const diff = Math.ceil((new Date(freelanceForm.endDate) - new Date(freelanceForm.startDate)) / 86400000)
                          return diff > 0 ? (
                            <div className={`sm:col-span-2 text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-50 text-gray-600'}`}>
                              Durée : <span className="font-bold">{diff} jour{diff > 1 ? 's' : ''}</span>
                            </div>
                          ) : null
                        })()}

                        {/* Montants */}
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${labelCls}`}>Montant HT (CAD)</label>
                          <input type="number" min="0" step="0.01" value={freelanceForm.amountHT}
                            onChange={e => setFreelanceForm(f => ({ ...f, amountHT: e.target.value }))}
                            placeholder="Ex : 2500.00"
                            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${inputCls}`} />
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${labelCls}`}>Taux de taxe (%)</label>
                          <input type="number" min="0" step="0.001" value={freelanceForm.taxRate}
                            onChange={e => setFreelanceForm(f => ({ ...f, taxRate: e.target.value }))}
                            placeholder="Ex : 14.975"
                            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${inputCls}`} />
                        </div>

                        {/* TTC auto */}
                        {freelanceTTC && (
                          <div className={`sm:col-span-2 flex items-center gap-4 px-4 py-3 rounded-xl border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                            <div>
                              <div className={`text-xs font-semibold ${textSecondary}`}>Montant TTC</div>
                              <div className="text-xl font-bold text-amber-400">
                                {parseFloat(freelanceTTC).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                              </div>
                            </div>
                            <div className={`ml-auto text-xs ${textSecondary}`}>
                              HT {parseFloat(freelanceForm.amountHT).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                              {' + taxes '}({freelanceForm.taxRate}%)
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div className="sm:col-span-2">
                          <label className={`block text-xs font-semibold mb-1.5 ${labelCls}`}>Notes internes</label>
                          <textarea
                            value={freelanceForm.notes}
                            onChange={e => setFreelanceForm(f => ({ ...f, notes: e.target.value }))}
                            rows={2} placeholder="Observations, clauses particulières, coordonnées…"
                            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none ${inputCls}`}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}

// ─── Profile field wrapper — own local state, commits on blur ─────────────────
function PF({ label, field, profile, onCommit, inputCls, labelCls, type = 'text', placeholder }) {
  const [val, setVal] = useState(profile[field] ?? '')
  // Sync when profile reloads (employee change)
  const prev = useRef(profile[field])
  if (prev.current !== profile[field]) { prev.current = profile[field]; setVal(profile[field] ?? '') }
  return (
    <div>
      <label className={`block text-xs font-medium mb-1.5 ${labelCls}`}>{label}</label>
      <input
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => onCommit(field, val)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none ${inputCls}`}
      />
    </div>
  )
}

// ─── Notes textarea — own local state ────────────────────────────────────────
function NotesField({ value, onCommit, inputCls }) {
  const [val, setVal] = useState(value ?? '')
  const prev = useRef(value)
  if (prev.current !== value) { prev.current = value; setVal(value ?? '') }
  return (
    <textarea
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => onCommit(val)}
      rows={4}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none ${inputCls}`}
      placeholder="Notes confidentielles sur cet employé..."
    />
  )
}
