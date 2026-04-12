import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, FolderOpen, Folder, File, Download, Trash2, Upload,
  HardDrive, ChevronRight, ChevronDown, Loader2, X, Eye, EyeOff,
  Image, Film, Music, FileText, ChevronLeft, ZoomIn, ZoomOut,
  LayoutGrid, List, Play, Info, Settings, ChevronDown as ChevDown,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import Layout from './Layout'
import { Store } from '../data/store'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import VideoReviewModal from './VideoReviewModal'
import { useReservations } from '../hooks/useReservations'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const EXT = {
  image: ['jpg','jpeg','png','gif','webp','bmp','svg','ico','tiff','tif'],
  video: ['mp4','mov','avi','mkv','webm','m4v','wmv','flv','ogv','3gp'],
  audio: ['mp3','wav','aac','ogg','flac','m4a','wma','opus','aiff'],
  pdf:   ['pdf'],
  text:  ['txt','md','json','xml','csv','js','ts','jsx','tsx','html','css','yaml','yml','log','sh','py','rb'],
}

function getFileType(name) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  for (const [type, exts] of Object.entries(EXT)) {
    if (exts.includes(ext)) return type
  }
  return 'other'
}

function FileIcon({ name, className = 'w-4 h-4' }) {
  const type = getFileType(name)
  if (type === 'image') return <Image className={className} />
  if (type === 'video') return <Film className={className} />
  if (type === 'audio') return <Music className={className} />
  if (type === 'pdf')   return <FileText className={className} />
  if (type === 'text')  return <FileText className={className} />
  return <File className={className} />
}

function FileTypeColor(name) {
  const type = getFileType(name)
  if (type === 'image') return 'text-green-400'
  if (type === 'video') return 'text-blue-400'
  if (type === 'audio') return 'text-purple-400'
  if (type === 'pdf')   return 'text-red-400'
  if (type === 'text')  return 'text-yellow-400'
  return 'text-zinc-400'
}

function getFileTag(name) {
  const n = name.toLowerCase()
  if (n.includes('edit') || n.includes('édité') || n.includes('edite') || n.includes('montage') || n.includes('_ed_') || n.includes('_ed.')) return 'edite'
  return 'brut'
}

const FILE_TAGS = [
  { value: 'brut',  label: 'BRUT',   colorDark: 'bg-indigo-500/15 text-indigo-300',   colorLight: 'bg-indigo-100 text-indigo-500' },
  { value: 'edite', label: 'ÉDITÉ',  colorDark: 'bg-violet-500/20 text-violet-400',   colorLight: 'bg-violet-100 text-violet-600' },
  { value: 'photo', label: 'PHOTO',  colorDark: 'bg-emerald-500/15 text-emerald-400', colorLight: 'bg-emerald-100 text-emerald-600' },
  { value: 'audio', label: 'AUDIO',  colorDark: 'bg-purple-500/15 text-purple-400',   colorLight: 'bg-purple-100 text-purple-600' },
]
function tagStyle(value, isDark) {
  const t = FILE_TAGS.find(t => t.value === value) || FILE_TAGS[0]
  return isDark ? t.colorDark : t.colorLight
}
function tagLabel(value) {
  return (FILE_TAGS.find(t => t.value === value) || FILE_TAGS[0]).label
}

function ExtBadge({ name, isDark }) {
  const ext = name.split('.').pop()?.toUpperCase().slice(0, 4) || '?'
  const type = getFileType(name)
  if (type === 'audio') return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
      <Music className="w-4 h-4 text-purple-400" />
    </div>
  )
  const badgeBg = {
    video: 'bg-red-500',
    image: 'bg-emerald-500',
    pdf:   'bg-red-600',
    text:  'bg-blue-500',
    other: 'bg-zinc-500',
  }
  const bg = badgeBg[type] || badgeBg.other
  return (
    <div className="relative flex-shrink-0 w-9 h-9">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
        <File className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
      </div>
      <span className={`absolute -top-1 -left-1 px-1 py-px rounded text-[7px] font-black text-white leading-none ${bg}`}>{ext}</span>
    </div>
  )
}

