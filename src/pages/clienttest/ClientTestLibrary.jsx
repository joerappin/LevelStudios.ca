import React, { useState, useEffect } from 'react'
import {
  Film, Volume2, Image, FileText, File, Download, Play,
  FolderOpen, Clapperboard, Search,
} from 'lucide-react'
import ClientTestLayout from '../../components/ClientTestLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useReservations } from '../../hooks/useReservations'
import { formatDate } from '../../utils'
import VideoReviewModal from '../../components/VideoReviewModal'

const MOCK_RESERVATION = {
  id: 'DEMO001',
  studio: 'Studio A',
  date: new Date().toISOString().split('T')[0],
  duration: 2,
  service: 'argent',
}
const MOCK_FILES = [
  { name: 'rushes_demo.mp4', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
]

const ACCENT = '#00bcd4'

const EXT_VIDEO = ['mp4','mov','avi','mkv','webm','m4v','wmv','flv','ogv','3gp']
const EXT_AUDIO = ['mp3','wav','aac','ogg','flac','m4a','wma','opus','aiff']
const EXT_IMAGE = ['jpg','jpeg','png','gif','webp','bmp','svg','tiff','tif']

function getType(name) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (EXT_VIDEO.includes(ext)) return 'video'
  if (EXT_AUDIO.includes(ext)) return 'audio'
  if (EXT_IMAGE.includes(ext)) return 'image'
  if (ext === 'pdf')           return 'pdf'
  return 'other'
}

function FileIcon({ name, size = 20 }) {
  const type = getType(name)
  if (type === 'video') return <Clapperboard size={size} style={{ color: '#ef4444' }} />
  if (type === 'audio') return <Volume2       size={size} style={{ color: '#8b5cf6' }} />
  if (type === 'image') return <Image         size={size} style={{ color: '#22c55e' }} />
  if (type === 'pdf')   return <FileText      size={size} style={{ color: '#f59e0b' }} />
  return                       <File          size={size} style={{ color: 'rgba(255,255,255,0.35)' }} />
}

function formatBytes(bytes) {
  if (!bytes) return ''
  const k = 1024, sz = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sz[i]
}

export default function ClientTestLibrary() {
  const { user } = useAuth()
  const { reservations } = useReservations({ clientEmail: user?.email })
  const [folders, setFolders] = useState([])
  const [search, setSearch]   = useState('')
  const [videoReview, setVideoReview]   = useState(null)
  const [videoReservation, setVideoReservation] = useState(null)
  const [videoFiles, setVideoFiles]     = useState([])

  useEffect(() => {
    if (!user) return
    fetch('/api/folders')
      .then(r => r.json())
      .then(data => {
        const ef = data.find(d => d.email === user.email)
        if (ef?.reservations) setFolders(ef.reservations)
      })
      .catch(() => {})
  }, [user])

  // Build sections: one per reservation that has files
  const realSections = reservations
    .map(r => {
      const files = folders[r.id] || []
      return { reservation: r, files }
    })
    .filter(s => s.files.length > 0)

  // When no real files exist, show a demo section
  const sections = realSections.length > 0
    ? realSections
    : [{ reservation: MOCK_RESERVATION, files: MOCK_FILES }]

  const allFiles = sections.flatMap(s => s.files.map(f => ({ ...f, reservation: s.reservation })))

  const filtered = search
    ? allFiles.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <ClientTestLayout title="Médiathèque">
      <div style={{ padding: '88px 28px 40px' }}>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 320, marginBottom: 28 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un fichier…"
            style={{
              width: '100%', borderRadius: 10, padding: '9px 12px 9px 34px',
              background: '#161616', border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = ACCENT}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>

        {/* Empty state */}
        {sections.length === 0 ? (
          <div style={{
            borderRadius: 16, padding: '64px 24px',
            background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.07)',
            textAlign: 'center',
          }}>
            <FolderOpen size={40} style={{ color: 'rgba(255,255,255,0.12)', marginBottom: 14 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.25)', margin: '0 0 6px' }}>
              Médiathèque vide
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)', margin: 0 }}>
              Vos fichiers livrés apparaîtront ici après chaque session.
            </p>
          </div>
        ) : search && filtered ? (
          /* Search results */
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour «&nbsp;{search}&nbsp;»
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {filtered.map((f, i) => (
                <FileCard key={i} file={f}
                  onVideoClick={file => { setVideoReview(file); setVideoReservation(f.reservation); setVideoFiles(allFiles.filter(x => x.reservation?.id === f.reservation?.id)) }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Organized by session */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {sections.map(({ reservation: r, files }) => (
              <div key={r.id}>
                {/* Section header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                  paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(0,188,212,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Film size={14} style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#e5e5e5' }}>
                      {r.studio} — {formatDate(r.date)}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                      {files.length} fichier{files.length !== 1 ? 's' : ''}
                      {r.id === 'DEMO001' && <span style={{ marginLeft: 8, color: ACCENT, fontSize: 10, fontWeight: 700 }}>DÉMO</span>}
                    </div>
                  </div>
                </div>

                {/* Files grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {files.map((f, i) => (
                    <FileCard key={i} file={f}
                      onVideoClick={file => { setVideoReview(file); setVideoReservation(r); setVideoFiles(files) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {videoReview && videoReservation && (
        <VideoReviewModal
          reservation={videoReservation}
          allFiles={videoFiles}
          initialFile={videoReview}
          onClose={() => { setVideoReview(null); setVideoReservation(null) }}
        />
      )}
    </ClientTestLayout>
  )
}

function FileCard({ file, onVideoClick }) {
  const [hover, setHover] = useState(false)
  const type = getType(file.name || '')
  const isMedia = type === 'video' || type === 'audio' || type === 'image'
  const isVideo = type === 'video'

  const typeBg = {
    video: 'rgba(239,68,68,0.08)',
    audio: 'rgba(139,92,246,0.08)',
    image: 'rgba(34,197,94,0.08)',
    pdf:   'rgba(245,158,11,0.08)',
    other: 'rgba(255,255,255,0.04)',
  }[type]

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => isVideo && onVideoClick && onVideoClick(file)}
      style={{
        borderRadius: 12, overflow: 'hidden',
        background: '#181818', border: '1px solid rgba(255,255,255,0.05)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 8px 28px rgba(0,0,0,0.5)' : 'none',
        cursor: isVideo ? 'pointer' : 'default',
      }}
    >
      {/* Preview area */}
      <div style={{
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: typeBg, position: 'relative',
      }}>
        <FileIcon name={file.name || ''} size={28} />
        {hover && isMedia && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}>
            {type === 'image' ? (
              <Image size={18} style={{ color: '#fff' }} />
            ) : (
              <Play size={18} style={{ color: '#fff' }} fill="#fff" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#e5e5e5',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
        }}>
          {file.name}
        </div>
        {file.size && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            {formatBytes(file.size)}
          </div>
        )}
        {file.url && hover && !isVideo && (
          <a href={file.url} download={file.name} onClick={e => e.stopPropagation()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
            fontSize: 11, fontWeight: 700, color: ACCENT, textDecoration: 'none',
          }}>
            <Download size={11} /> Télécharger
          </a>
        )}
        {isVideo && hover && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, fontWeight: 700, color: ACCENT }}>
            <Play size={11} fill={ACCENT} /> Voir la vidéo
          </div>
        )}
      </div>
    </div>
  )
}
