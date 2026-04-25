import React, { useState, useEffect, useRef } from 'react'
import { Plus, X, ArrowRightLeft, UserCheck, Trash2, RotateCcw } from 'lucide-react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'

const PROD_COLUMNS = ['Booking','Today','En cours','Export','Essentiel Livré','Pré à faire','Montage','Argent Livré','Retour de livraison','Level OK','Annulé','Absent','Problème']
const POST_COLUMNS = ['En attente de brief','Assigné Monteur','En cours','Retour','V1','V2','V3','Level OK','Problème']
const STUDIOS = ['Tous', 'Studio A', 'Studio B', 'Studio C']

const STATUS_COLORS = {
  'Today':              'bg-violet-500/20 text-violet-400',
  'En cours':           'bg-blue-500/20 text-blue-400',
  'Export':             'bg-indigo-500/20 text-indigo-400',
  'Essentiel Livré':    'bg-teal-500/20 text-teal-400',
  'Argent Livré':       'bg-green-500/20 text-green-400',
  'Retour de livraison':'bg-orange-500/20 text-orange-400',
  'Level OK':           'bg-cyan-500/20 text-cyan-400',
  'Annulé':             'bg-red-500/20 text-red-400',
  'Absent':             'bg-gray-500/20 text-gray-400',
  'Problème':           'bg-red-600/20 text-red-500',
  'Retour':             'bg-orange-500/20 text-orange-400',
  'Supprimé':           'bg-zinc-600/20 text-zinc-500',
}