// ─── File viewer modal ────────────────────────────────────────────────────────
function FileViewer({ file, url, allFiles, onNavigate, onClose, isDark }) {
  const [textContent, setTextContent] = useState(null)
  const [loadingText, setLoadingText] = useState(false)
  const [imgZoom, setImgZoom] = useState(1)
  const type = getFileType(file.name)

  useEffect(() => {
    setTextContent(null)
    setImgZoom(1)
    if (type === 'text') {
      setLoadingText(true)
      fetch(url)
        .then(r => r.text())
        .then(t => { setTextContent(t); setLoadingText(false) })
        .catch(() => { setTextContent('Impossible de charger le fichier.'); setLoadingText(false) })
    }
  }, [url])

  const bg = isDark ? 'bg-zinc-950' : 'bg-white'
  const headerBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const idx = allFiles.findIndex(f => f.name === file.name)

  function handleKey(e) {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && idx > 0) onNavigate(allFiles[idx - 1])
    if (e.key === 'ArrowRight' && idx < allFiles.length - 1) onNavigate(allFiles[idx + 1])
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={-1}
    >
      <div
        className={`relative flex flex-col rounded-2xl overflow-hidden border ${headerBg} ${bg}`}
        style={{ width: '90vw', maxWidth: 1100, height: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-3 border-b ${headerBg} flex-shrink-0`}>
          <FileIcon name={file.name} className={`w-5 h-5 ${FileTypeColor(file.name)}`} />
          <span className={`font-semibold text-sm flex-1 truncate ${textPrimary}`}>{file.name}</span>
          <span className={`text-xs ${textSecondary}`}>{formatBytes(file.size)}</span>

          {/* Zoom for images */}
          {type === 'image' && (
            <div className="flex items-center gap-1 mr-2">
              <button onClick={() => setImgZoom(z => Math.max(0.2, z - 0.2))} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}><ZoomOut className="w-4 h-4" /></button>
              <span className={`text-xs w-10 text-center ${textSecondary}`}>{Math.round(imgZoom * 100)}%</span>
              <button onClick={() => setImgZoom(z => Math.min(4, z + 0.2))} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}><ZoomIn className="w-4 h-4" /></button>
            </div>
          )}

          <a
            href={url}
            download={file.name}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </a>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center relative">
          {type === 'image' && (
            <div className="w-full h-full overflow-auto flex items-center justify-center">
              <img
                src={url}
                alt={file.name}
                style={{ transform: `scale(${imgZoom})`, transformOrigin: 'center', maxWidth: 'none', transition: 'transform 0.15s' }}
                className="max-h-full"
                draggable={false}
              />
            </div>
          )}

          {type === 'video' && (
            <video
              key={url}
              controls
              autoPlay={false}
              className="max-w-full max-h-full rounded-xl"
              style={{ maxHeight: 'calc(88vh - 56px)' }}
            >
              <source src={url} />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}

          {type === 'audio' && (
            <div className="flex flex-col items-center gap-6 p-8">
              <div className={`w-32 h-32 rounded-3xl flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                <Music className="w-16 h-16 text-purple-400" />
              </div>
              <div className={`text-lg font-semibold ${textPrimary}`}>{file.name}</div>
              <audio key={url} controls autoPlay={false} className="w-full max-w-lg">
                <source src={url} />
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
          )}

          {type === 'pdf' && (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={file.name}
            />
          )}

          {type === 'text' && (
            <div className="w-full h-full overflow-auto p-5">
              {loadingText ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
              ) : (
                <pre className={`text-sm font-mono whitespace-pre-wrap break-words leading-relaxed ${isDark ? 'text-zinc-300' : 'text-gray-800'}`}>
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {type === 'other' && (
            <div className="flex flex-col items-center gap-4 p-8">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                <File className={`w-12 h-12 ${textSecondary}`} />
              </div>
              <div className={`text-lg font-semibold ${textPrimary}`}>{file.name}</div>
              <div className={`text-sm ${textSecondary}`}>{formatBytes(file.size)} · Aperçu non disponible</div>
              <a
                href={url}
                download={file.name}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </a>
            </div>
          )}

          {/* Prev / Next navigation */}
          {idx > 0 && (
            <button
              onClick={() => onNavigate(allFiles[idx - 1])}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {idx < allFiles.length - 1 && (
            <button
              onClick={() => onNavigate(allFiles[idx + 1])}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Thumbnail strip if multiple files */}
        {allFiles.length > 1 && (
          <div className={`flex gap-2 px-4 py-2 border-t overflow-x-auto flex-shrink-0 ${headerBg}`}>
            {allFiles.map((f, i) => (
              <button
                key={i}
                onClick={() => onNavigate(f)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                  f.name === file.name
                    ? 'bg-violet-600/20 ring-1 ring-violet-500'
                    : isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'
                }`}
              >
                <FileIcon name={f.name} className={`w-4 h-4 ${FileTypeColor(f.name)}`} />
                <span className={`text-[9px] max-w-[64px] truncate ${textSecondary}`}>{f.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function RushesPanel({ navItems, title, userEmail }) {
  const { theme } = useApp()
  const { user } = useAuth()
  const location = useLocation()
  const isDark = theme === 'dark'
  const isStaff = user?.type !== 'client'

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputBg = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  const rowHover = isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'

  const { reservations: allReservations } = useReservations({ interval: 60000 })
  const [reservations, setReservations] = useState([])
  const [folders, setFolders] = useState({})
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [expandedEmails, setExpandedEmails] = useState({})
  const [videoReview, setVideoReview] = useState(null) // { file }
  const [fileSettings, setFileSettings] = useState({})
  const [openTagMenu, setOpenTagMenu] = useState(null) // filename of open tag dropdown
  const fileInputRef = useRef(null)
  const autoOpenDoneRef = useRef(false)

  function buildFoldersMap(data) {
    const map = {}
    for (const { email, reservations: resMap } of data) {
      map[email] = resMap
    }
    return map
  }

  async function fetchFolders(storeReservations) {
    try {
      const res = await fetch('/api/folders')
      const data = await res.json()
      const map = buildFoldersMap(data)
      setFolders(map)

      // Merge orphaned folders (exist on disk but not in Store)
      if (storeReservations) {
        const storeIds = new Set(storeReservations.map(r => r.id))
        const oldFmt = /^RES[A-Z0-9]+$/
        const orphans = []
        const toDelete = []
        for (const { email, reservations: resMap } of data) {
          for (const resId of Object.keys(resMap)) {
            if (!storeIds.has(resId)) {
              if (oldFmt.test(resId)) {
                // Old-format folder with no matching Store entry → auto-delete
                toDelete.push({ email, resId })
              } else {
                orphans.push({
                  id: resId,
                  client_email: email,
                  client_name: email,
                  studio: '—',
                  date: '—',
                  service: '—',
                  _orphan: true,
                })
              }
            }
          }
        }
        // Silently remove legacy RES-format folders
        toDelete.forEach(({ email, resId }) =>
          fetch(`/api/folders/${encodeURIComponent(email)}/${resId}`, { method: 'DELETE' }).catch(() => {})
        )
        if (orphans.length > 0) {
          setReservations(prev => {
            const existingIds = new Set(prev.map(r => r.id))
            const newOnes = orphans.filter(o => !existingIds.has(o.id))
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev
          })
        }
      }
    } catch (e) {
      console.error('fetchFolders error', e)
    }
  }

  useEffect(() => {
    let filtered = allReservations
    if (userEmail) {
      const projects = Store.getProjects().filter(p => p.assigned_to === userEmail)
      const assignedEmails = projects.map(p => p.client_email).filter(Boolean)
      if (assignedEmails.length > 0) filtered = allReservations.filter(r => assignedEmails.includes(r.client_email))
    }
    setReservations(filtered)
    const syncList = filtered.map(r => ({ email: r.client_email, resId: r.id }))
    fetch('/api/folders/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncList),
    }).then(() => fetchFolders(filtered)).catch(() => fetchFolders(filtered))
  }, [userEmail, allReservations])

  // Auto-open VideoReviewModal when navigated from a Retour alert
  useEffect(() => {
    const { openResId, openFile } = location.state || {}
    if (!openResId || !openFile || autoOpenDoneRef.current) return
    if (!Object.keys(folders).length) return // wait until folders loaded
    const res = reservations.find(r => r.id === openResId)
    if (!res) return
    const fileList = folders[res.client_email]?.[res.id] || []
    const file = fileList.find(f => f.name === openFile)
    if (!file) return
    autoOpenDoneRef.current = true
    setSelected(res)
    setVideoReview(file)
  }, [folders, reservations, location.state])

  function getFileCount(r) {
    return folders[r.client_email]?.[r.id]?.length || 0
  }

  function getFiles(r) {
    if (!r) return []
    return folders[r.client_email]?.[r.id] || []
  }

  function fileUrl(r, filename) {
    return `/files/${encodeURIComponent(r.client_email)}/${r.id}/${encodeURIComponent(filename)}`
  }

  function openPreview(file) {
    setPreview({ file, url: fileUrl(selected, file.name) })
  }

  // Load video settings for all files in the selected folder
  useEffect(() => {
    if (!selected) { setFileSettings({}); return }
    const files = getFiles(selected)
    const s = {}
    files.forEach(f => { s[f.name] = Store.getVideoSettings(selected.id, f.name) })
    setFileSettings(s)
  }, [selected, folders])

  function toggleVisibility(filename) {
    const cur = fileSettings[filename] || { visibleToClient: true, allowDownload: true }
    const next = { ...cur, visibleToClient: !cur.visibleToClient }
    Store.setVideoSettings(selected.id, filename, next)
    setFileSettings(prev => ({ ...prev, [filename]: next }))
  }

  function setFileTag(filename, tag) {
    const cur = fileSettings[filename] || { visibleToClient: true, allowDownload: true }
    const next = { ...cur, tag }
    Store.setVideoSettings(selected.id, filename, next)
    setFileSettings(prev => ({ ...prev, [filename]: next }))
    setOpenTagMenu(null)
  }

  async function handleUpload(files) {
    if (!selected || !files || files.length === 0) return
    setUploading(true)
    const formData = new FormData()
    for (const file of files) formData.append('files', file)
    try {
      await fetch(`/api/folders/${encodeURIComponent(selected.client_email)}/${selected.id}/upload`, { method: 'POST', body: formData })
      await fetchFolders()
    } catch (e) {
      console.error('upload error', e)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(filename) {
    if (!selected) return
    await fetch(`/api/folders/${encodeURIComponent(selected.client_email)}/${selected.id}/${encodeURIComponent(filename)}`, { method: 'DELETE' })
    await fetchFolders()
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleUpload(Array.from(e.dataTransfer.files))
  }

  const selectedFiles = getFiles(selected)

  return (
    <Layout navItems={navItems} title={title}>
      <div className="space-y-4">
        {/* Header */}
        <div className={`border rounded-2xl p-5 flex items-center gap-3 ${card}`}>
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className={`font-bold ${textPrimary}`}>Gestion des rushes</h2>
            <p className={`text-xs ${textSecondary}`}>Déposez et gérez les fichiers bruts par réservation client</p>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="flex gap-4" style={{ height: '75vh' }}>

          {/* Left panel — folder tree */}
          <div className={`flex flex-col border rounded-2xl overflow-hidden ${card}`} style={{ width: 300, flexShrink: 0 }}>
            {/* Search */}
            <div className={`p-3 border-b ${divider}`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textSecondary}`} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg text-xs border outline-none focus:ring-1 focus:ring-violet-500 ${inputBg}`}
                />
              </div>
            </div>

            {/* customers/ root label */}
            <div className={`px-3 py-2 border-b flex items-center gap-1.5 ${divider} ${isDark ? 'bg-zinc-800/40' : 'bg-gray-50'}`}>
              <HardDrive className={`w-3.5 h-3.5 ${textSecondary}`} />
              <span className={`text-[11px] font-mono font-semibold ${textSecondary}`}>customers/</span>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto py-1">
              {(() => {
                // Group filtered reservations by email
                const q = search.toLowerCase()
                const byEmail = {}
                reservations.forEach(r => {
                  const match = !q ||
                    r.client_name?.toLowerCase().includes(q) ||
                    r.client_email?.toLowerCase().includes(q) ||
                    r.studio?.toLowerCase().includes(q) ||
                    r.id?.toLowerCase().includes(q)
                  if (!match) return
                  if (!byEmail[r.client_email]) byEmail[r.client_email] = { name: r.client_name, reservations: [] }
                  byEmail[r.client_email].reservations.push(r)
                })
                const emails = Object.keys(byEmail)
                if (emails.length === 0) return (
                  <div className={`p-6 text-center text-sm ${textSecondary}`}>Aucun dossier</div>
                )
                return emails.map(email => {
                  const isOpen = expandedEmails[email] !== false // open by default
                  const clientRes = byEmail[email].reservations
                  const totalFiles = clientRes.reduce((s, r) => s + getFileCount(r), 0)
                  return (
                    <div key={email}>
                      {/* Email folder row */}
                      <button
                        onClick={() => setExpandedEmails(prev => ({ ...prev, [email]: !isOpen }))}
                        className={`w-full flex items-center gap-1.5 px-3 py-2 transition-colors ${rowHover}`}
                      >
                        {isOpen
                          ? <ChevronDown className={`w-3 h-3 flex-shrink-0 ${textSecondary}`} />
                          : <ChevronRight className={`w-3 h-3 flex-shrink-0 ${textSecondary}`} />}
                        <FolderOpen className={`w-3.5 h-3.5 flex-shrink-0 text-yellow-400`} />
                        <span className={`text-xs font-mono flex-1 truncate text-left ${textPrimary}`}>{email}</span>
                        {totalFiles > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 flex-shrink-0`}>{totalFiles}</span>
                        )}
                      </button>

                      {/* Reservation sub-folders */}
                      {isOpen && clientRes.map(r => {
                        const fileCount = getFileCount(r)
                        const isSelected = selected?.id === r.id
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelected(r)}
                            className={`w-full flex items-center gap-1.5 pl-7 pr-3 py-2 transition-colors ${
                              isSelected
                                ? isDark ? 'bg-violet-600/20 border-l-2 border-l-violet-500' : 'bg-violet-50 border-l-2 border-l-violet-500'
                                : rowHover
                            }`}
                          >
                            <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-violet-400' : 'text-yellow-500/70'}`} />
                            <div className="flex-1 min-w-0 text-left">
                              <div className={`text-[11px] font-mono truncate ${isSelected ? (isDark ? 'text-violet-300' : 'text-violet-700') : textPrimary}`}>{r.id}</div>
                              <div className={`text-[10px] truncate ${textSecondary}`}>{r.studio} · {r.date}</div>
                            </div>
                            {fileCount > 0 && (
                              <span className="text-[10px] font-bold bg-violet-500/20 text-violet-400 rounded-full px-1.5 py-0.5 flex-shrink-0">{fileCount}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              })()}
            </div>

            {/* Footer */}
            <div className={`px-3 py-2 border-t text-[11px] font-mono ${textSecondary} ${divider}`}>
              {reservations.length} réservation{reservations.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Right panel */}
          <div
            className={`flex-1 border rounded-2xl overflow-hidden flex flex-col relative ${card} ${dragging ? (isDark ? 'border-violet-500' : 'border-violet-400') : ''}`}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false) }}
            onClick={() => openTagMenu && setOpenTagMenu(null)}
          >
            {/* Drag overlay */}
            {dragging && (
              <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed pointer-events-none ${isDark ? 'bg-violet-500/10 border-violet-500' : 'bg-violet-50/80 border-violet-400'}`}>
                <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-violet-400" />
                </div>
                <div className={`text-base font-semibold ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>Déposer les fichiers ici</div>
              </div>
            )}

            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                  <FolderOpen className={`w-8 h-8 ${textSecondary}`} />
                </div>
                <div className={`text-sm font-medium ${textPrimary}`}>Sélectionnez une réservation</div>
                <div className={`text-xs text-center max-w-xs ${textSecondary}`}>Choisissez une réservation dans la liste pour gérer ses fichiers rushes</div>
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className={`px-4 py-3 border-b flex items-center gap-3 flex-shrink-0 ${divider}`}>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold truncate ${textPrimary}`}>{selected.client_name}</div>
                    <div className={`text-[11px] font-mono truncate ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
                      customers/{selected.client_email}/{selected.id}/
                    </div>
                  </div>
                  <span className={`text-xs ${textSecondary} flex-shrink-0`}>{selectedFiles.length} fichier{selectedFiles.length !== 1 ? 's' : ''}</span>
                  {/* View toggle */}
                  <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'}`}
                      title="Vue grille"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'}`}
                      title="Vue liste"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Importer
                  </button>
                  <button onClick={() => setSelected(null)} className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Explorer content */}
                <div className="flex-1 overflow-y-auto">
                  {selectedFiles.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-full gap-3 ${textSecondary}`}>
                      <FolderOpen className="w-12 h-12 opacity-30" />
                      <div className="text-sm">Dossier vide</div>
                      <div className="text-xs opacity-60">Glissez-déposez des fichiers ou cliquez sur Importer</div>
                    </div>
                  ) : viewMode === 'grid' ? (
                    /* Grid view */
                    <div className="p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                      {selectedFiles.map((file, i) => {
                        const type = getFileType(file.name)
                        const isImage = type === 'image'
                        const fSettings = fileSettings[file.name] || {}
                        const tag = fSettings.tag || getFileTag(file.name)
                        return (
                          <div
                            key={i}
                            className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-colors ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                            onClick={() => openPreview(file)}
                          >
                            <div className={`w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                              {isImage ? (
                                <img src={fileUrl(selected, file.name)} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <FileIcon name={file.name} className={`w-10 h-10 ${FileTypeColor(file.name)}`} />
                              )}
                            </div>
                            <div className={`text-[11px] text-center w-full truncate leading-tight ${textPrimary}`}>{file.name}</div>
                            <span className={`text-[9px] font-bold px-1.5 py-px rounded-md ${tagStyle(tag, isDark)}`}>
                              {tagLabel(tag)}
                            </span>
                            <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              {tag === 'edite' && type === 'video' && (
                                <button onClick={() => setVideoReview(file)}
                                  className="p-1 rounded-md bg-violet-600/80 text-white hover:bg-violet-600"
                                  title="Review">
                                  <Settings className="w-3 h-3" />
                                </button>
                              )}
                              <a href={fileUrl(selected, file.name)} download={file.name}
                                className={`p-1 rounded-md ${isDark ? 'bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'}`}>
                                <Download className="w-3 h-3" />
                              </a>
                              <button onClick={() => handleDelete(file.name)}
                                className={`p-1 rounded-md ${isDark ? 'bg-zinc-700 text-zinc-300 hover:text-red-400' : 'bg-white text-gray-500 hover:text-red-500 shadow-sm'}`}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    /* List view — inspired by Librairie rushes.jpg */
                    <div className="p-3 space-y-1.5">

                      {/* Section header */}
                      <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-3 ${isDark ? 'bg-zinc-800/60' : 'bg-gray-50'} border ${divider}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-zinc-700' : 'bg-white shadow-sm'}`}>
                          <Play className={`w-3 h-3 ${isDark ? 'text-zinc-300' : 'text-gray-500'}`} />
                        </div>
                        <span className={`text-sm font-semibold flex-1 ${textPrimary}`}>Tous les rushes</span>
                        <span className={`text-xs ${textSecondary}`}>{selectedFiles.length} fichier{selectedFiles.length !== 1 ? 's' : ''}</span>
                      </div>

                      {/* File rows */}
                      {selectedFiles.map((file, i) => {
                        const type = getFileType(file.name)
                        const fSettings = fileSettings[file.name] || { visibleToClient: true, allowDownload: true }
                        const tag = fSettings.tag || getFileTag(file.name)
                        const visible = fSettings.visibleToClient !== false
                        const tagMenuOpen = openTagMenu === file.name
                        return (
                          <div
                            key={i}
                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${rowHover}`}
                            onClick={() => { setOpenTagMenu(null); openPreview(file) }}
                          >
                            {/* Extension badge */}
                            <ExtBadge name={file.name} isDark={isDark} />

                            {/* Filename */}
                            <span className={`flex-1 text-sm font-medium truncate ${textPrimary}`}>{file.name}</span>

                            {/* Tag badge — clickable dropdown for staff */}
                            <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                              {isStaff ? (
                                <button
                                  onClick={() => setOpenTagMenu(tagMenuOpen ? null : file.name)}
                                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${tagStyle(tag, isDark)} hover:opacity-80`}
                                >
                                  {tagLabel(tag)}
                                  <ChevDown className="w-2.5 h-2.5 opacity-60" />
                                </button>
                              ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${tagStyle(tag, isDark)}`}>
                                  {tagLabel(tag)}
                                </span>
                              )}
                              {tagMenuOpen && (
                                <div className={`absolute top-full right-0 mt-1 z-30 rounded-xl overflow-hidden shadow-2xl border min-w-[100px] ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                                  {FILE_TAGS.map(t => (
                                    <button
                                      key={t.value}
                                      onClick={() => setFileTag(file.name, t.value)}
                                      className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-gray-50'} ${tag === t.value ? (isDark ? t.colorDark : t.colorLight) : (isDark ? 'text-zinc-300' : 'text-gray-600')}`}
                                    >
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Cog button — ÉDITÉ video files only, opens VideoReviewModal */}
                            {tag === 'edite' && type === 'video' && (
                              <button
                                onClick={e => { e.stopPropagation(); setVideoReview(file) }}
                                title="Ouvrir le lecteur de review"
                                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'}`}
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Visibility toggle */}
                            <button
                              onClick={e => { e.stopPropagation(); toggleVisibility(file.name) }}
                              title={visible ? 'Visible par le client' : 'Masqué au client'}
                              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                visible
                                  ? isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                                  : isDark ? 'text-zinc-600 hover:text-zinc-400' : 'text-gray-300 hover:text-gray-500'
                              }`}
                            >
                              {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>

                            {/* Download */}
                            <a
                              href={fileUrl(selected, file.name)}
                              download={file.name}
                              onClick={e => e.stopPropagation()}
                              title="Télécharger"
                              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>

                            {/* Delete — on hover only */}
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(file.name) }}
                              title="Supprimer"
                              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 ${isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-red-900/30' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })}

                      {/* Auto-delete notice */}
                      <div className={`flex items-start gap-2 px-3 pt-3 mt-1 border-t ${divider}`}>
                        <Info className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${textSecondary}`} />
                        <p className={`text-xs leading-relaxed ${textSecondary}`}>
                          Les fichiers bruts et édités seront automatiquement supprimés 14 jours après la session.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2.5 border-t flex items-center gap-2 cursor-pointer transition-colors flex-shrink-0 ${divider} ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'}`}
                >
                  <Upload className={`w-3.5 h-3.5 flex-shrink-0 ${textSecondary}`} />
                  <span className={`text-xs ${textSecondary}`}>Glisser-déposer ou <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>cliquer pour importer</span> · Tous formats acceptés</span>
                  {uploading && <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin ml-auto" />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => { handleUpload(Array.from(e.target.files)); e.target.value = '' }}
      />

      {/* File viewer modal */}
      {preview && (
        <FileViewer
          file={preview.file}
          url={preview.url}
          allFiles={selectedFiles}
          onNavigate={file => setPreview({ file, url: fileUrl(selected, file.name) })}
          onClose={() => setPreview(null)}
          isDark={isDark}
        />
      )}

      {/* Video review modal */}
      {videoReview && selected && (
        <VideoReviewModal
          reservation={selected}
          allFiles={selectedFiles}
          initialFile={videoReview}
          onClose={() => setVideoReview(null)}
        />
      )}
    </Layout>
  )
}
