import React, { useState, useEffect, useRef } from 'react'
import { Plus, X, ArrowRightLeft } from 'lucide-react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'

const PROD_COLUMNS = ['Booking','Todo','En ligne','Pré à faire','Retour de livraison','En cours','Export','Level OK','Montage','Argent Livré','Annulé','Absent','Problème']
const POST_COLUMNS = ['En attente de brief','Assigné Monteur','En cours','Retour','V1','V2','V3','Level OK','Problème']
const STUDIOS = ['Tous', 'Studio A', 'Studio B', 'Studio C']

const STATUS_COLORS = {
  'En cours':     'bg-blue-500/20 text-blue-400',
  'Argent Livré': 'bg-green-500/20 text-green-400',
  'Annulé':       'bg-red-500/20 text-red-400',
  'Problème':     'bg-red-600/20 text-red-500',
  'Absent':       'bg-gray-500/20 text-gray-400',
  'Level OK':     'bg-cyan-500/20 text-cyan-400',
  'Export':       'bg-indigo-500/20 text-indigo-400',
  'Retour':       'bg-orange-500/20 text-orange-400',
}

export default function ChefProjects() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [mode, setMode] = useState('PROD')
  const [studioFilter, setStudioFilter] = useState('Tous')
  const [techFilter, setTechFilter] = useState('')
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ title: '', client_name: '', client_email: '', studio: 'Studio A', status: 'Booking', assigned_to: '', pipeline: 'PROD' })

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  useEffect(() => {
    // Auto-promote Booking → Todo for today's reservations
    const today = new Date().toISOString().split('T')[0]
    Store.getProjects().forEach(p => {
      if (p.status === 'Booking' && p.date === today) {
        Store.updateProject(p.id, { status: 'Todo' })
      }
    })
    setProjects(Store.getProjects())
    setEmployees(Store.getEmployees())
  }, [])

  const columns = mode === 'PROD' ? PROD_COLUMNS : POST_COLUMNS

  const filtered = projects.filter(p => {
    if (p.pipeline && p.pipeline !== mode && p.pipeline !== 'Alpha') {
      // Only show matching pipeline, but don't hide projects without pipeline set
    }
    if (studioFilter !== 'Tous' && p.studio !== studioFilter) return false
    if (techFilter && p.assigned_to !== techFilter) return false
    return true
  })

  function moveCard(project, targetCol) {
    const updates = { status: targetCol }
    if (targetCol === 'Retour' || targetCol === 'Montage') {
      updates.status = targetCol === 'Montage' ? 'En attente de brief' : 'Retour'
      updates.pipeline = 'POST'
    }
    Store.updateProject(project.id, updates)
    setProjects(Store.getProjects())
    if (selectedCard?.id === project.id) setSelectedCard({ ...project, ...updates })
    if (targetCol === 'Retour' || targetCol === 'Montage') setMode('POST')
  }

  function handleAdd(e) {
    e.preventDefault()
    Store.addProject({ ...addForm, pipeline: mode })
    setProjects(Store.getProjects())
    setShowAddModal(false)
    setAddForm({ title: '', client_name: '', client_email: '', studio: 'Studio A', status: columns[0], assigned_to: '', pipeline: mode })
  }

  return (
    <Layout navItems={CHEF_NAV} title="Projets">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={cn('flex rounded-xl overflow-hidden border', isDark ? 'border-zinc-700' : 'border-gray-300')}>
            {['PROD', 'POST'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn('px-4 py-2 text-sm font-semibold transition-colors',
                  mode === m ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-900'
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <select
            value={studioFilter}
            onChange={e => setStudioFilter(e.target.value)}
            className={cn('px-3 py-2 rounded-xl text-sm border', inputClass)}
          >
            {STUDIOS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            value={techFilter}
            onChange={e => setTechFilter(e.target.value)}
            className={cn('px-3 py-2 rounded-xl text-sm border', inputClass)}
          >
            <option value="">Tous les techniciens</option>
            {employees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-auto flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>

        {/* Kanban board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3" style={{ minWidth: `${columns.length * 220}px` }}>
            {columns.map(col => {
              const colProjects = filtered.filter(p => p.status === col)
              return (
                <div key={col} className={cn('rounded-2xl border p-3 flex-shrink-0', isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-gray-50 border-gray-200')} style={{ width: 210 }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn('text-xs font-semibold uppercase tracking-wide', textSecondary)}>{col}</span>
                    <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full', STATUS_COLORS[col] || 'bg-zinc-500/20 text-zinc-400')}>
                      {colProjects.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {colProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedCard(p)}
                        className={cn('border rounded-xl p-3 cursor-pointer transition-all', card, isDark ? 'hover:border-violet-600' : 'hover:border-violet-400')}
                      >
                        <div className={cn('text-xs font-semibold mb-1 truncate', textPrimary)}>{p.title}</div>
                        <div className={cn('text-[10px] mb-2', textSecondary)}>{p.client_name}</div>
                        {p.studio && (
                          <div className={cn('text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 inline-block mb-1')}>{p.studio}</div>
                        )}
                        {p.date && (
                          <div className={cn('text-[10px] mb-1', textSecondary)}>
                            {p.date}{p.start_time ? ` · ${p.start_time}` : ''}{p.end_time ? `–${p.end_time}` : ''}
                          </div>
                        )}
                        {p.assigned_to && (
                          <div className={cn('text-[10px]', textSecondary)}>
                            {employees.find(e => e.email === p.assigned_to)?.name || p.assigned_to}
                          </div>
                        )}
                        {/* Move to any column */}
                        <div className="mt-2 space-y-1.5" onClick={e => e.stopPropagation()}>
                          <select
                            value={p.status}
                            onChange={e => moveCard(p, e.target.value)}
                            className={cn('w-full text-[10px] px-1.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-500', isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-50 border-gray-200 text-gray-600')}
                          >
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            {mode === 'PROD' && <option value="Retour">↳ Retour (POST)</option>}
                          </select>
                          <select
                            value={p.assigned_to || ''}
                            onChange={e => {
                              Store.updateProject(p.id, { assigned_to: e.target.value })
                              setProjects(Store.getProjects())
                            }}
                            className={cn('w-full text-[10px] px-1.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-500', isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-50 border-gray-200 text-gray-600')}
                          >
                            <option value="">— Assigner</option>
                            {employees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Card detail modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedCard(null)}>
          <div
            className={cn('w-full max-w-md rounded-2xl p-6 space-y-4', isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200 shadow-xl')}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className={cn('font-bold text-lg', textPrimary)}>{selectedCard.title}</h3>
              <button onClick={() => setSelectedCard(null)} className={textSecondary}><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {[
                ['Client', selectedCard.client_name],
                ['Email', selectedCard.client_email],
                ['Studio', selectedCard.studio],
                ['Statut', selectedCard.status],
                ['Pipeline', selectedCard.pipeline || mode],
                ['Technicien', employees.find(e => e.email === selectedCard.assigned_to)?.name || selectedCard.assigned_to || '—'],
                ['Fichiers', selectedCard.files?.length ? `${selectedCard.files.length} fichier(s)` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className={cn('text-xs w-24 flex-shrink-0 mt-0.5', textSecondary)}>{label}</span>
                  <span className={cn('text-sm font-medium', textPrimary)}>{value}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 space-y-3">
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                  <ArrowRightLeft size={11} className="inline mr-1" />
                  Déplacer vers
                </label>
                <select
                  value={selectedCard.status}
                  onChange={e => moveCard(selectedCard, e.target.value)}
                  className={cn('w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500', inputClass)}
                >
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  {mode === 'PROD' && <option value="Retour">↳ Retour (POST)</option>}
                </select>
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Assigner à</label>
                <select
                  value={selectedCard.assigned_to || ''}
                  onChange={e => {
                    Store.updateProject(selectedCard.id, { assigned_to: e.target.value })
                    setProjects(Store.getProjects())
                    setSelectedCard({ ...selectedCard, assigned_to: e.target.value })
                  }}
                  className={cn('w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500', inputClass)}
                >
                  <option value="">— Non assigné</option>
                  {employees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add project modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowAddModal(false)}>
          <div
            className={cn('w-full max-w-md rounded-2xl p-6 space-y-4', isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200 shadow-xl')}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className={cn('font-bold text-lg', textPrimary)}>Nouveau projet</h3>
              <button onClick={() => setShowAddModal(false)} className={textSecondary}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              {[
                { label: 'Titre *', key: 'title', placeholder: 'Nom du projet' },
                { label: 'Nom client', key: 'client_name', placeholder: 'Prénom Nom' },
                { label: 'Email client', key: 'client_email', placeholder: 'email@exemple.fr' },
              ].map(f => (
                <div key={f.key}>
                  <label className={cn('block text-xs font-medium mb-1', textPrimary)}>{f.label}</label>
                  <input
                    type="text"
                    value={addForm[f.key]}
                    onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className={cn('w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500', inputClass)}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn('block text-xs font-medium mb-1', textPrimary)}>Studio</label>
                  <select value={addForm.studio} onChange={e => setAddForm(p => ({ ...p, studio: e.target.value }))} className={cn('w-full px-3 py-2 text-sm rounded-xl border', inputClass)}>
                    {['Studio A','Studio B','Studio C'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cn('block text-xs font-medium mb-1', textPrimary)}>Colonne</label>
                  <select value={addForm.status} onChange={e => setAddForm(p => ({ ...p, status: e.target.value }))} className={cn('w-full px-3 py-2 text-sm rounded-xl border', inputClass)}>
                    {columns.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1', textPrimary)}>Technicien</label>
                <select value={addForm.assigned_to} onChange={e => setAddForm(p => ({ ...p, assigned_to: e.target.value }))} className={cn('w-full px-3 py-2 text-sm rounded-xl border', inputClass)}>
                  <option value="">— Non assigné</option>
                  {employees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Créer le projet
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