export default function ChefProjects() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [mode, setMode] = useState('PROD')
  const [subView, setSubView] = useState('actif')
  const [studioFilter, setStudioFilter] = useState('Tous')
  const [techFilter, setTechFilter] = useState('')
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [addForm, setAddForm] = useState({ title: '', client_name: '', client_email: '', studio: 'Studio A', status: 'Booking', assigned_to: '', pipeline: 'PROD' })

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Store.getProjects().forEach(p => {
      if (p.status === 'Booking' && p.date === today) Store.updateProject(p.id, { status: 'Today' })
    })
    setProjects(Store.getProjects())
    const fromEmp = Store.getEmployees()
    const fromAcc = Store.getAccounts().filter(a =>
      a.type === 'employee' || ['worker', 'chef_projet', 'admin'].includes(a.roleKey)
    )
    const merged = [...fromEmp]
    for (const a of fromAcc) {
      if (!merged.find(e => e.email === a.email))
        merged.push({ id: a.id, email: a.email, name: a.name, role: a.role, roleKey: a.roleKey })
    }
    setEmployees(merged)
  }, [])

  const columns = mode === 'PROD' ? PROD_COLUMNS : POST_COLUMNS

  const filtered = projects.filter(p => {
    if (subView === 'supprime') return p.status === 'Supprimé'
    if (p.status === 'Supprimé') return false
    if (studioFilter !== 'Tous' && p.studio !== studioFilter) return false
    if (techFilter && p.assigned_to !== techFilter) return false
    return true
  })

  const deletedCount = projects.filter(p => p.status === 'Supprimé').length

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

  function confirmTrash(project) {
    setDeleteConfirm(project)
  }

  function doTrash() {
    if (!deleteConfirm) return
    Store.updateProject(deleteConfirm.id, { status: 'Supprimé' })
    setProjects(Store.getProjects())
    setDeleteConfirm(null)
    if (selectedCard?.id === deleteConfirm.id) setSelectedCard(null)
  }

  function restoreProject(project) {
    Store.updateProject(project.id, { status: 'Booking' })
    setProjects(Store.getProjects())
  }

  return (
    <Layout navItems={CHEF_NAV} title="Projets">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Pipeline toggle */}
          <div className={cn('flex rounded-xl overflow-hidden border', isDark ? 'border-zinc-700' : 'border-gray-300')}>
            {['PROD', 'POST'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setSubView('actif') }}
                className={cn('px-4 py-2 text-sm font-semibold transition-colors',
                  mode === m && subView === 'actif' ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-900'
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Supprimé sub-tab */}
          <button
            onClick={() => setSubView(v => v === 'supprime' ? 'actif' : 'supprime')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors',
              subView === 'supprime'
                ? 'bg-zinc-600 text-white border-zinc-600'
                : isDark
                  ? 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
                  : 'border-gray-200 text-gray-500 hover:text-gray-700'
            )}
          >
            <Trash2 size={12} />
            Supprimé
            {deletedCount > 0 && (
              <span className={cn('ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                subView === 'supprime' ? 'bg-white/20 text-white' : 'bg-zinc-500/20 text-zinc-400'
              )}>
                {deletedCount}
              </span>
            )}
          </button>

          {subView === 'actif' && (
            <>
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
            </>
          )}
        </div>

        {/* Supprimé view */}
        {subView === 'supprime' && (
          <div>
            {filtered.length === 0 ? (
              <div className={cn('rounded-2xl border p-12 text-center', isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-gray-50 border-gray-200')}>
                <Trash2 size={32} className={cn('mx-auto mb-3', textSecondary)} />
                <p className={cn('text-sm font-medium', textSecondary)}>Aucun projet supprimé</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map(p => (
                  <div
                    key={p.id}
                    className={cn('border rounded-xl p-3 opacity-70', card)}
                  >
                    <div className={cn('text-xs font-semibold truncate mb-1', textPrimary)}>{p.title}</div>
                    <div className={cn('text-[10px] mb-2', textSecondary)}>{p.client_name}</div>
                    {p.studio && (
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400 inline-block mb-1">{p.studio}</div>
                    )}
                    {p.date && (
                      <div className={cn('text-[10px] mb-2', textSecondary)}>{p.date}{p.start_time ? ` · ${p.start_time}` : ''}</div>
                    )}
                    <button
                      onClick={() => restoreProject(p)}
                      className={cn('w-full flex items-center justify-center gap-1.5 text-[10px] font-semibold px-2 py-1.5 rounded-lg border transition-colors',
                        isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <RotateCcw size={10} /> Restaurer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kanban board (actif view) */}
        {subView === 'actif' && (
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
                          {/* Title row with trash */}
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className={cn('text-xs font-semibold truncate', textPrimary)}>{p.title}</div>
                            <button
                              onClick={e => { e.stopPropagation(); confirmTrash(p) }}
                              className={cn('p-0.5 rounded flex-shrink-0 hover:opacity-80 transition-opacity', isDark ? 'text-zinc-600 hover:text-red-400' : 'text-gray-300 hover:text-red-400')}
                              title="Supprimer la carte"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className={cn('text-[10px] mb-2', textSecondary)}>{p.client_name}</div>
                          {p.studio && (
                            <div className={cn('text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 inline-block mb-1')}>{p.studio}</div>
                          )}
                          {p.date && (
                            <div className={cn('text-[10px] mb-1', textSecondary)}>
                              {p.date}{p.start_time ? ` · ${p.start_time}` : ''}{p.end_time ? `–${p.end_time}` : ''}
                            </div>
                          )}
                          <div className="mt-2 space-y-1.5" onClick={e => e.stopPropagation()}>
                            <select
                              value={p.status}
                              onChange={e => moveCard(p, e.target.value)}
                              className={cn('w-full text-[10px] px-1.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-500', isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-50 border-gray-200 text-gray-600')}
                            >
                              {columns.map(c => <option key={c} value={c}>{c}</option>)}
                              {mode === 'PROD' && <option value="Retour">↳ Retour (POST)</option>}
                            </select>
                            <div className={cn('flex items-center gap-1 rounded-lg border overflow-hidden', isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
                              <UserCheck size={10} className={p.assigned_to ? 'text-violet-400 ml-1.5 flex-shrink-0' : (isDark ? 'text-zinc-600 ml-1.5 flex-shrink-0' : 'text-gray-400 ml-1.5 flex-shrink-0')} />
                              <select
                                value={p.assigned_to || ''}
                                onChange={e => {
                                  Store.updateProject(p.id, { assigned_to: e.target.value })
                                  setProjects(Store.getProjects())
                                }}
                                className={cn('w-full text-[10px] px-1 py-1 bg-transparent cursor-pointer focus:outline-none', p.assigned_to ? (isDark ? 'text-violet-300 font-semibold' : 'text-violet-600 font-semibold') : (isDark ? 'text-zinc-400' : 'text-gray-500'))}
                              >
                                <option value="">— Assigner</option>
                                {employees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { confirmTrash(selectedCard); setSelectedCard(null) }}
                  className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50')}
                  title="Supprimer la carte"
                >
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setSelectedCard(null)} className={textSecondary}><X size={18} /></button>
              </div>
            </div>
            <div className="space-y-2">
              {[
                ['Client', selectedCard.client_name],
                ['Email', selectedCard.client_email],
                ['Studio', selectedCard.studio],
                ['Date', selectedCard.date || '—'],
                ['Horaire', selectedCard.start_time ? `${selectedCard.start_time}${selectedCard.end_time ? `–${selectedCard.end_time}` : ''}` : '—'],
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

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className={cn('w-full max-w-sm rounded-2xl p-6 space-y-4', isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200 shadow-xl')}>
            <div className="flex items-start gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-red-500/10' : 'bg-red-50')}>
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className={cn('font-semibold text-sm mb-1', textPrimary)}>Supprimer la carte projet ?</h3>
                <p className={cn('text-xs', textSecondary)}>
                  La carte <span className="font-medium">{deleteConfirm.title}</span> sera déplacée dans l'onglet Supprimé. Elle pourra être restaurée à tout moment.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors', isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}
              >
                Annuler
              </button>
              <button
                onClick={doTrash}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
