import React, { useState, useEffect, useRef } from 'react'
import {
  Download, Play, Pause, SkipBack, SkipForward,
  Maximize, Minimize, ChevronDown, Send, Pencil,
  MessageSquare, Film, Clock, Volume2, VolumeX, Trash2,
  Eye, EyeOff, Lock, Unlock, Square, Circle, ArrowUpRight,
  ArrowLeft, Droplets, Type, GripVertical, ZoomIn, ZoomOut,
  LayoutGrid, List, Layers, Highlighter, Undo2, Flag,
  Camera, Repeat2, SlidersHorizontal, Scissors, Home,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'
import { createPageUrl } from '../utils'

// ─── constants ────────────────────────────────────────────────────────────────
const FPS = 25

const PERSON_PALETTE = [
  '#7c3aed','#2563eb','#16a34a','#d97706',
  '#dc2626','#db2777','#0891b2','#65a30d','#9333ea','#ea580c',
]
function personColor(email = '') {
  let h = 0
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) & 0xFFFFFFFF
  return PERSON_PALETTE[Math.abs(h) % PERSON_PALETTE.length]
}
function initials(name = '') {
  const p = name.trim().split(' ')
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function formatTimecode(s) {
  if (!s || isNaN(s)) return '00:00:00:00'
  const tf  = Math.floor(s * FPS)
  const fr  = tf % FPS
  const ts  = Math.floor(tf / FPS)
  const sec = ts % 60
  const min = Math.floor(ts / 60) % 60
  const hr  = Math.floor(ts / 3600)
  return [hr, min, sec, fr].map(n => String(n).padStart(2, '0')).join(':')
}
function formatShort(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2,'0')}`
}

const VIDEO_EXTS = ['mp4','mov','avi','mkv','webm','m4v','wmv','flv','ogv','3gp']
function isVideo(n) { return VIDEO_EXTS.includes(n.split('.').pop()?.toLowerCase() || '') }

const DRAW_COLORS = [
  { name: 'bleu',   value: '#3b82f6' },
  { name: 'rouge',  value: '#ef4444' },
  { name: 'vert',   value: '#22c55e' },
  { name: 'jaune',  value: '#eab308' },
  { name: 'rose',   value: '#ec4899' },
  { name: 'blanc',  value: '#f4f4f5' },
]

const MARKER_COLORS = [
  '#f59e0b','#3b82f6','#22c55e','#ef4444','#a855f7','#ec4899',
]

const DRAW_TOOLS = [
  { id: 'pencil',      icon: Pencil,       label: 'Pinceau',    size: 3  },
  { id: 'highlighter', icon: Highlighter,  label: 'Surligneur', size: 16 },
  { id: 'rect',        icon: Square,       label: 'Rectangle',  size: 3  },
  { id: 'circle',      icon: Circle,       label: 'Ellipse',    size: 3  },
  { id: 'arrow',       icon: ArrowUpRight, label: 'Flèche',     size: 3  },
  { id: 'text',        icon: Type,         label: 'Texte',      size: 3  },
]

const VERSIONS = ['V1', 'V2', 'V3']

const STATUSES = [
  { value: 'a_approuver', label: 'A Approuver', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { value: 'retour',      label: 'Retour',      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  { value: 'valide',      label: 'Validé',       color: 'text-green-400',  bg: 'bg-green-500/10  border-green-500/30' },
]
const SPEEDS    = [1, 1.25, 1.5, 2]
const QUALITIES = ['720p', '1080p', '4K']

// ─── canvas helpers ────────────────────────────────────────────────────────────
function drawShape(ctx, shape) {
  if (!shape) return
  ctx.save()
  ctx.strokeStyle = shape.color || '#fff'
  ctx.lineWidth   = 3
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  const tool = shape.tool || 'pencil'

  if (tool === 'pencil') {
    const pts = shape.points
    if (!pts || pts.length < 2) { ctx.restore(); return }
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.stroke()

  } else if (tool === 'highlighter') {
    const pts = shape.points
    if (!pts || pts.length < 2) { ctx.restore(); return }
    ctx.globalAlpha = 0.35
    ctx.lineWidth   = 18
    ctx.lineCap     = 'square'
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.stroke()

  } else if (tool === 'rect') {
    const { start: s, end: e } = shape
    if (!s || !e) { ctx.restore(); return }
    const x = Math.min(s.x, e.x), y = Math.min(s.y, e.y)
    const w = Math.abs(e.x - s.x),  h = Math.abs(e.y - s.y)
    if (w < 2 || h < 2) { ctx.restore(); return }
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.stroke()

  } else if (tool === 'circle') {
    const { start: s, end: e } = shape
    if (!s || !e) { ctx.restore(); return }
    const cx = (s.x + e.x) / 2, cy = (s.y + e.y) / 2
    const rx = Math.abs(e.x - s.x) / 2, ry = Math.abs(e.y - s.y) / 2
    if (rx < 2 || ry < 2) { ctx.restore(); return }
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke()

  } else if (tool === 'arrow') {
    const { start: s, end: e } = shape
    if (!s || !e) { ctx.restore(); return }
    const dx = e.x - s.x, dy = e.y - s.y
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) { ctx.restore(); return }
    const angle = Math.atan2(dy, dx), hl = 18
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(e.x, e.y)
    ctx.lineTo(e.x - hl * Math.cos(angle - Math.PI / 6), e.y - hl * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(e.x, e.y)
    ctx.lineTo(e.x - hl * Math.cos(angle + Math.PI / 6), e.y - hl * Math.sin(angle + Math.PI / 6))
    ctx.stroke()

  } else if (tool === 'text') {
    const { position: p, text: txt } = shape
    if (!p || !txt) { ctx.restore(); return }
    ctx.font = 'bold 15px sans-serif'
    const metrics = ctx.measureText(txt)
    const pad = 8
    const tw = metrics.width + pad * 2
    const th = 28
    const x = p.x - tw / 2
    const y = p.y - th / 2
    ctx.strokeStyle = shape.color || '#fff'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.rect(x, y, tw, th); ctx.stroke()
    ctx.fillStyle = shape.color || '#fff'
    ctx.textBaseline = 'middle'
    ctx.fillText(txt, x + pad, p.y)
  }
  ctx.restore()
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VideoReviewModal({ reservation, allFiles, initialFile, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isStaff = user?.type === 'admin' || user?.type === 'employee'
  const isChefOrAdmin = user?.type === 'admin' || user?.roleKey === 'chef_projet'
  const isClient = user?.type === 'client' || user?.type === 'clienttest'

  const videoFiles = allFiles.filter(f => isVideo(f.name))
  const [currentFile, setCurrentFile] = useState(initialFile)

  // video state
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [quality,      setQuality]      = useState('1080p')
  const [speed,        setSpeed]        = useState(1)
  const [isMuted,      setIsMuted]      = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showQMenu,    setShowQMenu]    = useState(false)
  const [showSMenu,    setShowSMenu]    = useState(false)
  const [videoSize,    setVideoSize]    = useState(null)

  // fullscreen UI
  const [showOverlay, setShowOverlay] = useState(true)
  const [showHints,   setShowHints]   = useState(false)

  // review state
  const [statusData,     setStatusData]     = useState({ status: 'a_approuver', retourCount: 0 })
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [settings,       setSettings]       = useState({ allowDownload: true, visibleToClient: true })
  const [retourPhase,    setRetourPhase]    = useState(null) // null | 'pending' | 'seen' | 'corrected'

  // retour modal state
  const [showRetourModal,  setShowRetourModal]  = useState(false)
  const [retourEmployeeId, setRetourEmployeeId] = useState('')
  const [employees,        setEmployees]        = useState([])

  // drawing state
  const [drawMode,      setDrawMode]      = useState(false)
  const [drawTool,      setDrawTool]      = useState('pencil')
  const [drawColor,     setDrawColor]     = useState('#3b82f6')
  const [savedPaths,    setSavedPaths]    = useState([])
  const [pendingTextPos, setPendingTextPos] = useState(null) // { x, y } for text tool

  // IN/OUT markers
  const [inPoint,  setInPoint]  = useState(null)
  const [outPoint, setOutPoint] = useState(null)

  // version badge
  const [version,         setVersion]         = useState(null)
  const [showVersionMenu, setShowVersionMenu] = useState(false)

  // comment state
  const [commentText,        setCommentText]        = useState('')
  const [comments,           setComments]           = useState([])
  const [segmentThumbnails,  setSegmentThumbnails]  = useState({})

  // smart tools state
  const [volume,           setVolume]           = useState(1)
  const [showVolume,       setShowVolume]       = useState(false)
  const [loopMode,         setLoopMode]         = useState(false)
  const [lastPathIds,      setLastPathIds]      = useState([])   // undo stack
  const [showMarkerInput,  setShowMarkerInput]  = useState(false)
  const [markerLabel,      setMarkerLabel]      = useState('')
  const [markerColor,      setMarkerColor]      = useState(MARKER_COLORS[0])

  // right panel tabs
  const [rightTab,   setRightTab]   = useState('general') // 'general' | 'sequences'
  const [seqFilter,  setSeqFilter]  = useState('all')     // 'all' | 'validated' | 'rejected'
  const [seqView,    setSeqView]    = useState('list')    // 'list' | 'grid'
  const [seqOrder,   setSeqOrder]   = useState([])        // ordered array of segment ids

  // timeline zoom
  const [timelineZoom, setTimelineZoom] = useState(1)     // 1 | 1.5 | 2 | 3

  // placed text (confirmed with Enter, draggable before finalizing)
  const [pendingPlacedText, setPendingPlacedText] = useState(null) // { id, x, y, text, color }

  // refs
  const videoRef          = useRef(null)
  const canvasRef         = useRef(null)
  const videoContainerRef = useRef(null)
  const leftColRef        = useRef(null)
  const conversationRef   = useRef(null)
  const isDrawingRef      = useRef(false)
  const currentPathRef    = useRef([])
  const shapeStartRef     = useRef(null)
  const shapeEndRef       = useRef(null)
  const livePreviewRef    = useRef(null)
  const savedPathsRef     = useRef([])
  const currentTimeRef    = useRef(0)
  const mouseTimerRef     = useRef(null)
  // timeline drag
  const timelineRef         = useRef(null)
  const timelineScrollRef   = useRef(null)
  const isDraggingRef       = useRef(false)
  const dragRectRef         = useRef(null)
  const durationRef         = useRef(0)
  const rafRef              = useRef(null)
  // placed text drag
  const placedTextDragRef   = useRef(null) // { startMouseX, startMouseY, startX, startY }
  // seq drag-to-reorder
  const seqDragIdRef        = useRef(null)
  const seqOrderRef         = useRef([])

  const fileUrl = (fn) =>
    `/files/${encodeURIComponent(reservation.client_email)}/${reservation.id}/${encodeURIComponent(fn)}`

  // keep refs in sync
  useEffect(() => { savedPathsRef.current = savedPaths }, [savedPaths])
  useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])
  useEffect(() => { durationRef.current = duration }, [duration])
  useEffect(() => { seqOrderRef.current = seqOrder }, [seqOrder])

  // sync seqOrder when segments are added/removed
  useEffect(() => {
    const segIds = comments.filter(c => c.type === 'segment').map(c => c.id)
    setSeqOrder(prev => {
      const existing = prev.filter(id => segIds.includes(id))
      const newIds   = segIds.filter(id => !prev.includes(id))
      return [...existing, ...newIds]
    })
  }, [comments])

  // global drag for placed-text repositioning
  useEffect(() => {
    function onMove(e) {
      if (!placedTextDragRef.current) return
      const { startMouseX, startMouseY, startX, startY, id } = placedTextDragRef.current
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const dx = clientX - startMouseX
      const dy = clientY - startMouseY
      const newX = startX + dx
      const newY = startY + dy
      setPendingPlacedText(prev => prev && prev.id === id ? { ...prev, x: newX, y: newY } : prev)
      setSavedPaths(prev => prev.map(s => s.id === id ? { ...s, position: { x: newX, y: newY } } : s))
    }
    function onUp() { placedTextDragRef.current = null }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend',  onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend',  onUp)
    }
  }, [])

  // global drag listeners for timeline scrubbing
  useEffect(() => {
    function onMove(e) {
      if (!isDraggingRef.current || !dragRectRef.current) return
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const raw = (clientX - dragRectRef.current.left) / dragRectRef.current.width
      const t   = Math.max(0, Math.min(1, raw)) * durationRef.current
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.currentTime = t
        setCurrentTime(t)
        currentTimeRef.current = t
      })
    }
    function onUp() {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      dragRectRef.current   = null
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend',  onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend',  onUp)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed },  [speed])
  useEffect(() => { if (videoRef.current) videoRef.current.muted = isMuted },       [isMuted])
  useEffect(() => { if (videoRef.current) videoRef.current.volume = volume },        [volume])

  // loop IN/OUT
  useEffect(() => {
    if (!loopMode || inPoint === null || outPoint === null) return
    const vid = videoRef.current
    if (!vid) return
    const end = Math.max(inPoint, outPoint)
    const start = Math.min(inPoint, outPoint)
    function check() { if (vid.currentTime >= end) vid.currentTime = start }
    vid.addEventListener('timeupdate', check)
    return () => vid.removeEventListener('timeupdate', check)
  }, [loopMode, inPoint, outPoint])

  // auto-scroll timeline to keep playhead visible when zoomed
  useEffect(() => {
    if (!timelineScrollRef.current || timelineZoom <= 1) return
    const el = timelineScrollRef.current
    const pct = duration > 0 ? currentTime / duration : 0
    const targetScroll = pct * el.scrollWidth - el.clientWidth / 2
    el.scrollLeft = Math.max(0, targetScroll)
  }, [currentTime, timelineZoom, duration])

  // load data on file change
  useEffect(() => {
    const all = Store.getVideoComments()
    setComments(all.filter(c => c.reservation_id === reservation.id && c.file_name === currentFile.name))
    setSavedPaths([])
    setCurrentTime(0); currentTimeRef.current = 0
    setDuration(0)
    setIsPlaying(false)
    setStatusData(Store.getVideoStatus(reservation.id, currentFile.name) || { status: 'a_approuver', retourCount: 0 })
    setSettings(Store.getVideoSettings(reservation.id, currentFile.name))
    setRetourPhase(Store.getRetourPhase(reservation.id, currentFile.name))
    setVersion(Store.getVideoVersion(reservation.id, currentFile.name))
    setInPoint(null)
    setOutPoint(null)
    setPendingTextPos(null)
    setSegmentThumbnails({})
  }, [currentFile.name])

  // redraw canvas whenever time or paths change
  useEffect(() => { redrawCanvas() }, [currentTime, savedPaths])

  // canvas resize
  useEffect(() => {
    window.addEventListener('resize', resizeCanvas)
    const t = setTimeout(resizeCanvas, 100)
    return () => { window.removeEventListener('resize', resizeCanvas); clearTimeout(t) }
  }, [])

  // fullscreen change detection (e.g. user presses Escape)
  useEffect(() => {
    function onFSChange() {
      const isFull = !!document.fullscreenElement
      setIsFullscreen(isFull)
      if (!isFull) { setShowOverlay(true); clearTimeout(mouseTimerRef.current) }
    }
    document.addEventListener('fullscreenchange', onFSChange)
    return () => document.removeEventListener('fullscreenchange', onFSChange)
  }, [])

  // show hints when entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      setShowOverlay(true)
      setShowHints(true)
      const t = setTimeout(() => setShowHints(false), 3200)
      return () => clearTimeout(t)
    }
  }, [isFullscreen])

  // global keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      const tag = e.target?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable
      if (typing) return
      if (e.code === 'Space')       { e.preventDefault(); togglePlay() }
      if (e.code === 'ArrowRight')  { e.preventDefault(); frameStep(true) }
      if (e.code === 'ArrowLeft')   { e.preventDefault(); frameStep(false) }
      if (e.key  === 'i' || e.key === 'I') setInPoint(currentTimeRef.current)
      if (e.key  === 'o' || e.key === 'O') setOutPoint(currentTimeRef.current)
      if (e.key  === 'm' || e.key === 'M') setShowMarkerInput(v => !v)
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        setLastPathIds(prev => {
          if (prev.length === 0) return prev
          const lastId = prev[prev.length - 1]
          setSavedPaths(p => p.filter(s => s.id !== lastId))
          setComments(p => {
            const c = p.find(x => x.path_id === lastId)
            if (c) Store.deleteVideoComment(c.id)
            return p.filter(x => x.path_id !== lastId)
          })
          return prev.slice(0, -1)
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, currentTime, duration])

  // ── canvas ────────────────────────────────────────────────────────────────────
  function resizeCanvas() {
    const canvas = canvasRef.current
    const container = videoContainerRef.current
    if (!canvas || !container) return
    const { width, height } = container.getBoundingClientRect()
    canvas.width  = Math.round(width)
    canvas.height = Math.round(height)
    redrawCanvas()
  }

  function redrawCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    savedPathsRef.current.forEach(shape => {
      if (Math.abs(shape.time - currentTimeRef.current) <= 3) drawShape(ctx, shape)
    })
    if (livePreviewRef.current) drawShape(ctx, livePreviewRef.current)
  }

  // ── drawing handlers ──────────────────────────────────────────────────────────
  function getPoint(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onCanvasMouseDown(e) {
    if (!drawMode) return
    e.preventDefault()
    // finalize any placed text before starting a new drawing
    if (pendingPlacedText) finalizePlacedText()
    if (drawTool === 'text') {
      const pt = getPoint(e)
      if (videoRef.current && !videoRef.current.paused) videoRef.current.pause()
      setPendingTextPos(pt)
      return
    }
    if (videoRef.current && !videoRef.current.paused) videoRef.current.pause()
    isDrawingRef.current = true
    const pt = getPoint(e)
    shapeStartRef.current = pt
    shapeEndRef.current   = pt
    if (drawTool === 'pencil') currentPathRef.current = [pt]
  }

  function onCanvasMouseMove(e) {
    if (!drawMode || !isDrawingRef.current) return
    e.preventDefault()
    const pt = getPoint(e)
    shapeEndRef.current = pt

    if (drawTool === 'pencil') {
      currentPathRef.current.push(pt)
      const ctx = canvasRef.current.getContext('2d')
      const pts = currentPathRef.current
      if (pts.length > 1) {
        ctx.beginPath()
        ctx.strokeStyle = drawColor; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
        ctx.stroke()
      }
    } else {
      livePreviewRef.current = { tool: drawTool, start: shapeStartRef.current, end: pt, color: drawColor }
      redrawCanvas()
    }
  }

  function onCanvasMouseUp() {
    if (!drawMode || !isDrawingRef.current) return
    isDrawingRef.current  = false
    livePreviewRef.current = null

    const time   = videoRef.current?.currentTime || 0
    const pathId = `path_${Date.now()}`
    let newShape

    if (drawTool === 'pencil' || drawTool === 'highlighter') {
      const pts = [...currentPathRef.current]
      currentPathRef.current = []
      if (pts.length < 2) { redrawCanvas(); return }
      newShape = { id: pathId, time, color: drawColor, tool: drawTool, points: pts }
    } else {
      const start = shapeStartRef.current
      const end   = shapeEndRef.current
      if (!start || !end) { redrawCanvas(); return }
      newShape = { id: pathId, time, color: drawColor, tool: drawTool, start, end }
      shapeStartRef.current = null; shapeEndRef.current = null
    }

    setSavedPaths(prev => [...prev, newShape])
    setLastPathIds(prev => [...prev.slice(-19), pathId])

    const LABELS = { pencil: 'Annotation', highlighter: 'Surligneur', rect: 'Rectangle', circle: 'Ellipse', arrow: 'Flèche' }
    const drawComment = {
      id: `draw_${Date.now()}`, path_id: pathId,
      reservation_id: reservation.id, file_name: currentFile.name,
      author: user?.name || 'Utilisateur', author_email: user?.email || '',
      text: `${LABELS[drawTool] || 'Annotation'} — ${formatTimecode(time)}`,
      video_time: time, type: 'drawing', color: drawColor,
      created_at: new Date().toISOString(),
    }
    Store.addVideoComment(drawComment)
    setComments(prev => [...prev, drawComment])
    scrollDown()
  }

  // ── mouse idle (fullscreen) ───────────────────────────────────────────────────
  function handleMouseMove() {
    if (!isFullscreen) return
    setShowOverlay(true)
    clearTimeout(mouseTimerRef.current)
    mouseTimerRef.current = setTimeout(() => setShowOverlay(false), 2500)
  }

  // ── comment ───────────────────────────────────────────────────────────────────
  function sendComment() {
    if (!commentText.trim()) return
    const time = videoRef.current?.currentTime || 0
    const c = {
      id: `comment_${Date.now()}`, reservation_id: reservation.id, file_name: currentFile.name,
      author: user?.name || 'Utilisateur', author_email: user?.email || '',
      text: commentText.trim(), video_time: time, type: 'comment',
      created_at: new Date().toISOString(),
    }
    Store.addVideoComment(c)
    setComments(prev => [...prev, c])
    setCommentText(''); scrollDown()
  }

  function deleteComment(c) {
    Store.deleteVideoComment(c.id)
    setComments(prev => prev.filter(x => x.id !== c.id))
    if (c.path_id) setSavedPaths(prev => prev.filter(p => p.id !== c.path_id))
  }

  function undoDrawing() {
    if (lastPathIds.length === 0) return
    const lastId = lastPathIds[lastPathIds.length - 1]
    setSavedPaths(prev => prev.filter(p => p.id !== lastId))
    setLastPathIds(prev => prev.slice(0, -1))
    const c = comments.find(x => x.path_id === lastId)
    if (c) { Store.deleteVideoComment(c.id); setComments(prev => prev.filter(x => x.id !== c.id)) }
  }

  function addMarker() {
    const time = currentTimeRef.current
    const m = {
      id: `marker_${Date.now()}`,
      reservation_id: reservation.id,
      file_name: currentFile.name,
      author: user?.name || 'Utilisateur',
      author_email: user?.email || '',
      text: markerLabel.trim() || `Marqueur ${formatShort(time)}`,
      video_time: time,
      type: 'marker',
      color: markerColor,
      created_at: new Date().toISOString(),
    }
    Store.addVideoComment(m)
    setComments(prev => [...prev, m])
    setMarkerLabel('')
    setShowMarkerInput(false)
    scrollDown()
  }

  function captureFrame() {
    const vid = videoRef.current
    if (!vid?.videoWidth) return
    const c = document.createElement('canvas')
    c.width = vid.videoWidth; c.height = vid.videoHeight
    c.getContext('2d').drawImage(vid, 0, 0)
    c.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `frame_${formatTimecode(currentTimeRef.current).replace(/:/g, '-')}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/jpeg', 0.92)
  }

  function scrollDown() {
    setTimeout(() => { if (conversationRef.current) conversationRef.current.scrollTop = conversationRef.current.scrollHeight }, 60)
  }

  function confirmText(txt) {
    if (!txt?.trim() || !pendingTextPos) { setPendingTextPos(null); return }
    const time   = videoRef.current?.currentTime || 0
    const pathId = `path_${Date.now()}`
    const newShape = { id: pathId, time, color: drawColor, tool: 'text', position: pendingTextPos, text: txt.trim() }
    setSavedPaths(prev => [...prev, newShape])
    // Place as draggable overlay — finalized when user clicks elsewhere or changes tool
    setPendingPlacedText({ id: pathId, x: pendingTextPos.x, y: pendingTextPos.y, text: txt.trim(), color: drawColor, time })
    setPendingTextPos(null)
  }

  function finalizePlacedText() {
    if (!pendingPlacedText) return
    const { id, color, time } = pendingPlacedText
    const drawComment = {
      id: `draw_${Date.now()}`, path_id: id,
      reservation_id: reservation.id, file_name: currentFile.name,
      author: user?.name || 'Utilisateur', author_email: user?.email || '',
      text: `Texte — ${formatTimecode(time)}`,
      video_time: time, type: 'drawing', color,
      created_at: new Date().toISOString(),
    }
    Store.addVideoComment(drawComment)
    setComments(prev => [...prev, drawComment])
    setPendingPlacedText(null)
    scrollDown()
  }

  function captureFrame(time) {
    return new Promise(resolve => {
      const vid = videoRef.current
      if (!vid || !vid.videoWidth) { resolve(null); return }
      const w = 160
      const h = Math.round(w * vid.videoHeight / vid.videoWidth) || 90
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const draw = () => {
        try {
          canvas.getContext('2d').drawImage(vid, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', 0.55))
        } catch { resolve(null) }
      }
      if (Math.abs(vid.currentTime - time) < 0.1) { draw(); return }
      vid.addEventListener('seeked', draw, { once: true })
      vid.currentTime = time
    })
  }

  async function saveSegment(verdict) {
    if (inPoint === null || outPoint === null) return
    const startT = Math.min(inPoint, outPoint)
    const endT   = Math.max(inPoint, outPoint)
    const segId  = `seg_${Date.now()}`
    const seg = {
      id: segId, reservation_id: reservation.id, file_name: currentFile.name,
      author: user?.name || 'Utilisateur', author_email: user?.email || '',
      text: verdict === 'validated'
        ? `✅ Séquence validée : ${formatTimecode(startT)} → ${formatTimecode(endT)}`
        : `❌ Séquence rejetée : ${formatTimecode(startT)} → ${formatTimecode(endT)}`,
      video_time: startT, in_point: startT, out_point: endT,
      type: 'segment', verdict,
      created_at: new Date().toISOString(),
    }
    Store.addVideoComment(seg)
    setComments(prev => [...prev, seg])
    setInPoint(null); setOutPoint(null)
    scrollDown()
    // Capture first frame of the segment async
    const thumb = await captureFrame(startT)
    if (thumb) setSegmentThumbnails(prev => ({ ...prev, [segId]: thumb }))
  }

  // ── status & settings ─────────────────────────────────────────────────────────
  function handleStatus(v) {
    setShowStatusMenu(false)
    if (v === 'retour') {
      const emps = Store.getEmployees()
      setEmployees(emps)
      setRetourEmployeeId(emps[0]?.email || '')
      setShowRetourModal(true)
      return
    }
    const d = { status: v, retourCount: statusData.retourCount }
    setStatusData(d)
    Store.setVideoStatus(reservation.id, currentFile.name, v, statusData.retourCount)
  }

  function confirmRetour() {
    const rc = statusData.retourCount + 1
    const d = { status: 'retour', retourCount: rc }
    setStatusData(d)
    Store.setVideoStatus(reservation.id, currentFile.name, 'retour', rc)
    Store.setRetourPhase(reservation.id, currentFile.name, 'pending')
    setRetourPhase('pending')
    if (retourEmployeeId) {
      const emp = employees.find(e => e.email === retourEmployeeId)
      Store.addAlert({
        from_email: user?.email,
        from_name:  user?.name,
        to_email:   retourEmployeeId,
        to_name:    emp?.name || retourEmployeeId,
        type:       'Retour',
        message:    `Retour demandé sur le fichier "${currentFile.name}" (réservation #${reservation.id})`,
        reservation_id:    reservation.id,
        reservation_label: `#${reservation.id}`,
        file_name:         currentFile.name,
      })
    }
    setShowRetourModal(false)
  }

  function markRetourCorrected() {
    Store.setRetourPhase(reservation.id, currentFile.name, 'corrected')
    setRetourPhase('corrected')
  }

  function toggleSetting(k) {
    const n = { ...settings, [k]: !settings[k] }
    setSettings(n); Store.setVideoSettings(reservation.id, currentFile.name, n)
  }

  // ── video ─────────────────────────────────────────────────────────────────────
  function seekTo(t) { if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(t, duration)) }
  function frameStep(fwd) { seekTo(currentTime + (fwd ? 1 / FPS : -1 / FPS)) }
  function togglePlay() { isPlaying ? videoRef.current?.pause() : videoRef.current?.play() }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      leftColRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  function selectTool(id) {
    if (pendingPlacedText) finalizePlacedText()
    setDrawTool(id)
    setDrawMode(true)
  }

  const curStatus = STATUSES.find(s => s.value === statusData.status) || STATUSES[0]
  const pct       = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── sub-components ────────────────────────────────────────────────────────────

  // Professional timeline (DaVinci-style): ruler + track + playhead + zoom
  const Timeline = () => {
    const tickInterval = !duration ? 10
      : duration <= 30  ? 5
      : duration <= 120 ? 10
      : duration <= 300 ? 30
      : duration <= 900 ? 60 : 120
    const ticks = []
    for (let t = 0; t <= duration; t += tickInterval) ticks.push(t)

    function startDrag(e) {
      if (!duration) return
      e.preventDefault()
      const rect = timelineRef.current?.getBoundingClientRect()
      if (!rect) return
      if (videoRef.current && !videoRef.current.paused) videoRef.current.pause()
      dragRectRef.current   = rect
      isDraggingRef.current = true
      document.body.style.cursor     = 'ew-resize'
      document.body.style.userSelect = 'none'
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration
      if (videoRef.current) videoRef.current.currentTime = t
      setCurrentTime(t)
      currentTimeRef.current = t
    }


    const ZOOM_STEPS = [1, 1.5, 2, 3, 4]
    const zoomIn  = () => { const i = ZOOM_STEPS.indexOf(timelineZoom); if (i < ZOOM_STEPS.length - 1) setTimelineZoom(ZOOM_STEPS[i + 1]) }
    const zoomOut = () => { const i = ZOOM_STEPS.indexOf(timelineZoom); if (i > 0) setTimelineZoom(ZOOM_STEPS[i - 1]) }

    return (
      <div className="flex-shrink-0 bg-[#1c1c20] border-t border-zinc-800 px-3 pt-2 pb-1.5">
        {/* Zoom controls */}
        <div className="flex items-center justify-end gap-1 mb-1">
          <span className="text-[9px] font-mono text-zinc-600 mr-1">{timelineZoom}×</span>
          <button onClick={zoomOut} disabled={timelineZoom <= 1}
            className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-400 hover:text-white transition-colors">
            <ZoomOut className="w-3 h-3" />
          </button>
          <button onClick={zoomIn} disabled={timelineZoom >= 4}
            className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-400 hover:text-white transition-colors">
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
        {/* Scrollable container when zoomed */}
        <div
          ref={timelineScrollRef}
          className="overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
        {/* Draggable track area — scaled width */}
        <div
          ref={timelineRef}
          className="relative select-none"
          style={{ cursor: 'col-resize', width: timelineZoom > 1 ? `${timelineZoom * 100}%` : '100%' }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          {/* ── Ruler row ── */}
          <div className="relative h-5 mb-1 border-b border-zinc-700/40">
            {/* Tick marks + timecodes */}
            {ticks.map(t => {
              const lp = duration > 0 ? (t / duration) * 100 : 0
              return (
                <div key={t} className="absolute top-0 pointer-events-none" style={{ left: `${lp}%` }}>
                  <div className="w-px h-2.5 bg-zinc-600/70" />
                  <span className="absolute top-2.5 left-0.5 text-[8px] font-mono text-zinc-500 whitespace-nowrap">
                    {formatShort(t)}
                  </span>
                </div>
              )
            })}
            {/* Markers on ruler */}
            {comments.map(c => {
              const lp = duration > 0 ? (c.video_time / duration) * 100 : 0
              if (c.type === 'marker') {
                return (
                  <button key={c.id} onClick={e => { e.stopPropagation(); seekTo(c.video_time) }}
                    title={`${c.text} — ${formatTimecode(c.video_time)}`}
                    className="absolute top-0 -translate-x-1/2 z-20 group"
                    style={{ left: `${lp}%` }}>
                    {/* Flag line */}
                    <div className="w-px h-5" style={{ background: c.color }} />
                    {/* Flag head */}
                    <div className="absolute top-0 left-0 w-3 h-2 rounded-sm flex-shrink-0"
                      style={{ background: c.color }} />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[9px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30"
                      style={{ color: c.color }}>
                      {c.text}
                    </div>
                  </button>
                )
              }
              if (c.type === 'segment') {
                const pc = c.verdict === 'validated' ? '#22c55e' : '#ef4444'
                return (
                  <button key={c.id} onClick={e => { e.stopPropagation(); seekTo(c.video_time) }}
                    title={c.text} className="absolute bottom-0 -translate-x-1/2 hover:scale-125 transition-transform z-10"
                    style={{ left: `${lp}%` }}>
                    <div className="w-0 h-0" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `6px solid ${pc}` }} />
                  </button>
                )
              }
              // regular comment / drawing
              const pc = personColor(c.author_email)
              return (
                <button key={c.id} onClick={e => { e.stopPropagation(); seekTo(c.video_time) }}
                  title={`${c.author} — ${c.text}`}
                  className="absolute bottom-0.5 -translate-x-1/2 hover:scale-125 transition-transform z-10"
                  style={{ left: `${lp}%` }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pc, boxShadow: `0 0 4px ${pc}88` }} />
                </button>
              )
            })}
          </div>

          {/* ── Video track ── */}
          <div
            className="relative rounded overflow-hidden bg-zinc-800/90"
            style={{ height: 36, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)' }}
          >
            {/* Base track fill (progress) */}
            <div
              className="absolute inset-y-0 left-0"
              style={{ width: `${pct}%`, background: 'linear-gradient(to bottom, rgba(37,99,235,0.55), rgba(29,78,216,0.38))' }}
            />

            {/* Saved segment blocks with thumbnails & cut lines */}
            {comments.filter(c => c.type === 'segment').map(c => {
              const lStart = duration > 0 ? (c.in_point  / duration) * 100 : 0
              const lEnd   = duration > 0 ? (c.out_point / duration) * 100 : 0
              const isVal  = c.verdict === 'validated'
              const thumb  = segmentThumbnails[c.id]
              return (
                <div key={c.id} className="absolute inset-y-0 overflow-hidden z-10"
                  style={{ left: `${lStart}%`, width: `${lEnd - lStart}%` }}>
                  {/* Thumbnail */}
                  {thumb && (
                    <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover"
                      style={{ opacity: 0.55 }} draggable={false} />
                  )}
                  {/* Color overlay */}
                  <div className="absolute inset-0"
                    style={{ background: isVal ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)' }} />
                  {/* Left cut line */}
                  <div className="absolute inset-y-0 left-0 w-0.5"
                    style={{ background: isVal ? '#22c55e' : '#ef4444', boxShadow: isVal ? '0 0 4px #22c55e88' : '0 0 4px #ef444488' }} />
                  {/* Right cut line */}
                  <div className="absolute inset-y-0 right-0 w-0.5"
                    style={{ background: isVal ? '#22c55e' : '#ef4444', opacity: 0.6 }} />
                  {/* Verdict icon */}
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 text-sm leading-none pointer-events-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
                    {isVal ? '✅' : '❌'}
                  </span>
                </div>
              )
            })}

            {/* IN/OUT live selection */}
            {inPoint !== null && outPoint !== null && duration > 0 && (
              <div
                className="absolute inset-y-0 z-20"
                style={{
                  left:  `${(Math.min(inPoint, outPoint) / duration) * 100}%`,
                  width: `${(Math.abs(outPoint - inPoint) / duration) * 100}%`,
                  background: 'rgba(96,165,250,0.22)',
                  borderLeft:  '2px solid rgba(96,165,250,0.9)',
                  borderRight: '2px solid rgba(96,165,250,0.9)',
                }}
              />
            )}

            {/* IN marker */}
            {inPoint !== null && duration > 0 && (
              <div className="absolute inset-y-0 w-0.5 z-30"
                style={{ left: `${(inPoint / duration) * 100}%`, background: '#4ade80', boxShadow: '0 0 5px #4ade8099' }}>
                <div className="absolute -top-0 left-0 w-0 h-0" style={{
                  borderTop: '5px solid #4ade80',
                  borderRight: '5px solid transparent',
                }} />
              </div>
            )}
            {/* OUT marker */}
            {outPoint !== null && duration > 0 && (
              <div className="absolute inset-y-0 w-0.5 z-30"
                style={{ left: `${(outPoint / duration) * 100}%`, background: '#f87171', boxShadow: '0 0 5px #f8717199' }}>
                <div className="absolute -top-0 right-0 w-0 h-0" style={{
                  borderTop: '5px solid #f87171',
                  borderLeft: '5px solid transparent',
                }} />
              </div>
            )}

            {/* Track label */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-5">
              <span className="text-[8px] font-bold text-white/15 uppercase tracking-widest">V1</span>
            </div>
          </div>

          {/* ── Playhead — spans ruler + track ── */}
          {duration > 0 && (
            <div
              className="absolute z-40 pointer-events-none"
              style={{ left: `${pct}%`, top: 0, bottom: 0 }}
            >
              {/* Diamond handle on ruler */}
              <div
                className="absolute -translate-x-1/2"
                style={{
                  top: 2,
                  width: 10, height: 10,
                  background: '#ef4444',
                  transform: 'translateX(-50%) rotate(45deg)',
                  boxShadow: '0 0 6px #ef4444bb',
                  pointerEvents: 'all',
                  cursor: 'col-resize',
                }}
              />
              {/* Vertical line through ruler + track */}
              <div
                className="absolute w-px"
                style={{
                  top: 7,
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(to bottom, #ef4444ee, #ef444466)',
                  boxShadow: '0 0 3px #ef444466',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )}
        </div>
        </div> {/* end scrollable */}
      </div>
    )
  }


  const ControlsBar = ({ compact = false }) => (
    <div className={`flex items-center gap-1.5 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'} bg-zinc-950 border-t border-zinc-800/80 flex-shrink-0`}>

      {/* ── Lecture ── */}
      <button onClick={togglePlay} title="Lecture / Pause (Espace)"
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors flex-shrink-0">
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <button onClick={() => frameStep(false)} title="Image précédente (←)"
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
        <SkipBack className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => frameStep(true)} title="Image suivante (→)"
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
        <SkipForward className="w-3.5 h-3.5" />
      </button>

      {/* ── Timecode ── */}
      <div className="flex items-center gap-1 mx-1 flex-shrink-0">
        <span className="text-xs font-mono text-zinc-200 tabular-nums">{formatTimecode(currentTime)}</span>
        <span className="text-zinc-700 text-xs">/</span>
        <span className="text-xs font-mono text-zinc-500 tabular-nums">{formatTimecode(duration)}</span>
      </div>

      {/* ── Volume ── */}
      <div className="relative flex-shrink-0" onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
        <button onClick={() => setIsMuted(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        {showVolume && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 shadow-2xl z-30 flex flex-col items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400">{Math.round(volume * 100)}%</span>
            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
              onChange={e => { setVolume(+e.target.value); if (+e.target.value > 0) setIsMuted(false) }}
              className="h-20 cursor-pointer" style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: '#7c3aed' }} />
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-zinc-800 mx-1 flex-shrink-0" />

      {/* ── IN / OUT / Loop ── */}
      <button onClick={() => setInPoint(currentTime)} title="Point IN (I)"
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors flex-shrink-0 ${
          inPoint !== null ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800/80 text-zinc-500 hover:text-white border border-zinc-700/50'
        }`}>
        IN{inPoint !== null && <span className="opacity-70 ml-0.5">{formatShort(inPoint)}</span>}
      </button>
      <button onClick={() => setOutPoint(currentTime)} title="Point OUT (O)"
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors flex-shrink-0 ${
          outPoint !== null ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800/80 text-zinc-500 hover:text-white border border-zinc-700/50'
        }`}>
        {outPoint !== null && <span className="opacity-70 mr-0.5">{formatShort(outPoint)}</span>}OUT
      </button>
      {inPoint !== null && outPoint !== null && (
        <>
          <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0">{formatShort(Math.abs(outPoint - inPoint))}</span>
          <button onClick={() => setLoopMode(v => !v)} title="Boucle IN/OUT"
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
              loopMode ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}>
            <Repeat2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => saveSegment('validated')} title="Valider la séquence"
            className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-sm leading-none transition-colors flex-shrink-0">✅</button>
          <button onClick={() => saveSegment('rejected')} title="Rejeter la séquence"
            className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-sm leading-none transition-colors flex-shrink-0">❌</button>
          <button onClick={() => { setInPoint(null); setOutPoint(null); setLoopMode(false) }}
            className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 text-xs transition-colors flex-shrink-0" title="Effacer">✕</button>
        </>
      )}
      {(inPoint !== null || outPoint !== null) && !(inPoint !== null && outPoint !== null) && (
        <button onClick={() => { setInPoint(null); setOutPoint(null) }}
          className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 text-xs transition-colors flex-shrink-0">✕</button>
      )}

      <div className="flex-1" />

      {/* ── Capture + Speed + Quality + Fullscreen ── */}
      <button onClick={captureFrame} title="Capturer l'image courante"
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
        <Camera className="w-3.5 h-3.5" />
      </button>
      <div className="relative flex-shrink-0">
        <button onClick={() => { setShowSMenu(v => !v); setShowQMenu(false) }}
          className="px-2 py-1 rounded-lg bg-zinc-800/80 text-[11px] font-mono text-zinc-300 hover:bg-zinc-700 transition-colors border border-zinc-700/50">{speed}×</button>
        {showSMenu && (
          <div className="absolute bottom-full mb-1 right-0 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden z-20 shadow-2xl min-w-[72px]">
            {SPEEDS.map(s => (
              <button key={s} onClick={() => { setSpeed(s); setShowSMenu(false) }}
                className={`w-full px-3 py-2 text-xs font-mono text-left hover:bg-zinc-800 ${speed === s ? 'text-violet-400 font-bold' : 'text-zinc-300'}`}>{s}×</button>
            ))}
          </div>
        )}
      </div>
      <div className="relative flex-shrink-0">
        <button onClick={() => { setShowQMenu(v => !v); setShowSMenu(false) }}
          className="px-2 py-1 rounded-lg bg-zinc-800/80 text-[11px] font-mono text-zinc-300 hover:bg-zinc-700 transition-colors border border-zinc-700/50">{quality}</button>
        {showQMenu && (
          <div className="absolute bottom-full mb-1 right-0 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden z-20 shadow-2xl min-w-[72px]">
            {QUALITIES.map(q => (
              <button key={q} onClick={() => { setQuality(q); setShowQMenu(false) }}
                className={`w-full px-3 py-2 text-xs font-mono text-left hover:bg-zinc-800 ${quality === q ? 'text-violet-400 font-bold' : 'text-zinc-300'}`}>{q}</button>
            ))}
          </div>
        )}
      </div>
      <button onClick={toggleFullscreen}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
        {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
      </button>
    </div>
  )

  const AnnotationBar = () => (
    <div className="flex-shrink-0 bg-[#111113] border-t border-zinc-800/80">
      {/* Marker input panel */}
      {showMarkerInput && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/60">
          <Flag className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Nom du marqueur (optionnel)…"
            value={markerLabel}
            onChange={e => setMarkerLabel(e.target.value)}
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') addMarker(); if (e.key === 'Escape') setShowMarkerInput(false) }}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none min-w-0"
          />
          <div className="flex gap-1 flex-shrink-0">
            {MARKER_COLORS.map(c => (
              <button key={c} onClick={() => setMarkerColor(c)}
                className={`w-4 h-4 rounded-full transition-transform hover:scale-110 ${markerColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900 scale-110' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <button onClick={addMarker} className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors flex-shrink-0">
            Poser
          </button>
          <button onClick={() => setShowMarkerInput(false)} className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors flex-shrink-0">✕</button>
        </div>
      )}

      {/* Main annotation toolbar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5">
        {/* Draw tools */}
        <div className="flex rounded-xl overflow-hidden border border-zinc-700/60 flex-shrink-0">
          {DRAW_TOOLS.map(t => {
            const Icon = t.icon
            const active = drawMode && drawTool === t.id
            return (
              <button key={t.id} title={`${t.label}${t.id === 'pencil' ? ' · cliquer pour activer/désactiver' : ''}`}
                onClick={() => drawMode && drawTool === t.id ? setDrawMode(false) : selectTool(t.id)}
                className={`px-2.5 py-2 transition-colors ${active ? 'bg-violet-600 text-white' : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            )
          })}
        </div>

        {/* Colors — visible only in draw mode */}
        {drawMode && (
          <div className="flex items-center gap-1.5 pl-1 flex-shrink-0">
            {DRAW_COLORS.map(c => (
              <button key={c.name} onClick={() => setDrawColor(c.value)} title={c.name}
                className={`w-4.5 h-4.5 rounded-full transition-all hover:scale-110 flex-shrink-0 ${drawColor === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-125' : ''}`}
                style={{ width: 18, height: 18, backgroundColor: c.value }} />
            ))}
          </div>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-zinc-700/60 mx-0.5 flex-shrink-0" />

        {/* Undo */}
        <button onClick={undoDrawing} disabled={lastPathIds.length === 0}
          title="Annuler dernier dessin (Ctrl+Z)"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Marker */}
        <button onClick={() => setShowMarkerInput(v => !v)} title="Poser un marqueur (M)"
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
            showMarkerInput ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400'
          }`}>
          <Flag className="w-3.5 h-3.5" />
        </button>

        {/* Scissors — clear all drawings */}
        <button onClick={() => { setSavedPaths([]); setLastPathIds([]) }} title="Effacer tous les dessins"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors flex-shrink-0">
          <Scissors className="w-3.5 h-3.5" />
        </button>

        {/* Keyboard hint */}
        <div className="flex-1" />
        <span className="text-[10px] text-zinc-700 hidden lg:block select-none">I · O · M · Ctrl+Z</span>
      </div>
    </div>
  )

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-zinc-950 text-white"
      onClick={() => { setShowQMenu(false); setShowSMenu(false); setShowStatusMenu(false); setShowVersionMenu(false) }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 flex-shrink-0" onClick={e => e.stopPropagation()}>
        {/* Back button — always visible */}
        <button onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex-shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
          {isClient ? 'Médiathèque' : 'Retour'}
        </button>

        {/* Dashboard button — client only */}
        {isClient && (
          <button
            onClick={() => { onClose(); navigate(createPageUrl('ClientDashboard')) }}
            title="Tableau de bord"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex-shrink-0"
          >
            <Home className="w-3.5 h-3.5" />
            Accueil
          </button>
        )}

        {/* Status */}
        <div className="relative">
          <button onClick={() => setShowStatusMenu(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${curStatus.color} ${curStatus.bg}`}>
            {curStatus.label}<ChevronDown className="w-3 h-3" />
          </button>
          {showStatusMenu && (
            <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-20 min-w-[140px] shadow-2xl">
              {STATUSES.filter(s => s.value !== 'retour' || isChefOrAdmin).map(s => (
                <button key={s.value} onClick={() => handleStatus(s.value)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-zinc-700 ${s.color}`}>{s.label}</button>
              ))}
            </div>
          )}
        </div>

        {statusData.retourCount > 0 && (() => {
          const phase = retourPhase
          const cls = phase === 'corrected'
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : phase === 'seen'
            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
            : 'bg-red-500/10 text-red-400 border-red-500/30'
          return (
            <span className={`border px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${cls}`}>
              Retour #{statusData.retourCount}
            </span>
          )
        })()}

        {/* Employee: mark retour as corrected */}
        {!isChefOrAdmin && statusData.status === 'retour' && retourPhase !== 'corrected' && (
          <button
            onClick={markRetourCorrected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 text-xs font-semibold transition-colors flex-shrink-0"
          >
            ✓ Retour corrigé
          </button>
        )}

        {/* Version badge — center */}
        <div className="flex-1 flex justify-center" onClick={e => e.stopPropagation()}>
          {isChefOrAdmin ? (
            <div className="relative">
              <button
                onClick={() => setShowVersionMenu(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                  version
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                {version || 'Version'}<ChevronDown className="w-3 h-3" />
              </button>
              {showVersionMenu && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-20 shadow-2xl min-w-[80px]">
                  {version && (
                    <button
                      onClick={() => { setVersion(null); Store.setVideoVersion(reservation.id, currentFile.name, null); setShowVersionMenu(false) }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-zinc-700 text-zinc-500"
                    >— Aucune</button>
                  )}
                  {VERSIONS.map(v => (
                    <button
                      key={v}
                      onClick={() => { setVersion(v); Store.setVideoVersion(reservation.id, currentFile.name, v); setShowVersionMenu(false) }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-zinc-700 ${version === v ? 'text-blue-400' : 'text-zinc-300'}`}
                    >{v}</button>
                  ))}
                </div>
              )}
            </div>
          ) : version ? (
            <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold">
              {version}
            </span>
          ) : null}
        </div>

        {/* Filename — right */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Film className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <span className="text-sm text-zinc-300 font-medium truncate max-w-[260px]">{currentFile.name}</span>
        </div>

        {/* Download button — admin/chef only */}
        {isChefOrAdmin && (
          <a
            href={fileUrl(currentFile.name)}
            download={currentFile.name}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger
          </a>
        )}
      </div>

      {/* ── Media bar ── */}
      {videoFiles.length > 1 && (
        <div className="flex gap-2 px-4 py-2 border-b border-zinc-800 overflow-x-auto flex-shrink-0 bg-zinc-900/60">
          {videoFiles.map((f, i) => (
            <button key={i} onClick={() => setCurrentFile(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs flex-shrink-0 font-medium transition-colors ${
                f.name === currentFile.name ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}>
              <Film className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{f.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left column — video + controls */}
        <div
          ref={leftColRef}
          className="flex-1 flex flex-col bg-black min-w-0 relative"
          onMouseMove={handleMouseMove}
          onClick={e => e.stopPropagation()}
        >
          {/* Video + canvas */}
          <div ref={videoContainerRef} className="flex-1 relative flex items-center justify-center bg-black overflow-hidden min-h-0">
            <video
              ref={videoRef}
              key={fileUrl(currentFile.name)}
              className="max-w-full max-h-full"
              style={{ pointerEvents: 'none', display: 'block' }}
              onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
              onLoadedMetadata={e => {
                setDuration(e.target.duration)
                setVideoSize({ w: e.target.videoWidth, h: e.target.videoHeight })
                setTimeout(resizeCanvas, 80)
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            >
              <source src={fileUrl(currentFile.name)} />
            </video>

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ cursor: drawMode ? (drawTool === 'text' ? 'text' : 'crosshair') : 'default', pointerEvents: drawMode ? 'all' : 'none' }}
              onMouseDown={onCanvasMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
              onMouseLeave={onCanvasMouseUp}
            />

            {/* Text input overlay for text tool */}
            {pendingTextPos && (
              <div
                className="absolute z-30 flex flex-col items-center gap-1"
                style={{ left: pendingTextPos.x, top: pendingTextPos.y, transform: 'translate(-50%, -50%)' }}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
              >
                <input
                  autoFocus
                  id="video-text-input"
                  type="text"
                  placeholder="Tapez votre texte…"
                  className="bg-black/80 rounded px-2 py-1 text-sm font-bold outline-none min-w-[140px] max-w-[280px] placeholder-white/30"
                  style={{ border: `2px solid ${drawColor}`, color: drawColor }}
                  onKeyDown={e => {
                    e.stopPropagation()
                    if (e.key === 'Enter') confirmText(e.target.value)
                    if (e.key === 'Escape') setPendingTextPos(null)
                  }}
                  onChange={e => e.stopPropagation()}
                />
                <div className="flex gap-1">
                  <button
                    className="px-2 py-0.5 text-xs rounded font-semibold bg-black/80 text-white/60 hover:text-white border border-white/20"
                    onMouseDown={e => { e.preventDefault(); setPendingTextPos(null) }}
                  >Annuler</button>
                  <button
                    className="px-2 py-0.5 text-xs rounded font-semibold text-black"
                    style={{ backgroundColor: drawColor }}
                    onMouseDown={e => {
                      e.preventDefault()
                      const inp = document.getElementById('video-text-input')
                      confirmText(inp?.value || '')
                    }}
                  >Valider ↵</button>
                </div>
              </div>
            )}

            {/* Draggable placed text overlay */}
            {pendingPlacedText && (
              <div
                className="absolute z-30 cursor-move select-none group"
                style={{ left: pendingPlacedText.x, top: pendingPlacedText.y, transform: 'translate(-50%, -50%)' }}
                onMouseDown={e => {
                  e.preventDefault(); e.stopPropagation()
                  const rect = videoContainerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  placedTextDragRef.current = {
                    startMouseX: e.clientX, startMouseY: e.clientY,
                    startX: pendingPlacedText.x, startY: pendingPlacedText.y,
                    id: pendingPlacedText.id,
                  }
                }}
              >
                <div
                  className="px-2 py-1 text-sm font-bold rounded"
                  style={{ border: `2px dashed ${pendingPlacedText.color}`, color: pendingPlacedText.color, backgroundColor: 'rgba(0,0,0,0.75)' }}
                >
                  {pendingPlacedText.text}
                  <span className="ml-2 text-xs opacity-50">↕</span>
                </div>
                <button
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={e => { e.stopPropagation(); finalizePlacedText() }}
                  title="Ancrer le texte"
                >✓</button>
              </div>
            )}

            {/* Watermark — top-left & bottom-right */}
            {settings.showWatermark && (
              <>
                <div className="absolute top-5 left-5 pointer-events-none select-none z-10"
                  style={{ transform: 'rotate(-8deg)', transformOrigin: 'top left' }}>
                  <span className="text-white/20 font-black text-2xl tracking-widest uppercase">LEVEL STUDIOS</span>
                </div>
                <div className="absolute bottom-20 right-5 pointer-events-none select-none z-10"
                  style={{ transform: 'rotate(-8deg)', transformOrigin: 'bottom right' }}>
                  <span className="text-white/20 font-black text-2xl tracking-widest uppercase">LEVEL STUDIOS</span>
                </div>
              </>
            )}

            {/* Resolution — always visible top-right */}
            {videoSize && (
              <div className="absolute top-3 right-3 text-[11px] font-mono text-white/40 select-none pointer-events-none bg-black/30 px-2 py-0.5 rounded">
                {videoSize.w} × {videoSize.h}
              </div>
            )}

            {/* Keyboard shortcuts hint on fullscreen activation */}
            {showHints && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="bg-black/85 backdrop-blur-sm rounded-2xl px-10 py-7 flex gap-10 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="px-5 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-medium text-sm tracking-widest">ESPACE</div>
                    <span className="text-xs text-white/60">Lecture / Pause</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-lg">←</div>
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-lg">→</div>
                    </div>
                    <span className="text-xs text-white/60">Image par image</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fullscreen overlay controls — timeline masquée, uniquement la barre de lecture */}
            {isFullscreen && (
              <div
                className={`absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
              >
                {ControlsBar({ compact: true })}
              </div>
            )}
          </div>

          {/* Normal mode controls (hidden in fullscreen) */}
          {!isFullscreen && (
            <>
              {AnnotationBar()}
              {Timeline()}
              {ControlsBar({})}
            </>
          )}
        </div>

        {/* Right column */}
        <div className="w-80 flex flex-col border-l border-zinc-800 bg-zinc-900 flex-shrink-0">

          {/* Admin/Chef toggles */}
          {isChefOrAdmin && (
            <div className="px-4 py-3 border-b border-zinc-800 space-y-2 flex-shrink-0">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Espace client</p>
              <button onClick={() => toggleSetting('visibleToClient')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  settings.visibleToClient ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}>
                {settings.visibleToClient ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {settings.visibleToClient ? 'Visible dans l\'espace client' : 'Masqué dans l\'espace client'}
              </button>
              <button onClick={() => toggleSetting('allowDownload')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  settings.allowDownload ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}>
                {settings.allowDownload ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {settings.allowDownload ? 'Téléchargement autorisé' : 'Téléchargement désactivé'}
              </button>
              <button onClick={() => toggleSetting('showWatermark')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  settings.showWatermark ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}>
                <Droplets className="w-3.5 h-3.5" />
                {settings.showWatermark ? 'Watermark activé' : 'Watermark désactivé'}
              </button>
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex border-b border-zinc-800 flex-shrink-0">
            <button
              onClick={() => setRightTab('general')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                rightTab === 'general'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Général
              <span className="bg-zinc-700/70 text-zinc-400 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums">
                {comments.filter(c => c.type !== 'segment').length}
              </span>
            </button>
            <button
              onClick={() => setRightTab('sequences')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                rightTab === 'sequences'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Séquences
              <span className="bg-zinc-700/70 text-zinc-400 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums">
                {comments.filter(c => c.type === 'segment').length}
              </span>
            </button>
          </div>

          {/* ── TAB: Général ── */}
          {rightTab === 'general' && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div ref={conversationRef} className="flex-1 overflow-y-auto p-3 space-y-2">
              {comments.filter(c => c.type !== 'segment').length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600">
                  <MessageSquare className="w-8 h-8 opacity-20" />
                  <span className="text-xs">Aucun commentaire</span>
                </div>
              ) : comments.filter(c => c.type !== 'segment').map(c => {
                const pc = personColor(c.author_email)
                const canDel = c.author_email === user?.email || user?.type === 'admin'
                return (
                  <div key={c.id} className="group relative p-3 rounded-xl bg-zinc-800 border border-zinc-700 cursor-pointer hover:bg-zinc-800/80 transition-colors"
                    onClick={() => seekTo(c.video_time)}>
                    {canDel && (
                      <button onClick={e => { e.stopPropagation(); deleteComment(c) }}
                        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 text-zinc-500 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: pc }}>
                        {initials(c.author)}
                      </div>
                      <span className="text-xs font-semibold text-white truncate flex-1">{c.author}</span>
                      <button onClick={e => { e.stopPropagation(); seekTo(c.video_time) }}
                        className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{ backgroundColor: pc + '22', color: pc }}>
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimecode(c.video_time)}
                      </button>
                    </div>
                    {c.type === 'drawing' ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-xs text-zinc-400 italic">{c.text}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-200 leading-snug pr-4">{c.text}</p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-1.5">
                      {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )
              })}
            </div>
            {/* Comment input — sticky bottom */}
            <div className="flex-shrink-0 p-3 border-t border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-2">
                <input
                  type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') sendComment() }}
                  placeholder={`Commenter — ${formatTimecode(currentTime)}`}
                  className="flex-1 bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-violet-500 min-w-0"
                />
                <button onClick={sendComment} disabled={!commentText.trim()}
                  className="w-8 h-8 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl transition-colors flex-shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            </div>
          )}

          {/* ── TAB: Séquences ── */}
          {rightTab === 'sequences' && (() => {
            const allSegs = comments.filter(c => c.type === 'segment')
            const orderedSegs = seqOrder
              .map(id => allSegs.find(s => s.id === id))
              .filter(Boolean)
              .concat(allSegs.filter(s => !seqOrder.includes(s.id)))
            const filtered = seqFilter === 'all' ? orderedSegs
              : orderedSegs.filter(s => s.verdict === seqFilter)

            function handleSeqDragStart(e, id) {
              seqDragIdRef.current = id
              e.dataTransfer.effectAllowed = 'move'
            }
            function handleSeqDragOver(e, id) {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }
            function handleSeqDrop(e, targetId) {
              e.preventDefault()
              const dragId = seqDragIdRef.current
              if (!dragId || dragId === targetId) return
              setSeqOrder(prev => {
                const base = prev.length ? prev : orderedSegs.map(s => s.id)
                const arr  = [...base]
                const from = arr.indexOf(dragId)
                const to   = arr.indexOf(targetId)
                if (from === -1 || to === -1) return base
                arr.splice(from, 1)
                arr.splice(to, 0, dragId)
                return arr
              })
              seqDragIdRef.current = null
            }

            return (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Toolbar */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800 flex-shrink-0">
                  {/* Filter */}
                  <div className="flex rounded-lg overflow-hidden border border-zinc-700 flex-1">
                    {[
                      { v: 'all',       label: 'Tous' },
                      { v: 'validated', label: '✅' },
                      { v: 'rejected',  label: '❌' },
                    ].map(f => (
                      <button key={f.v} onClick={() => setSeqFilter(f.v)}
                        className={`flex-1 text-xs py-1 font-medium transition-colors ${
                          seqFilter === f.v ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}>{f.label}</button>
                    ))}
                  </div>
                  {/* View toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                    <button onClick={() => setSeqView('list')}
                      className={`p-1.5 transition-colors ${seqView === 'list' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setSeqView('grid')}
                      className={`p-1.5 transition-colors ${seqView === 'grid' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-600">
                    <Layers className="w-8 h-8 opacity-20" />
                    <span className="text-xs">Aucune séquence</span>
                  </div>
                ) : seqView === 'list' ? (
                  /* LIST VIEW */
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {filtered.map((seg, idx) => {
                      const isVal  = seg.verdict === 'validated'
                      const dur    = seg.out_point - seg.in_point
                      const thumb  = segmentThumbnails[seg.id]
                      const canDel = seg.author_email === user?.email || user?.type === 'admin'
                      return (
                        <div
                          key={seg.id}
                          draggable
                          onDragStart={e => handleSeqDragStart(e, seg.id)}
                          onDragOver={e => handleSeqDragOver(e, seg.id)}
                          onDrop={e => handleSeqDrop(e, seg.id)}
                          className={`group relative flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                            isVal
                              ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                              : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                          }`}
                          onClick={() => seekTo(seg.in_point)}
                        >
                          {/* Drag handle */}
                          <div className="text-zinc-600 group-hover:text-zinc-400 cursor-grab flex-shrink-0">
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          {/* Order number */}
                          <span className="text-[10px] font-mono font-bold text-zinc-500 w-4 text-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          {/* Thumbnail */}
                          {thumb ? (
                            <img src={thumb} alt="" className="w-12 h-7 object-cover rounded flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-7 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0">
                              <Film className="w-3 h-3 text-zinc-500" />
                            </div>
                          )}
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-base leading-none">{isVal ? '✅' : '❌'}</span>
                              <span className={`text-[10px] font-semibold ${isVal ? 'text-green-400' : 'text-red-400'}`}>
                                {isVal ? 'Validée' : 'Rejetée'}
                              </span>
                            </div>
                            <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
                              {formatTimecode(seg.in_point)} → {formatTimecode(seg.out_point)}
                            </div>
                            <div className="text-[9px] font-mono text-zinc-600">
                              durée {formatShort(dur)}
                            </div>
                          </div>
                          {/* Delete */}
                          {canDel && (
                            <button onClick={e => { e.stopPropagation(); deleteComment(seg) }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-all flex-shrink-0">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* GRID VIEW */
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {filtered.map((seg, idx) => {
                        const isVal  = seg.verdict === 'validated'
                        const dur    = seg.out_point - seg.in_point
                        const thumb  = segmentThumbnails[seg.id]
                        const canDel = seg.author_email === user?.email || user?.type === 'admin'
                        return (
                          <div
                            key={seg.id}
                            draggable
                            onDragStart={e => handleSeqDragStart(e, seg.id)}
                            onDragOver={e => handleSeqDragOver(e, seg.id)}
                            onDrop={e => handleSeqDrop(e, seg.id)}
                            className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-colors ${
                              isVal
                                ? 'border-green-500/30 hover:border-green-500/50'
                                : 'border-red-500/30 hover:border-red-500/50'
                            }`}
                            onClick={() => seekTo(seg.in_point)}
                          >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-zinc-800">
                              {thumb ? (
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Film className="w-5 h-5 text-zinc-600" />
                                </div>
                              )}
                              {/* Verdict badge */}
                              <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isVal ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
                              }`}>
                                {isVal ? '✅' : '❌'}
                              </div>
                              {/* Order badge */}
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-[9px] font-bold text-white">
                                {idx + 1}
                              </div>
                              {/* Drag overlay */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <GripVertical className="w-5 h-5 text-white" />
                              </div>
                              {/* Delete */}
                              {canDel && (
                                <button onClick={e => { e.stopPropagation(); deleteComment(seg) }}
                                  className="absolute bottom-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 text-white">
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                            <div className="px-2 py-1.5 bg-zinc-900">
                              <div className="text-[9px] font-mono text-zinc-400">
                                {formatTimecode(seg.in_point)} → {formatTimecode(seg.out_point)}
                              </div>
                              <div className="text-[9px] text-zinc-600">{formatShort(dur)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── Retour modal ── */}
      {showRetourModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowRetourModal(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-white mb-1">Demande de retour</h3>
            <p className="text-xs text-zinc-400 mb-4">Sélectionnez l'employé à notifier pour ce retour sur <span className="text-white font-medium">{currentFile.name}</span>.</p>
            <select
              value={retourEmployeeId}
              onChange={e => setRetourEmployeeId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 mb-4"
            >
              {employees.length === 0
                ? <option value="">Aucun employé disponible</option>
                : employees.map(emp => (
                    <option key={emp.email} value={emp.email}>{emp.name} — {emp.roleKey || emp.role || 'employé'}</option>
                  ))
              }
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowRetourModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
                Annuler
              </button>
              <button onClick={confirmRetour} disabled={!retourEmployeeId}
                className="flex-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
                Confirmer le retour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
