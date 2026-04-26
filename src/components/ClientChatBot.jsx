import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, ChevronDown, ChevronUp, Zap, Bot, Check, CheckCheck } from 'lucide-react'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'

const ACTION_BUTTONS = [
  { id: 'a1',  label: 'Question formule' },
  { id: 'a2',  label: 'Retour montage' },
  { id: 'a3',  label: 'Problème technique' },
  { id: 'a4',  label: 'Incident' },
  { id: 'a5',  label: 'Facture' },
  { id: 'a6',  label: 'Rappel' },
  { id: 'a7',  label: 'Annulation' },
  { id: 'a8',  label: 'Retard' },
  { id: 'a9',  label: 'Absence' },
  { id: 'a10', label: 'Autre demande' },
]

function BotText({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <p className="text-xs text-zinc-200 leading-relaxed">
      {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-white">{p}</strong> : p)}
    </p>
  )
}

// WhatsApp-style read receipt ticks
function ReadReceipt({ adminRead }) {
  if (adminRead) return <CheckCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />
  return <Check className="w-3 h-3 text-zinc-500 flex-shrink-0" />
}

const WELCOME = {
  from: 'bot',
  body: 'Bonjour ! 👋 Je suis votre gestionnaire de compte dédié.\n\nComment puis-je vous aider aujourd\'hui ?',
  created_at: new Date().toISOString(),
}

export default function ClientChatBot() {
  const { user } = useAuth()
  const [open,          setOpen]         = useState(false)
  const [messages,      setMessages]     = useState([WELCOME])
  const [input,         setInput]        = useState('')
  const [showActions,   setShowActions]  = useState(true)
  const [selectedRes,   setSelectedRes]  = useState('')
  const [reservations,  setReservations] = useState([])
  const [pendingAction, setPendingAction] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  useEffect(() => {
    if (user?.type === 'client') {
      const all = Store.getReservations().filter(r => r.client_email === user.email)
      setReservations(all)
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  // Poll admin replies every 8s
  useEffect(() => {
    if (!open || !user) return
    const interval = setInterval(syncReplies, 8000)
    return () => clearInterval(interval)
  }, [open, user, messages])

  function syncReplies() {
    // Find conversation linked to this user in store
    const convs = Store.getMessages().filter(m => m.from_user_id === user?.id)
    if (!convs.length) return
    const latest = convs[0]
    if (!latest.replies?.length) return
    // Inject admin replies not yet shown
    const adminReplies = latest.replies.filter(r => r.from === 'admin')
    const current = messages.filter(m => m.from === 'admin').length
    if (adminReplies.length > current) {
      const newReplies = adminReplies.slice(current)
      setMessages(prev => [...prev, ...newReplies.map(r => ({
        from: 'admin',
        body: r.body,
        created_at: r.created_at,
      }))])
    }
  }

  function buildPrefix(action, res) {
    let prefix = `[USER_ID: ${user?.id || 'unknown'}]`
    if (action) prefix += ` [ACTION: ${action}]`
    if (res) prefix += ` [RES: ${res}]`
    return prefix
  }

  function sendMessage(body, action) {
    const trimmed = body.trim()
    if (!trimmed) return
    const prefix = buildPrefix(action || pendingAction, selectedRes)
    const fullBody = `${prefix} ${trimmed}`
    const visibleBody = action ? `**${action}**${selectedRes ? ` — Résa ${selectedRes}` : ''}\n${trimmed !== action ? trimmed : ''}`.trim() : trimmed

    const clientMsg = { from: 'client', body: visibleBody, raw: fullBody, created_at: new Date().toISOString(), admin_read: false }
    setMessages(prev => [...prev, clientMsg])
    setInput('')
    setPendingAction(null)

    // Save to Store → visible in AdminSAV
    const existing = Store.getMessages().find(m => m.from_user_id === user?.id && m.status === 'open')
    if (existing) {
      const newReply = { from: 'client', name: user?.name, body: fullBody, created_at: new Date().toISOString() }
      Store.updateMessage(existing.id, {
        ...existing,
        replies: [...(existing.replies || []), newReply],
        read: false,
      })
    } else {
      Store.addMessage({
        from_email:   user?.email,
        from_name:    user?.name,
        from_user_id: user?.id,
        client_id:    user?.id,
        subject:      `${action || trimmed.slice(0, 60)}`,
        body:         fullBody,
        status:       'open',
        is_client_chat: true,
      })
    }

    setTimeout(() => {
      setMessages(prev => [...prev, {
        from: 'bot',
        body: 'Votre message a bien été transmis ✅ Notre équipe vous répond dans les plus brefs délais.',
        created_at: new Date().toISOString(),
      }])
    }, 600)
  }

  function handleActionClick(action) {
    setPendingAction(action.label)
    setShowActions(false)
    setMessages(prev => [...prev, {
      from: 'bot',
      body: `Vous avez sélectionné **${action.label}**. Précisez votre demande ci-dessous${reservations.length ? ' (sélectionnez une réservation si besoin)' : ''} puis envoyez.`,
      created_at: new Date().toISOString(),
    }])
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  if (user?.type !== 'client') return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">

      {open && (
        <div className="w-80 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/60 flex flex-col"
          style={{ height: 520, background: '#18181b' }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#1e3a8a]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Level Studios</p>
              <p className="text-[10px] text-white/60 mt-0.5">
                {user?.name} · {user?.id}
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => {
              const isBot    = msg.from === 'bot'
              const isAdmin  = msg.from === 'admin'
              const isClient = msg.from === 'client'
              return (
                <div key={i} className={`flex items-start gap-2 ${isClient ? 'flex-row-reverse' : ''}`}>
                  {(isBot || isAdmin) && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isAdmin ? 'bg-violet-700' : 'bg-gradient-to-br from-blue-700 to-blue-500'
                    }`}>
                      {isAdmin
                        ? <span className="text-[9px] font-bold text-white">LS</span>
                        : <Bot className="w-3 h-3 text-white" />
                      }
                    </div>
                  )}
                  <div className={`flex-1 ${isClient ? 'flex flex-col items-end' : ''}`}>
                    {isAdmin && (
                      <p className="text-[9px] text-violet-400 font-semibold mb-0.5 ml-1">Level Studios</p>
                    )}
                    <div className={`rounded-xl px-3 py-2 max-w-[88%] inline-block ${
                      isClient ? 'bg-blue-600 rounded-tr-sm' : 'bg-zinc-800 rounded-tl-sm'
                    }`}>
                      {isBot || isAdmin
                        ? <BotText text={msg.body} />
                        : <p className="text-xs text-white leading-relaxed whitespace-pre-line">{msg.body}</p>
                      }
                    </div>
                    {isClient && (
                      <div className="flex items-center gap-1 mt-0.5 mr-1">
                        <ReadReceipt adminRead={msg.admin_read} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Actions rapides */}
          <div className="flex-shrink-0 border-t border-zinc-800">
            <button onClick={() => setShowActions(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800/40 transition-colors text-zinc-400 hover:text-white">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-semibold">Actions rapides</span>
                {pendingAction && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 text-[9px] font-bold">
                    {pendingAction}
                  </span>
                )}
              </div>
              {showActions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            {showActions && (
              <div className="px-3 pb-2 space-y-1.5 max-h-28 overflow-y-auto">
                {/* Reservation selector */}
                {reservations.length > 0 && (
                  <select
                    value={selectedRes}
                    onChange={e => setSelectedRes(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700/60 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 outline-none focus:border-blue-500/60"
                  >
                    <option value="">— Réservation (optionnel) —</option>
                    {reservations.map(r => (
                      <option key={r.id} value={r.id}>
                        #{r.id} · {r.date} · {r.studio}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {ACTION_BUTTONS.map(a => (
                    <button key={a.id} onClick={() => handleActionClick(a)}
                      className={`px-2 py-1 rounded-lg border text-[10px] transition-colors ${
                        pendingAction === a.label
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700/60 hover:border-blue-500/40 text-zinc-300 hover:text-white'
                      }`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-3 border-t border-zinc-800">
            {pendingAction && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] text-zinc-500">Action :</span>
                <span className="text-[10px] font-semibold text-blue-400">{pendingAction}</span>
                <button onClick={() => setPendingAction(null)} className="text-zinc-600 hover:text-zinc-400 ml-auto">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
                }}
                placeholder={pendingAction ? `Précisez votre demande…` : 'Votre message… (Entrée pour envoyer)'}
                rows={2}
                className="flex-1 bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-blue-500 resize-none min-w-0"
              />
              <button onClick={() => sendMessage(input)} disabled={!input.trim()}
                className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-xl transition-colors flex-shrink-0 mb-0.5">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="relative">
        {!open && <span className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />}
        <button onClick={() => setOpen(v => !v)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500/40"
          style={{ background: open ? '#3f3f46' : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
          title="Support Level Studios">
          {open ? <X className="w-5 h-5 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  )
}
