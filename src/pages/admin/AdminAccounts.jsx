import React, { useState } from 'react'
import { Search, Plus, Mail, X, Eye, Ban, Trash2, UserCircle2, Briefcase, ChevronRight, Check, Copy, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { sendAccountCreatedEmail } from '../../utils/emailService'

const INITIAL_CLIENTS = [
  { id: 'LVL3C0001', email: 'client@test.fr', name: 'Thomas Martin', type: 'client', clientType: 'particulier', phone: '0612345678', created_at: '2024-06-01', suspended: false },
  { id: 'LVL3B0001', email: 'pro@company.fr', name: 'Société Media Pro', type: 'client', clientType: 'pro', phone: '0123456789', created_at: '2024-07-15', suspended: false },
]

const EMPLOYEE_ROLES = [
  {
    value: 'admin',
    label: 'Administrateur',
    description: 'Accès complet — tous les droits',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    value: 'chef_projet',
    label: 'Chef de projet',
    description: 'Attribue les projets aux techniciens',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    value: 'technicien',
    label: 'Technicien',
    description: 'Exécute les tâches assignées',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
]

const ROLE_DISPLAY = {
  admin: 'Administrateur',
  chef_projet: 'Chef de projet',
  technicien: 'Technicien',
}

export default function AdminAccounts() {
  const { theme } = useApp()
  const { impersonate } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const [tab, setTab] = useState('clients')
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState(INITIAL_CLIENTS)
  const [employees, setEmployees] = useState(Store.getEmployees())

  // Modal state
  const [modal, setModal] = useState(null) // null | 'choice' | 'client' | 'employee' | 'success'
  const [clientForm, setClientForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', company: '', tps: '', tvq: '', cgu: false })
  const [clientError, setClientError] = useState('')
  const [empForm, setEmpForm] = useState({ name: '', email: '', role: '', phone: '' })
  const [empError, setEmpError] = useState('')
  const [successInfo, setSuccessInfo] = useState(null) // { name, email, setUrl }
  const [copied, setCopied] = useState(false)

  const openModal = () => {
    setClientForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', company: '', tps: '', tvq: '', cgu: false })
    setClientError('')
    setEmpForm({ name: '', email: '', role: '', phone: '' })
    setEmpError('')
    setModal('choice')
  }
  const closeModal = () => setModal(null)

  const handleImpersonate = (account) => {
    const isEmployee = account.type === 'employee' || (!account.type && account.role)
    const normalized = { ...account, type: isEmployee ? 'employee' : 'client' }
    impersonate(normalized)
    if (!isEmployee) return navigate('/client/dashboard')
    if (normalized.roleKey === 'chef_projet' || normalized.role === 'Chef de projet') return navigate('/chef/dashboard')
    navigate('/employee/dashboard')
  }

  const toggleSuspend = (id, isEmployee) => {
    if (isEmployee) {
      const emp = employees.find(e => e.id === id)
      Store.updateEmployee(id, { active: !emp.active })
      setEmployees(Store.getEmployees())
    } else {
      setClients(prev => prev.map(c => c.id === id ? { ...c, suspended: !c.suspended } : c))
    }
  }

  const handleDelete = (id, isEmployee) => {
    if (!confirm('Supprimer ce compte définitivement ?')) return
    if (isEmployee) {
      Store.updateEmployee(id, { active: false, deleted: true })
      setEmployees(Store.getEmployees().filter(e => !e.deleted))
    } else {
      setClients(prev => prev.filter(c => c.id !== id))
    }
  }

  const submitClient = async (e) => {
    e.preventDefault()
    setClientError('')
    if (!clientForm.cgu) return setClientError('Veuillez accepter les conditions générales.')
    const clientType = (clientForm.tps || clientForm.tvq) ? 'pro' : 'particulier'
    const name = `${clientForm.firstName} ${clientForm.lastName}`.trim()
    const account = Store.addAccount({
      email: clientForm.email,
      name,
      type: 'client',
      clientType,
      company: clientForm.company || null,
      tps: clientForm.tps || null,
      tvq: clientForm.tvq || null,
    })
    const token = Store.createPwdToken(account.id, clientForm.email, name, 'client')
    const result = await sendAccountCreatedEmail({ name, email: clientForm.email, token, accountType: 'client' })
    fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: account.id,
        name,
        email: clientForm.email,
        type: 'client',
        clientType,
        company: clientForm.company || null,
        tps: clientForm.tps || null,
        tvq: clientForm.tvq || null,
        phone: '',
        created_at: new Date().toISOString(),
      }),
    }).catch(() => {})
    setClients(prev => [...prev, {
      id: account.id,
      email: clientForm.email,
      name,
      type: 'client',
      clientType,
      company: clientForm.company || null,
      phone: '',
      created_at: new Date().toISOString().split('T')[0],
      suspended: false,
    }])
    setSuccessInfo({ name, email: clientForm.email, setUrl: result.setUrl })
    setModal('success')
    setTab('clients')
  }

  const submitEmployee = async (e) => {
    e.preventDefault()
    setEmpError('')
    if (!empForm.role) return setEmpError('Veuillez sélectionner un rôle.')
    const roleName = ROLE_DISPLAY[empForm.role] || empForm.role
    const emp = Store.addEmployee({
      name: empForm.name,
      email: empForm.email,
      role: roleName,
      roleKey: empForm.role,
      phone: empForm.phone,
      active: true,
      joined_at: new Date().toISOString().split('T')[0],
    })
    Store.addAccount({
      id: emp.id,
      email: empForm.email,
      name: empForm.name,
      type: 'employee',
      role: roleName,
      roleKey: empForm.role,
    })
    const token = Store.createPwdToken(emp.id, empForm.email, empForm.name, 'employee')
    const result = await sendAccountCreatedEmail({ name: empForm.name, email: empForm.email, token, accountType: 'employee' })
    const ROLE_PERMISSIONS = {
      admin:       ['dashboard', 'calendar', 'reservations', 'projects', 'rushes', 'messaging', 'accounts', 'sav', 'promo', 'check', 'boarding', 'manual', 'tool'],
      chef_projet: ['dashboard', 'calendar', 'reservations', 'booking', 'projects', 'rushes', 'messaging', 'alerts', 'library'],
      technicien:  ['dashboard', 'projects', 'messaging', 'check', 'calendar', 'leave', 'alerts', 'rushes'],
    }
    fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: emp.id,
        name: empForm.name,
        email: empForm.email,
        role: roleName,
        roleKey: empForm.role,
        phone: empForm.phone || null,
        type: 'employee',
        permissions: ROLE_PERMISSIONS[empForm.role] || [],
        dashboard: empForm.role === 'chef_projet' ? '/chef/dashboard' : '/employee/dashboard',
        created_at: new Date().toISOString(),
      }),
    }).catch(() => {})
    setEmployees(Store.getEmployees())
    setSuccessInfo({ name: empForm.name, email: empForm.email, setUrl: result.setUrl })
    setModal('success')
    setTab('employees')
  }

  const copyLink = () => {
    if (!successInfo?.setUrl) return
    navigator.clipboard.writeText(successInfo.setUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Styles
  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const inputCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const tableRow = isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-gray-100 hover:bg-gray-50'
  const tableHead = isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'
  const modalBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-xl'
  const labelCls = isDark ? 'text-zinc-400' : 'text-gray-600'
  const btnSecondary = isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )
  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout navItems={ADMIN_NAV} title="Comptes">
      <div className="space-y-6">

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setTab('clients')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'clients' ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Clients ({clients.length})
            </button>
            <button onClick={() => setTab('employees')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'employees' ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Employés ({employees.length})
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full sm:w-60 border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
                placeholder="Rechercher..."
              />
            </div>
            <button onClick={openModal} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4" /> Créer un compte
            </button>
          </div>
        </div>

        {/* Clients table */}
        {tab === 'clients' && (
          <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${tableHead}`}>
                  <th className="text-left text-xs font-semibold px-5 py-3">Nom</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden lg:table-cell">ID</th>
                  <th className="text-right text-xs font-semibold px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(c => (
                  <tr key={c.id} className={`border-b transition-colors ${tableRow}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-100 text-gray-600'}`}>{c.name.charAt(0)}</div>
                        <div>
                          <div className={`text-sm font-medium ${textPrimary}`}>{c.name}</div>
                          <div className={`text-xs sm:hidden ${textSecondary}`}>{c.email}</div>
                        </div>
                        {c.suspended && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium">Suspendu</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={`text-sm flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}><Mail className={`w-3.5 h-3.5 ${textSecondary}`} />{c.email}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${c.clientType === 'pro' ? 'bg-purple-500/10 text-purple-400' : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-100 text-gray-600'}`}>
                        {c.clientType === 'pro' ? 'Professionnel' : 'Particulier'}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 hidden lg:table-cell text-xs font-mono ${textSecondary}`}>{c.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleImpersonate(c)} title="Voir en tant que" className="p-1.5 rounded-lg transition-colors text-blue-400 hover:bg-blue-500/10"><Eye size={15} /></button>
                        <button onClick={() => toggleSuspend(c.id, false)} title={c.suspended ? 'Réactiver' : 'Suspendre'} className={`p-1.5 rounded-lg transition-colors ${c.suspended ? 'text-green-400 hover:bg-green-500/10' : 'text-orange-400 hover:bg-orange-500/10'}`}><Ban size={15} /></button>
                        <button onClick={() => handleDelete(c.id, false)} title="Supprimer" className="p-1.5 rounded-lg transition-colors text-red-400 hover:bg-red-500/10"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Employees table */}
        {tab === 'employees' && (
          <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${tableHead}`}>
                  <th className="text-left text-xs font-semibold px-5 py-3">Nom</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden md:table-cell">Rôle</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden lg:table-cell">Téléphone</th>
                  <th className="text-right text-xs font-semibold px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(e => (
                  <tr key={e.id} className={`border-b transition-colors ${tableRow}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-blue-400">{e.name.charAt(0)}</div>
                        <div>
                          <div className={`text-sm font-medium ${textPrimary}`}>{e.name}</div>
                          <div className={`text-xs sm:hidden ${textSecondary}`}>{e.email}</div>
                        </div>
                        {!e.active && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium">Suspendu</span>}
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 hidden sm:table-cell text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{e.email}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-medium">{e.role}</span>
                    </td>
                    <td className={`px-5 py-3.5 hidden lg:table-cell text-sm ${textSecondary}`}>{e.phone}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleImpersonate(e)} title="Voir en tant que" className="p-1.5 rounded-lg transition-colors text-blue-400 hover:bg-blue-500/10"><Eye size={15} /></button>
                        <button onClick={() => toggleSuspend(e.id, true)} title={e.active ? 'Suspendre' : 'Réactiver'} className={`p-1.5 rounded-lg transition-colors ${!e.active ? 'text-green-400 hover:bg-green-500/10' : 'text-orange-400 hover:bg-orange-500/10'}`}><Ban size={15} /></button>
                        <button onClick={() => handleDelete(e.id, true)} title="Supprimer" className="p-1.5 rounded-lg transition-colors text-red-400 hover:bg-red-500/10"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal overlay ── */}
      {modal && (
        <div className="fixed inset-0 overflow-y-auto z-50" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="flex items-center justify-center min-h-full p-4">

            {/* ── CHOICE ── */}
            {modal === 'choice' && (
              <div className={`border rounded-2xl w-full max-w-md p-6 my-4 ${modalBg}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-bold ${textPrimary}`}>Créer un compte</h3>
                  <button onClick={closeModal} className={`${textSecondary} hover:${textPrimary}`}><X className="w-5 h-5" /></button>
                </div>
                <p className={`text-sm mb-5 ${textSecondary}`}>Quel type de compte souhaitez-vous créer ?</p>
                <div className="space-y-3">
                  <button
                    onClick={() => setModal('client')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:border-violet-500 group ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                      <UserCircle2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm ${textPrimary}`}>Compte Client</div>
                      <div className={`text-xs mt-0.5 ${textSecondary}`}>Particulier ou professionnel, accès à la réservation</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${textSecondary} group-hover:text-violet-400 transition-colors`} />
                  </button>
                  <button
                    onClick={() => setModal('employee')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:border-violet-500 group ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm ${textPrimary}`}>Compte Employé</div>
                      <div className={`text-xs mt-0.5 ${textSecondary}`}>Administrateur, chef de projet ou technicien</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${textSecondary} group-hover:text-violet-400 transition-colors`} />
                  </button>
                </div>
              </div>
            )}

            {/* ── CLIENT FORM ── */}
            {modal === 'client' && (
              <div className={`border rounded-2xl w-full max-w-md my-4 ${modalBg}`}>
                <div className="flex items-center justify-between px-6 pt-6 pb-5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModal('choice')} className={`${textSecondary} hover:${textPrimary} mr-1`}>
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <h3 className={`text-lg font-bold ${textPrimary}`}>Compte Client</h3>
                  </div>
                  <button onClick={closeModal} className={`${textSecondary} hover:${textPrimary}`}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={submitClient} className="px-6 pb-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Prénom <span className="text-red-400">*</span></label>
                      <input value={clientForm.firstName} onChange={e => setClientForm(f => ({ ...f, firstName: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} required />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Nom <span className="text-red-400">*</span></label>
                      <input value={clientForm.lastName} onChange={e => setClientForm(f => ({ ...f, lastName: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} required />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Email <span className="text-red-400">*</span></label>
                    <input type="email" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Mot de passe <span className="text-red-400">*</span></label>
                      <input type="password" value={clientForm.password} onChange={e => setClientForm(f => ({ ...f, password: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} required />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Confirmer <span className="text-red-400">*</span></label>
                      <input type="password" value={clientForm.confirmPassword} onChange={e => setClientForm(f => ({ ...f, confirmPassword: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} required />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Nom d'entreprise <span className={`text-xs font-normal ${textSecondary}`}>(optionnel)</span></label>
                    <input value={clientForm.company} onChange={e => setClientForm(f => ({ ...f, company: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Numéro TPS <span className={`text-xs font-normal ${textSecondary}`}>(optionnel)</span></label>
                      <input value={clientForm.tps} onChange={e => setClientForm(f => ({ ...f, tps: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Numéro TVQ <span className={`text-xs font-normal ${textSecondary}`}>(optionnel)</span></label>
                      <input value={clientForm.tvq} onChange={e => setClientForm(f => ({ ...f, tvq: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} />
                    </div>
                  </div>
                  {(clientForm.tps || clientForm.tvq) && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Check size={13} className="text-purple-400 flex-shrink-0" />
                      <span className="text-xs text-purple-400 font-medium">Compte Professionnel détecté</span>
                    </div>
                  )}
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={clientForm.cgu} onChange={e => setClientForm(f => ({ ...f, cgu: e.target.checked }))} className="mt-0.5 rounded accent-violet-600" />
                    <span className={`text-xs leading-relaxed ${textSecondary}`}>
                      J'accepte les <span className="text-violet-400 underline cursor-pointer">conditions générales d'utilisation</span>
                    </span>
                  </label>
                  {clientError && <p className="text-xs text-red-400 font-medium">{clientError}</p>}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setModal('choice')} className={`flex-1 border rounded-xl py-2.5 text-sm transition-colors ${btnSecondary}`}>Retour</button>
                    <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">Créer le compte</button>
                  </div>
                </form>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {modal === 'success' && successInfo && (
              <div className={`border rounded-2xl w-full max-w-md p-6 my-4 ${modalBg}`}>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-green-400" />
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${textPrimary}`}>Compte créé</h3>
                  <p className={`text-sm ${textSecondary}`}>Un email a été envoyé à <strong className={textPrimary}>{successInfo.email}</strong> avec un lien pour créer son mot de passe.</p>
                </div>
                {successInfo.setUrl && (
                  <div className={`rounded-xl border p-4 mb-4 ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textSecondary}`}>Lien de création de mot de passe</p>
                    <p className={`text-xs break-all mb-3 ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{successInfo.setUrl}</p>
                    <button
                      onClick={copyLink}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${copied ? 'bg-green-500/10 text-green-400' : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'}`}
                    >
                      {copied ? <><CheckCheck size={13} /> Copié !</> : <><Copy size={13} /> Copier le lien</>}
                    </button>
                  </div>
                )}
                <button onClick={closeModal} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">
                  Fermer
                </button>
              </div>
            )}

            {/* ── EMPLOYEE FORM ── */}
            {modal === 'employee' && (
              <div className={`border rounded-2xl w-full max-w-md my-4 ${modalBg}`}>
                <div className="flex items-center justify-between px-6 pt-6 pb-5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModal('choice')} className={`${textSecondary} hover:${textPrimary} mr-1`}>
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <h3 className={`text-lg font-bold ${textPrimary}`}>Compte Employé</h3>
                  </div>
                  <button onClick={closeModal} className={`${textSecondary} hover:${textPrimary}`}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={submitEmployee} className="px-6 pb-6 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Nom complet <span className="text-red-400">*</span></label>
                    <input value={empForm.name} onChange={e => setEmpForm(f => ({ ...f, name: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} required />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Email <span className="text-red-400">*</span></label>
                    <input type="email" value={empForm.email} onChange={e => setEmpForm(f => ({ ...f, email: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} required />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${labelCls}`}>Rôle <span className="text-red-400">*</span></label>
                    <div className="space-y-2">
                      {EMPLOYEE_ROLES.map(r => (
                        <label key={r.value} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${empForm.role === r.value ? 'border-violet-500 bg-violet-500/10' : isDark ? 'border-zinc-700 hover:border-zinc-600' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="role" value={r.value} checked={empForm.role === r.value} onChange={() => setEmpForm(f => ({ ...f, role: r.value }))} className="sr-only" />
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${empForm.role === r.value ? 'bg-violet-400' : isDark ? 'bg-zinc-600' : 'bg-gray-300'}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold ${empForm.role === r.value ? 'text-violet-300' : textPrimary}`}>{r.label}</div>
                            <div className={`text-xs mt-0.5 ${textSecondary}`}>{r.description}</div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.bg} ${r.color}`}>{r.label.split(' ')[0]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Téléphone <span className={`text-xs font-normal ${textSecondary}`}>(optionnel)</span></label>
                    <input value={empForm.phone} onChange={e => setEmpForm(f => ({ ...f, phone: e.target.value }))} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} />
                  </div>
                  {empError && <p className="text-xs text-red-400 font-medium">{empError}</p>}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setModal('choice')} className={`flex-1 border rounded-xl py-2.5 text-sm transition-colors ${btnSecondary}`}>Retour</button>
                    <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">Créer le compte</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </Layout>
  )
}
