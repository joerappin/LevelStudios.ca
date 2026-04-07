import React, { useState, useEffect } from 'react'
import { Search, Download, Film, Mic, Image, FileText, HardDrive } from 'lucide-react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'

const STUDIOS = ['Tous', 'Studio A', 'Studio B', 'Studio C']
const FILE_TYPES = ['Tous', 'Video', 'Audio', 'Image']

function getFileIcon(type) {
  if (!type) return <FileText className="w-5 h-5 text-zinc-400" />
  const t = type.toLowerCase()
  if (t === 'video' || t.includes('video')) return <Film className="w-5 h-5 text-blue-400" />
  if (t === 'audio' || t.includes('audio')) return <Mic className="w-5 h-5 text-green-400" />
  if (t === 'image' || t.includes('image')) return <Image className="w-5 h-5 text-yellow-400" />
  return <FileText className="w-5 h-5 text-zinc-400" />
}

export default function ChefLibrary() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [studioFilter, setStudioFilter] = useState('Tous')
  const [typeFilter, setTypeFilter] = useState('Tous')

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  useEffect(() => { setProjects(Store.getProjects()) }, [])

  // Flatten files from all projects
  const allFiles = projects.flatMap(p =>
    (p.files || []).map(f => ({
      ...f,
      project_title: p.title,
      client_name: p.client_name,
      studio: p.studio,
    }))
  )

  const filtered = allFiles.filter(f => {
    if (studioFilter !== 'Tous' && f.studio !== studioFilter) return false
    if (typeFilter !== 'Tous' && f.type?.toLowerCase() !== typeFilter.toLowerCase()) return false
    if (search) {
      const q = search.toLowerCase()
      return f.name?.toLowerCase().includes(q) || f.project_title?.toLowerCase().includes(q) || f.client_name?.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <Layout navItems={CHEF_NAV} title="Library">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={cn('flex items-center gap-2 border rounded-xl px-3 py-2 flex-1 min-w-[200px]', isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-300')}>
            <Search size={14} className={textSecondary} />
            <input
              type="text"
              placeholder="Rechercher un fichier, projet, client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={cn('flex-1 text-sm bg-transparent outline-none', textPrimary)}
            />
          </div>
          <select
            value={studioFilter}
            onChange={e => setStudioFilter(e.target.value)}
            className={cn('px-3 py-2 rounded-xl text-sm border', inputClass)}
          >
            {STUDIOS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className={cn('px-3 py-2 rounded-xl text-sm border', inputClass)}
          >
            {FILE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div className={cn('text-xs', textSecondary)}>{filtered.length} fichier{filtered.length !== 1 ? 's' : ''}</div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className={cn('border rounded-2xl p-12 text-center', card)}>
            <HardDrive className={cn('w-10 h-10 mx-auto mb-3', textSecondary)} />
            <div className={cn('font-semibold mb-1', textPrimary)}>Aucun fichier</div>
            <div className={cn('text-sm', textSecondary)}>Les fichiers apparaissent lorsqu'ils sont attachés à des projets.</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((f, i) => (
              <div key={i} className={cn('border rounded-2xl p-4 space-y-3', card)}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-zinc-800' : 'bg-gray-100')}>
                    {getFileIcon(f.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-sm font-semibold truncate', textPrimary)}>{f.name}</div>
                    <div className={cn('text-xs capitalize', textSecondary)}>{f.type || 'Fichier'}</div>
                  </div>
                </div>
                <div className={cn('text-xs space-y-1', textSecondary)}>
                  <div><span className="font-medium">Projet :</span> {f.project_title}</div>
                  <div><span className="font-medium">Client :</span> {f.client_name}</div>
                  {f.studio && <div><span className="font-medium">Studio :</span> {f.studio}</div>}
                  {f.size && <div><span className="font-medium">Taille :</span> {f.size}</div>}
                </div>
                <a
                  href={f.url || '#'}
                  download
                  className={cn('flex items-center gap-2 w-full justify-center py-2 rounded-xl text-xs font-semibold transition-colors',
                    isDark ? 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Download size={12} />
                  Télécharger
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
