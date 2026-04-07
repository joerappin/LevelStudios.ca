import React, { useState, useEffect } from 'react'
import {
  Search, File, Download, Play, Film, FileText,
  X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Calendar, Clock, MapPin, Package, Info, FolderOpen,
  CheckCircle2, Layers, Archive, Clapperboard, Volume2, Frame, Music, Image,
} from 'lucide-react'
import ClientLayout from '../../components/ClientLayout'
import { Store } from '../../data/store'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { getTierConfig } from '../../utils'
import VideoReviewModal from '../../components/VideoReviewModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const EXT = {
  image: ['jpg','jpeg','png','gif','webp','bmp','svg','ico','tiff','tif'],
  video: ['mp4','mov','avi','mkv','webm','m4v','wmv','flv','ogv','3gp'],
  audio: ['mp3','wav','aac','ogg','flac','m4a','wma','opus','aiff'],
  pdf:   ['pdf'],
  text:  ['txt','md','json','xml','csv','js','ts','jsx','tsx','html','css','yaml','yml','log'],
}
function getFileType(name) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  for (const [type, exts] of Object.entries(EXT)) if (exts.includes(ext)) return type
  return 'other'
}

const FILE_TAGS = [
  { value: 'brut',  label: 'BRUT',  color: 'bg-indigo-500/15 text-indigo-300' },
  { value: 'edite', label: 'ÉDITÉ', color: 'bg-violet-500/20 text-violet-400' },
  { value: 'photo', label: 'PHOTO', color: 'bg-emerald-500/15 text-emerald-400' },
  { value: 'audio', label: 'AUDIO', color: 'bg-purple-500/15 text-purple-400' },
]
function getFileTag(name) {
  const n = name.toLowerCase()
  if (n.includes('edit') || n.includes('édité') || n.includes('edite') || n.includes('montage')) return 'edite'
  if (getFileType(name) === 'audio') return 'audio'
  if (getFileType(name) === 'image') return 'photo'
  return 'brut'
}
function tagInfo(value) { return FILE_TAGS.find(t => t.value === value) || FILE_TAGS[0] }

// ─── Extension badge ───────────────────────────────────────────────────────────
function ExtBadge({ name }) {
  const type = getFileType(name)
  if (type === 'video') return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-800">
      <Clapperboard className="w-3.5 h-3.5 text-red-400" />
    </div>
  )
  if (type === 'audio') return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-800">
      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
    </div>
  )
  if (type === 'image') return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-800">
      <Frame className="w-3.5 h-3.5 text-emerald-400" />
    </div>
  )
  const ext = name.split('.').pop()?.toUpperCase().slice(0, 4) || '?'
  const bg = { pdf: 'bg-red-700', text: 'bg-blue-500', other: 'bg-zinc-500' }
  return (
    <div className="relative flex-shrink-0 w-8 h-8">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800">
        <File className="w-4 h-4 text-zinc-500" />
      </div>
      <span className={`absolute -top-1 -left-1 px-1 py-px rounded text-[7px] font-black text-white leading-none ${bg[type] || bg.other}`}>{ext}</span>
    </div>
  )
}

