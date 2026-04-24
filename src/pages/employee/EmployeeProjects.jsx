import React, { useState, useEffect, useRef } from 'react'
import { X, ArrowRightLeft, MessageCircle } from 'lucide-react'
import Layout from '../../components/Layout'
import { EMPLOYEE_NAV } from './EmployeeDashboard'
import { Store } from '../../data/store'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'
import ProjectCommentsModal from '../../components/ProjectCommentsModal'

// Columns visible to ALL employees regardless of assignment
const PUBLIC_COLS = new Set(['Booking', 'Todo'])

const PROD_COLUMNS = ['Booking','Todo','En ligne','Pré à faire','Retour de livraison','En cours','Export','Level OK','Montage','Argent Livré','Annulé','Absent','Problème']
const POST_COLUMNS = ['En attente de brief','Assigné Monteur','En cours','Retour','V1','V2','V3','Level OK','Problème']

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

export default function EmployeeProjects() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const [mode, setMode] = useState('PROD')
  const [projects, setProjects] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)
  const [chatProject, setChatProject] = useState(null)
  const [commentCounts, setCommentCounts] = useState({})
  const timerRef = useRef(null)

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white'
    : 'bg-white border-gray-300 text-gray-900'

  const reload = () => {
    const today = new Date().toISOString().split('T')[0]
    Store.getProjects().forEach(p => {
      if (p.status === 'Booking' && p.date === today) Store.updateProject(p.id, { status: 'Todo' })
    })
    setProjects(Store.getProjects())
    const all = Store.getAllProjectComments()
    const counts = {}
    all.forEach(c => { counts[c.projectId] = (counts[c.projectId] || 0) + 1 })
    setCommentCounts(counts)
  }

  useEffect(() => {
    reload()
    timerRef.current = setInterval(reload, 30000)
    return () => clearInterval(timerRef.current)
  }, [user])

  const columns = mode === 'PROD' ? PROD_COLUMNS : POST_COLUMNS

  // Visibility: Booking + Todo → all employees; other columns → only when assigned
  const visible = projects.filter(p =>
    PUBLIC_COLS.has(p.status) || p.assigned_to === user?.email
  )

  // Show only projects that belong to the current pipeline tab
  const filtered = visible.filter(p => (p.pipeline || 'PROD') === mode)

  const moveCard = (project, targetCol) => {
    const updates = { status: targetCol }
    if (targetCol === 'Montage' || targetCol === 'Retour') {
      updates.status = targetCol === 'Montage' ? 'En attente de brief' : 'Retour'
      updates.pipeline = 'POST'
    }
    Store.updateProject(project.id, updates)
    reload()
    if (selectedCard?.id === project.id) setSelectedCard({ ...project, ...updates })
    if (targetCol === 'Montage' || targetCol === 'Retour') setMode('POST')
  }

  const postCount = visible.filter(p => (p.pipeline || 'PROD') === 'POST').length
  const prodCount = visible.filter(p => (p.pipeline || 'PROD') === 'PROD').length

  return (
    <Layout navItems={EMPLOYEE_NAV} title="To do">
      <div className="space-y-4">

        {/* PROD / POST toggle */}
        <div className="flex items-center gap-3">
          <div className={cn('flex rounded-xl overflow-hidden border', isDark ? 'border-zinc-700' : 'border-gray-300')}>
            {[['PROD', prodCount], ['POST', postCount]].map(([m, count]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn('px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5',
                  mode === m ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-900'
                )}
              >
                {m}
                {count > 0 && (
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', mode === m ? 'bg-white/20 text-white' : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-200 text-gray-600')}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className={cn('text-xs', textSecondary)}>
            {filtered.length} projet{filtered.length !== 1 ? 's' : ''} assigné{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Kanban board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3" style={{ minWidth: `${columns.length * 220}px` }}>
            {columns.map(col => {
              const colProjects = filtered.filter(p => p.status === col)
              return (
                <div
                  key={col}
                  className={cn('rounded-2xl border p-3 flex-shrink-0', isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-gray-50 border-gray-200')}
                  style={{ width: 210 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn('text-xs font-semibold uppercase tracking-wide', textSecondary)}>{col}</span>
                    <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full', STATUS_COLORS[col] || 'bg-zinc-500/20 text-zinc-400')}>
                      {colProjects.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {colProjects.map(p => {
                      const msgCount = commentCounts[p.id] || 0
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedCard(p)}
                          className={cn('border rounded-xl p-3 cursor-pointer transition-all', card, isDark ? 'hover:border-violet-600' : 'hover:border-violet-400')}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className={cn('text-xs font-semibold truncate', textPrimary)}>{p.title}</div>
                            <button
                              onClick={e => { e.stopPropagation(); setChatProject(p) }}
                              className="relative flex-shrink-0 p-0.5 rounded hover:opacity-80 transition-opacity"
                              title={`${msgCount} message${msgCount !== 1 ? 's' : ''}`}
                            >
                              <MessageCircle size={13} className={msgCount > 0 ? 'text-violet-400' : (isDark ? 'text-zinc-600' : 'text-gray-300')} />
                              {msgCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-violet-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none">
                                  {msgCount > 99 ? '99+' : msgCount}
                                </span>
                              )}
                            </button>
                          </div>
                          <div className={cn('text-[10px] mb-2', textSecondary)}>{p.client_name}</div>
                          {p.studio && (
                            <div className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 inline-block mb-1">{p.studio}</div>
                          )}
                          {p.date && (
                            <div className={cn('text-[10px] mb-1', textSecondary)}>
                              {p.date}{p.start_time ? ` · ${p.start_time}` : ''}{p.end_time ? `–${p.end_time}` : ''}
                            </div>
                          )}
                          <div className="mt-2" onClick={e => e.stopPropagation()}>
                            <select
                              value={p.status}
                              onChange={e => moveCard(p, e.target.value)}
                              className={cn('w-full text-[10px] px-1.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-500', isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-50 border-gray-200 text-gray-600')}
                            >
                              {columns.map(c => <option key={c} value={c}>{c}</option>)}
                              {mode === 'PROD' && <option value="Montage">↳ Montage (POST)</option>}
                              {mode === 'PROD' && <option value="Retour">↳ Retour (POST)</option>}
                            </select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className={cn('text-center py-16 text-sm', textSecondary)}>
            {projects.length === 0 ? 'Aucun projet assigné pour le moment.' : `Aucun projet en ${mode}.`}
          </div>
        )}
      </div>

      {/* Comments modal */}
      {chatProject && (
        <ProjectCommentsModal
          project={chatProject}
          onClose={() => setChatProject(null)}
          onCommentAdded={(id, count) => setCommentCounts(prev => ({ ...prev, [id]: count }))}
        />
      )}

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
                  onClick={() => { setChatProject(selectedCard); setSelectedCard(null) }}
                  className="relative p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors"
                >
                  <MessageCircle size={16} className="text-violet-400" />
                  {(commentCounts[selectedCard.id] || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-violet-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5">
                      {commentCounts[selectedCard.id]}
                    </span>
                  )}
                </button>
                <button onClick={() => setSelectedCard(null)} className={textSecondary}><X size={18} /></button>
              </div>
            </div>
            <div className="space-y-2">
              {[
                ['Client', selectedCard.client_name],
                ['Studio', selectedCard.studio],
                ['Date', selectedCard.date || '—'],
                ['Horaire', selectedCard.start_time ? `${selectedCard.start_time}${selectedCard.end_time ? `–${selectedCard.end_time}` : ''}` : '—'],
                ['Pipeline', selectedCard.pipeline || mode],
                ['Statut', selectedCard.status],
                ['Fichiers', selectedCard.files?.length ? `${selectedCard.files.length} fichier(s)` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className={cn('text-xs w-20 flex-shrink-0 mt-0.5', textSecondary)}>{label}</span>
                  <span className={cn('text-sm font-medium', textPrimary)}>{value}</span>
                </div>
              ))}
            </div>
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
                {(selectedCard.pipeline || 'PROD') === 'PROD' && <option value="Montage">↳ Montage (POST)</option>}
                {(selectedCard.pipeline || 'PROD') === 'PROD' && <option value="Retour">↳ Retour (POST)</option>}
              </select>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
