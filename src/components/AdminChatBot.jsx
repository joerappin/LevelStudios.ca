import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare, X, Send, ChevronLeft, ChevronDown, ChevronUp,
  Zap, User, Clock, Circle,
} from 'lucide-react'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'

// ─── Réponses standards Level Studios ────────────────────────────────────────
const QUICK_REPLIES = [
  { id: 'q1', label: 'Accueil',         text: 'Bonjour ! Bienvenue chez Level Studios. Comment puis-je vous aider ?' },
  { id: 'q2', label: 'Confirmation',    text: 'Votre réservation est bien confirmée ✅ Notre équipe vous contactera 24h avant votre session.' },
  { id: 'q3', label: 'Fichiers',        text: 'Vos fichiers sont disponibles dans votre espace client, rubrique Bibliothèque.' },
  { id: 'q4', label: 'Délai livraison', text: 'Vos rushes vous seront livrés dans les 24h suivant votre session d\'enregistrement.' },
  { id: 'q5', label: 'Disponibilités',  text: 'Nos studios sont disponibles 7j/7. Vous pouvez réserver directement depuis votre espace client.' },
  { id: 'q6', label: 'Modification',    text: 'Pour modifier ou annuler une réservation, merci de nous contacter au moins 48h à l\'avance.' },
  { id: 'q7', label: 'Prise en compte', text: 'Merci pour votre message, nous en prenons bien note et revenons vers vous dans les plus brefs délais.' },
  { id: 'q8', label: 'Clôture',         text: 'Merci pour votre confiance. N\'hésitez pas à nous recontacter si besoin. Bonne journée ! 🎬' },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)   return 'à l\'instant'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function AdminChatBot() {
  const { user } = useAuth()
  const [open,        setOpen]        = useState(false)
  const [selected,    setSelected]    = useState(null) // conversation active
  const [input,       setInput]       = useState('')
  const [convs,       setConvs]       = useState([])
  const [showQuick,   setShowQuick]   = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // Chargement des conversations
  function refresh() {
    const all = Store.getMessages()
      .filter(m => m.status !== 'closed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setConvs(all)
    setUnreadCount(all.filter(m => !m.read).length)
    // Refresh conversation sélectionnée
    if (selected) {
      const updated = all.find(c => c.id === selected.id)
      if (updated) setSelected(updated)
    }
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (open) refresh()
  }, [open])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selected?.replies])

  useEffect(() => {
    if (selected && open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      // Marquer comme lu
      if (!selected.read) {
        Store.updateMessage(selected.id, { ...selected, read: true })
        setConvs(prev => prev.map(c => c.id === selected.id ? { ...c, read: true } : c))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
  }, [selected?.id, open])

  function selectConv(conv) {
    setSelected(conv)
    setShowQuick(true)
  }

  function sendReply(text) {
    const body = (text || input).trim()
    if (!selected || !body) return
    const reply = {
      from:       'admin',
      name:       user?.name || 'Admin',
      body,
      created_at: new Date().toISOString(),
    }
    const updated = { ...selected, replies: [...(selected.replies || []), reply], read: true }
    Store.updateMessage(selected.id, updated)
    setSelected(updated)
    setConvs(prev => prev.map(c => c.id === updated.id ? updated : c))
    setInput('')
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
  }

  if (user?.type !== 'admin') return null

  // ── Badge non lus ──────────────────────────────────────────────────────────
  const Badge = () => unreadCount > 0 ? (
    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  ) : null

  // ── Liste des conversations ────────────────────────────────────────────────
  const ConvList = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-bold text-white">Messages clients</span>
        </div>
        <span className="text-[10px] bg-zinc-700 text-zinc-300 rounded-full px-2 py-0.5 font-mono">
          {convs.length} ouvert{convs.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600 px-6 text-center">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <span className="text-xs">Aucun message en attente</span>
          </div>
        ) : convs.map(c => (
          <button key={c.id} onClick={() => selectConv(c)}
            className={`w-full text-left px-4 py-3 border-b border-zinc-800/60 hover:bg-zinc-800/60 transition-colors ${
              !c.read ? 'bg-zinc-800/40' : ''
            }`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                {(c.from_name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className={`text-xs font-semibold truncate ${!c.read ? 'text-white' : 'text-zinc-300'}`}>
                    {c.from_name || c.from_email}
                  </span>
                  <span className="text-[10px] text-zinc-600 flex-shrink-0">{timeAgo(c.created_at)}</span>
                </div>
                <p className={`text-[11px] truncate ${!c.read ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {c.subject || c.body?.slice(0, 50)}
                </p>
                {(c.replies?.length || 0) > 0 && (
                  <span className="text-[10px] text-zinc-600">{c.replies.length} réponse{c.replies.length > 1 ? 's' : ''}</span>
                )}
              </div>
              {!c.read && <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-2" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Fil de conversation ────────────────────────────────────────────────────
  const ConvThread = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center gap-2 flex-shrink-0">
        <button onClick={() => setSelected(null)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {(selected.from_name || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{selected.from_name || selected.from_email}</p>
          <p className="text-[10px] text-zinc-500 truncate">{selected.subject}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Message initial du client */}
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
            {(selected.from_name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="bg-zinc-800 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] inline-block">
              <p className="text-xs text-zinc-200 leading-relaxed">{selected.body}</p>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1 ml-1">{timeAgo(selected.created_at)}</p>
          </div>
        </div>

        {/* Réponses */}
        {(selected.replies || []).map((r, i) => {
          const isAdmin = r.from === 'admin'
          return (
            <div key={i} className={`flex items-start gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5 ${
                isAdmin ? 'bg-violet-600' : 'bg-zinc-700'
              }`}>
                {isAdmin ? 'A' : (r.name || '?')[0].toUpperCase()}
              </div>
              <div className={`flex-1 ${isAdmin ? 'flex flex-col items-end' : ''}`}>
                <div className={`rounded-xl px-3 py-2 max-w-[85%] inline-block ${
                  isAdmin
                    ? 'bg-violet-600 rounded-tr-sm'
                    : 'bg-zinc-800 rounded-tl-sm'
                }`}>
                  <p className="text-xs text-white leading-relaxed">{r.body}</p>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1 mx-1">{timeAgo(r.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Réponses rapides */}
      <div className="flex-shrink-0 border-t border-zinc-800">
        <button onClick={() => setShowQuick(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800/40 transition-colors text-zinc-400 hover:text-white">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-semibold">Réponses rapides</span>
          </div>
          {showQuick ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
        {showQuick && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {QUICK_REPLIES.map(qr => (
              <button key={qr.id} onClick={() => setInput(qr.text)}
                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 hover:border-violet-500/40 text-[10px] text-zinc-300 hover:text-white transition-colors">
                {qr.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-zinc-800">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
            }}
            placeholder="Répondre… (Entrée pour envoyer)"
            rows={2}
            className="flex-1 bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-violet-500 resize-none min-w-0"
          />
          <button onClick={() => sendReply()} disabled={!input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl transition-colors flex-shrink-0 mb-0.5">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">

      {/* Panel chat */}
      {open && (
        <div className="w-80 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/60 flex flex-col"
          style={{ height: 480, background: '#18181b' }}>
          {/* Header global */}
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #1d4ed8 100%)' }}>
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#4c1d95]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Chat Admin</p>
              <p className="text-[10px] text-white/60 mt-0.5">Level Studios Support</p>
            </div>
            <button onClick={() => { setOpen(false); setSelected(null) }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Corps */}
          <div className="flex-1 overflow-hidden">
            {selected ? <ConvThread /> : <ConvList />}
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="relative">
        {!open && <span className="absolute inset-0 rounded-full bg-violet-500 opacity-25 animate-ping" />}
        <button onClick={() => setOpen(v => !v)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-violet-500/40"
          style={{ background: open ? '#3f3f46' : 'linear-gradient(135deg, #4c1d95 0%, #2563eb 100%)' }}
          title="Chat admin">
          {open
            ? <X className="w-5 h-5 text-white" />
            : <MessageSquare className="w-6 h-6 text-white" />
          }
        </button>
        <Badge />
      </div>
    </div>
  )
}