// ─── File viewer modal ─────────────────────────────────────────────────────────
function FileViewer({ file, url, allFiles, onNavigate, onClose }) {
  const [imgZoom, setImgZoom] = useState(1)
  const [text, setText] = useState(null)
  const type = getFileType(file.name)
  const idx = allFiles.findIndex(f => f.name === file.name)

  useEffect(() => {
    setImgZoom(1); setText(null)
    if (type === 'text') fetch(url).then(r => r.text()).then(setText).catch(() => setText('Erreur'))
  }, [url])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="flex flex-col rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl"
        style={{ width: '90vw', maxWidth: 960, height: '85vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 flex-shrink-0">
          <span className="flex-1 text-sm font-semibold text-white truncate">{file.name}</span>
          <span className="text-xs text-zinc-500">{formatBytes(file.size)}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex items-center justify-center relative">
          {type === 'image' && (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img src={url} alt={file.name} style={{ transform: `scale(${imgZoom})`, transformOrigin: 'center', transition: 'transform 0.2s', maxWidth: '100%', maxHeight: '100%' }} />
              <div className="absolute bottom-4 right-4 flex gap-1">
                <button onClick={() => setImgZoom(z => Math.max(0.25, z - 0.25))} className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => setImgZoom(z => Math.min(4, z + 0.25))} className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"><ZoomIn className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          {type === 'video' && <video src={url} controls className="max-w-full max-h-full" />}
          {type === 'audio' && (
            <div className="flex flex-col items-center gap-5 p-8">
              <div className="w-24 h-24 rounded-3xl bg-zinc-800 flex items-center justify-center">
                <Music className="w-12 h-12 text-purple-400" />
              </div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <audio src={url} controls className="w-80" />
            </div>
          )}
          {type === 'pdf' && <iframe src={url} className="w-full h-full border-0" title={file.name} />}
          {type === 'text' && <pre className="w-full h-full overflow-auto p-4 text-xs font-mono text-zinc-300 leading-relaxed">{text ?? 'Chargement…'}</pre>}
          {type === 'other' && (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <File className="w-16 h-16 opacity-30" />
              <p className="text-sm">Aperçu non disponible</p>
            </div>
          )}
          {idx > 0 && (
            <button onClick={() => onNavigate(allFiles[idx - 1])} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {idx < allFiles.length - 1 && (
            <button onClick={() => onNavigate(allFiles[idx + 1])} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Studio hero ──────────────────────────────────────────────────────────────
const STUDIO_PHOTOS = {
  'studio a': '/studios/studio-a.jpg',
  'studio b': '/studios/studio-b.jpg',
  'studio c': '/studios/studio-c.png',
}

function StudioHero({ studio }) {
  const key = (studio || '').toLowerCase().trim()
  const photo = STUDIO_PHOTOS[key]

  if (photo) {
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden relative">
        <img
          src={photo}
          alt={studio}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay + studio name */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />
        <span className="absolute bottom-3 left-4 text-white/80 text-xs font-semibold tracking-wide">{studio}</span>
      </div>
    )
  }

  // Fallback gradient for unknown studios
  const gradients = [
    'from-violet-950 via-blue-950 to-zinc-900',
    'from-zinc-900 via-slate-900 to-blue-950',
    'from-zinc-950 via-violet-950 to-zinc-900',
  ]
  const hash = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return (
    <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${gradients[hash % gradients.length]} flex flex-col items-center justify-center gap-3 relative overflow-hidden`}>
      <Film className="w-10 h-10 text-white/20" />
      <p className="text-white/30 text-sm font-semibold">{studio}</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientLibrary() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'
  const rowHover = isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-gray-50'

  const [reservations, setReservations] = useState([])
  const [folders, setFolders] = useState({})
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const [videoReview, setVideoReview] = useState(null)
  const [fileSettings, setFileSettings] = useState({})

  useEffect(() => {
    if (!user) return
    const allRes = Store.getReservations().filter(r => r.client_email === user.email)
    setReservations(allRes)
    const syncList = allRes.map(r => ({ email: r.client_email, resId: r.id }))
    const doFetch = () =>
      fetch('/api/folders').then(r => r.json()).then(data => {
        const map = {}
        for (const { email, reservations: resMap } of data) map[email] = resMap
        setFolders(map)
      }).catch(() => {})
    fetch('/api/folders/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(syncList) })
      .then(doFetch).catch(doFetch)
  }, [user])

  // Load fileSettings when selected changes
  useEffect(() => {
    if (!selected || !user) { setFileSettings({}); return }
    const files = folders[user.email]?.[selected.id] || []
    const s = {}
    files.forEach(f => { s[f.name] = Store.getVideoSettings(selected.id, f.name) })
    setFileSettings(s)
  }, [selected, folders])

  function getFiles(r) {
    if (!r || !user) return []
    return (folders[user.email]?.[r.id] || []).filter(f => {
      const s = Store.getVideoSettings(r.id, f.name)
      return s.visibleToClient !== false
    })
  }

  function fileUrl(r, filename) {
    return `/files/${encodeURIComponent(user.email)}/${r.id}/${encodeURIComponent(filename)}`
  }

  const q = search.toLowerCase()
  const filteredRes = reservations.filter(r =>
    !q || r.id?.toLowerCase().includes(q) || r.studio?.toLowerCase().includes(q) || r.date?.toLowerCase().includes(q)
  )

  const selectedFiles = getFiles(selected)

  // File type counts for selected
  const counts = selectedFiles.reduce((acc, f) => {
    const t = getFileType(f.name)
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  // Services list from reservation
  function getServices(r) {
    if (!r) return []
    const base = (r.service || '').toLowerCase() === 'gold'
      ? ['Formule Argent (tournage, livraison rushes instantanées, synchro audio)', 'Introduction dynamique', 'Motion design', 'Sound design', 'Sound effect', '1 révision incluse', 'Sauvegarde des fichiers pendant 2 mois']
      : [
          'Opérateur sur place',
          'Jusqu\'à 4 caméras 4K',
          'Jusqu\'à 4 microphones',
          'Pré-montage',
          'Synchronisation audio vidéo',
          'Choix du décor et de l\'ambiance',
          'Envoi fichiers bruts audio et vidéo instantané après la fin du tournage',
          'Envoi fichier mix audio instantané après la fin du tournage',
          'Sauvegarde des fichiers pendant 7 jours',
        ]
    const opts = r.options || []
    if (opts.includes('photo')) base.push('Séance photo')
    if (opts.includes('short')) base.push('Short vidéo')
    if (opts.includes('live')) base.push('Live stream')
    return base
  }

  return (
    <ClientLayout title="Librairie">
      <div className="flex gap-4" style={{ height: 'calc(100vh - 130px)' }}>

        {/* ── Left panel — session cards ── */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1" style={{ width: 240, flexShrink: 0 }}>
          {/* Search */}
          <div className={`sticky top-0 z-10 pb-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border outline-none focus:ring-1 focus:ring-violet-500 ${isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
              />
            </div>
          </div>

          {/* Session list */}
          {filteredRes.length === 0 ? (
            <div className={`flex flex-col items-center gap-2 py-8 ${textSecondary}`}>
              <FolderOpen className="w-8 h-8 opacity-30" />
              <p className="text-xs text-center">Aucune réservation</p>
            </div>
          ) : filteredRes.map(r => {
            const fc = getFiles(r).length
            const isSelected = selected?.id === r.id
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`text-left p-3 rounded-2xl border transition-all ${
                  isSelected
                    ? isDark ? 'bg-violet-600/15 border-violet-500/50 ring-1 ring-violet-500/30' : 'bg-violet-50 border-violet-300'
                    : isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-violet-400' : textSecondary}`}>#{r.id}</span>
                  {fc > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-violet-500/30 text-violet-300' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>
                      {fc}
                    </span>
                  )}
                </div>
                <p className={`text-sm font-semibold leading-tight mb-1 ${isSelected ? (isDark ? 'text-violet-200' : 'text-violet-700') : textPrimary}`}>{r.studio || '—'}</p>
                <p className={`text-[11px] ${textSecondary}`}>{r.date || '—'}</p>
                {r.service && (
                  <span className={`inline-block mt-1.5 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide ${getTierConfig(r.service).cls}`}>{getTierConfig(r.service).label}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 overflow-y-auto space-y-4 min-w-0">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                <Film className={`w-10 h-10 ${textSecondary} opacity-40`} />
              </div>
              <div className={`text-base font-semibold ${textPrimary}`}>Sélectionnez une session</div>
              <p className={`text-sm text-center max-w-xs ${textSecondary}`}>Choisissez une réservation pour accéder à vos fichiers livrés</p>
            </div>
          ) : (
            <>
              {/* ── Row 1 : Hero + Session info ── */}
              <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 3fr', height: 200 }}>

                {/* Studio image */}
                <StudioHero studio={selected.studio} />

                {/* Session info card */}
                <div className={`rounded-2xl border p-5 flex flex-col justify-between ${card}`}>
                  <div className="space-y-2.5">
                    {[
                      { icon: Calendar, label: 'Date',    value: selected.date || '—' },
                      { icon: Clock,    label: 'Heures',  value: selected.duration ? `${selected.duration}h` : '—' },
                      { icon: Layers,   label: 'Studio',  value: selected.studio || '—' },
                      { icon: MapPin,   label: 'Adresse', value: '29 rue des Jeûneurs, 75002 Paris' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className={`text-xs w-20 flex-shrink-0 ${textSecondary}`}>{label}</span>
                        <span className={`text-xs font-medium flex-1 truncate ${textPrimary}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {}}
                    className={`mt-3 text-xs font-semibold text-left ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'} transition-colors`}
                  >
                    Voir les détails →
                  </button>
                </div>
              </div>

              {/* ── Row 2 : 3 content cards ── */}
              <div className="grid grid-cols-3 gap-4">

                {/* Card 1 — Tous les rushes */}
                <div className={`rounded-2xl border flex flex-col overflow-hidden ${card}`} style={{ maxHeight: 420 }}>
                  {/* Header */}
                  <div className={`flex items-center gap-2 px-4 py-3 border-b flex-shrink-0 ${divider}`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                      <Play className={`w-3 h-3 ${textSecondary}`} />
                    </div>
                    <span className={`text-sm font-semibold flex-1 ${textPrimary}`}>Tous les rushes</span>
                    <span className={`text-[10px] font-bold ${textSecondary}`}>{selectedFiles.length}</span>
                  </div>

                  {/* File list */}
                  <div className="flex-1 overflow-y-auto">
                    {selectedFiles.length === 0 ? (
                      <div className={`flex flex-col items-center justify-center h-full gap-2 py-8 ${textSecondary}`}>
                        <FolderOpen className="w-8 h-8 opacity-20" />
                        <p className="text-xs">Aucun fichier disponible</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-0.5">
                        {selectedFiles.map((file, i) => {
                          const fSettings = fileSettings[file.name] || {}
                          const tag = fSettings.tag || getFileTag(file.name)
                          const ti = tagInfo(tag)
                          const type = getFileType(file.name)
                          const isVideo = type === 'video'
                          const canDownload = fSettings.allowDownload !== false
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-colors ${rowHover}`}
                              onClick={() => isVideo ? setVideoReview(file) : setPreview({ file, url: fileUrl(selected, file.name) })}
                            >
                              <ExtBadge name={file.name} />
                              <span className={`flex-1 text-xs font-medium truncate ${textPrimary}`}>{file.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${ti.color}`}>{ti.label}</span>
                              {canDownload ? (
                                <a
                                  href={fileUrl(selected, file.name)}
                                  download={file.name}
                                  onClick={e => e.stopPropagation()}
                                  className={`p-1 rounded-lg transition-colors flex-shrink-0 ${textSecondary} hover:text-white`}
                                >
                                  <Download className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="w-5 flex-shrink-0" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer note */}
                  <div className={`flex items-start gap-1.5 px-3 py-2 border-t flex-shrink-0 ${divider}`}>
                    <Info className={`w-3 h-3 flex-shrink-0 mt-px ${textSecondary} opacity-60`} />
                    <p className={`text-[10px] leading-relaxed ${textSecondary} opacity-60`}>
                      Fichiers supprimés automatiquement 14 jours après la session.
                    </p>
                  </div>
                </div>

                {/* Card 2 — Ce que vous recevez */}
                <div className={`rounded-2xl border flex flex-col ${card}`} style={{ maxHeight: 420 }}>
                  <div className={`flex items-center gap-2 px-4 py-3 border-b flex-shrink-0 ${divider}`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                      <Package className={`w-3 h-3 ${textSecondary}`} />
                    </div>
                    <span className={`text-sm font-semibold flex-1 ${textPrimary}`}>Ce que vous recevez</span>
                    {selected.service && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                        selected.service === 'gold' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-zinc-500/15 text-zinc-400'
                      }`}>{selected.service}</span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Services inclus */}
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${textSecondary}`}>Services inclus</p>
                      <div className="space-y-1.5">
                        {getServices(selected).map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <span className={`text-xs ${textPrimary}`}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fichiers livrés */}
                    {selectedFiles.length > 0 && (
                      <div>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${textSecondary}`}>Fichiers livrés</p>
                        <div className="space-y-1">
                          {counts.video > 0 && (
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${textSecondary}`}>Vidéos</span>
                              <span className={`text-xs font-semibold ${textPrimary}`}>{counts.video}</span>
                            </div>
                          )}
                          {counts.audio > 0 && (
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${textSecondary}`}>Audios</span>
                              <span className={`text-xs font-semibold ${textPrimary}`}>{counts.audio}</span>
                            </div>
                          )}
                          {counts.image > 0 && (
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${textSecondary}`}>Photos</span>
                              <span className={`text-xs font-semibold ${textPrimary}`}>{counts.image}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3 — Téléchargements */}
                {(() => {
                  const hasFiles = selectedFiles.length > 0
                  const downloadableFiles = selectedFiles.filter(f => fileSettings[f.name]?.allowDownload !== false)
                  const noneDownloadable = hasFiles && downloadableFiles.length === 0
                  const zipUrl = (type) =>
                    `/api/folders/${encodeURIComponent(user.email)}/${selected.id}/zip?type=${type}`

                  return (
                    <div className={`rounded-2xl border flex flex-col ${card}`} style={{ maxHeight: 420 }}>
                      <div className={`flex items-center gap-2 px-4 py-3 border-b flex-shrink-0 ${divider}`}>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                          <Archive className={`w-3 h-3 ${textSecondary}`} />
                        </div>
                        <span className={`text-sm font-semibold flex-1 ${textPrimary}`}>Téléchargements</span>
                      </div>

                      <div className="flex-1 p-4 flex flex-col gap-3">

                        {/* Error state — files exist but none downloadable */}
                        {noneDownloadable && (
                          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-2">
                            <p className="text-xs font-semibold text-red-400 leading-relaxed">
                              Il semble qu'il y ait un problème avec vos fichiers, veuillez nous contacter, Merci.
                            </p>
                          </div>
                        )}

                        {/* Normal state — at least one downloadable file */}
                        {!noneDownloadable && hasFiles && (
                          <>
                            {/* Tout télécharger */}
                            <a
                              href={zipUrl('all')}
                              download
                              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Tout télécharger (.zip)
                            </a>

                            {/* Per-type buttons — only show if that type exists and is downloadable */}
                            <div className="space-y-2">
                              {[
                                { type: 'video', icon: Clapperboard, label: 'Vidéos uniquement (.zip)',  color: 'text-red-400' },
                                { type: 'audio', icon: Volume2,      label: 'Audios uniquement (.zip)',  color: 'text-purple-400' },
                                { type: 'image', icon: Frame,        label: 'Photos uniquement (.zip)',  color: 'text-emerald-400' },
                              ].filter(({ type: t }) =>
                                downloadableFiles.some(f => getFileType(f.name) === t)
                              ).map(({ type: t, icon: Icon, label, color }) => (
                                <a
                                  key={t}
                                  href={zipUrl(t)}
                                  download
                                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-colors ${isDark ? 'bg-zinc-800/60 hover:bg-zinc-800' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
                                  <span className={`text-xs flex-1 font-medium ${textPrimary}`}>{label}</span>
                                  <span className={`text-[10px] font-bold ${textSecondary}`}>{downloadableFiles.filter(f => getFileType(f.name) === t).length}</span>
                                </a>
                              ))}
                            </div>
                          </>
                        )}

                        {/* No files yet */}
                        {!hasFiles && (
                          <div className={`flex-1 flex items-center justify-center text-xs text-center ${textSecondary}`}>
                            Vos fichiers seront disponibles après la session.
                          </div>
                        )}

                        <div className="flex items-start gap-1.5 mt-auto">
                          <Info className={`w-3 h-3 flex-shrink-0 mt-px ${textSecondary} opacity-50`} />
                          <p className={`text-[10px] leading-relaxed ${textSecondary} opacity-60`}>
                            Accès disponible 14 jours après votre session.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {preview && (
        <FileViewer
          file={preview.file}
          url={preview.url}
          allFiles={selectedFiles.filter(f => getFileType(f.name) !== 'video')}
          onNavigate={f => setPreview({ file: f, url: fileUrl(selected, f.name) })}
          onClose={() => setPreview(null)}
        />
      )}
      {videoReview && selected && (
        <VideoReviewModal
          reservation={selected}
          allFiles={selectedFiles}
          initialFile={videoReview}
          onClose={() => setVideoReview(null)}
        />
      )}
    </ClientLayout>
  )
}
