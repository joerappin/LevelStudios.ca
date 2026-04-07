import React, { useState, useEffect, useRef } from 'react'
import { Search, Send, MessageSquare, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { formatDate } from '../../utils'

export default function AdminSAV() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const load = (keepSelected) => {
    const msgs = Store.getMessages()
    setMessages(msgs)
    if (keepSelected) {
      const refreshed = msgs.find(m => m.id === keepSelected.id)
      if (refreshed) setSelected(refreshed)
    }
  }

  useEffect(() => { Store.purgeOldMessages(); load() }, [])

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const inputCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'

  const getName = (m) => m.from_name || m.client_name || 'Client'
  const getEmail = (m) => m.from_email || m.client_email || ''

  const filtered = messages.filter(m => {
    const matchSearch = !search ||
      getName(m).toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || m.status === statusFilter
    return matchSearch && matchStatus
  })

  const unreadCount = messages.filter(m => !m.read).length

  const selectMsg = (m) => {
    Store.updateMessage(m.id, { read: true })
    const updated = { ...m, read: true }
    setSelected(updated)
    const msgs = Store.getMessages()
    setMessages(msgs)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }

  const sendReply = () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    setTimeout(() => {
      const newReply = { from: 'admin', name: user?.name || 'Level Studios', body: reply.trim(), created_at: new Date().toISOString() }
      const updated = { ...selected, replies: [...(selected.replies || []), newReply], read: true, unread_for_client: true }
      Store.updateMessage(selected.id, updated)
      setSelected(updated)
      setMessages(Store.getMessages())
      setReply('')
      setSending(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    }, 300)
  }

  const toggleStatus = () => {
    if (!selected) return
    const newStatus = selected.status === 'closed' ? 'open' : 'closed'
    const updated = { ...selected, status: newStatus }
    Store.updateMessage(selected.id, { status: newStatus })
    setSelected(updated)
    setMessages(Store.getMessages())
  }

  const deleteConversation = () => {
    if (!selected) return
    Store.deleteMessage(selected.id)
    setSelected(null)
    setMessages(Store.getMessages())
  }

  return (
    <Layout navItems={ADMIN_NAV} title="SAV">
      <div className="flex flex-col gap-5" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
              placeholder="Rechercher un client ou sujet..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
          >
            <option value="all">Tous</option>
            <option value="open">Ouverts</option>
            <option value="closed">Fermés</option>
          </select>
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Main layout */}
        <div className="grid lg:grid-cols-5 gap-5 flex-1 min-h-0">
          {/* List */}
          <div className="lg:col-span-2 overflow-y-auto space-y-2 pr-1">
            {filtered.length === 0 ? (
              <div className={`text-sm p-6 text-center ${textSecondary}`}>Aucun message</div>
            ) : filtered.map(m => {
              const isClosed = m.status === 'closed'
              const hasUnread = !m.read
              return (
                <button
                  key={m.id}
                  onClick={() => selectMsg(m)}
                  className={`w-full text-left rounded-xl px-4 py-3.5 border transition-colors ${
                    selected?.id === m.id
                      ? isDark ? 'bg-zinc-800 border-violet-500' : 'bg-violet-50 border-violet-400'
                      : isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {hasUnread && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${hasUnread ? textPrimary : textSecondary}`}>{getName(m)}</span>
                        <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isClosed
                            ? isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500'
                            : 'bg-violet-500/15 text-violet-400'
                        }`}>
                          {isClosed ? 'Fermé' : 'Ouvert'}
                        </span>
                      </div>
                      <div className={`text-xs truncate mt-0.5 ${textSecondary}`}>{m.subject}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>{formatDate(m.created_at)}</span>
                        {m.replies?.length > 0 && (
                          <span className="text-xs text-violet-400 font-medium">· {m.replies.length} message{m.replies.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Thread */}
          <div className={`lg:col-span-3 border rounded-2xl flex flex-col min-h-0 ${card}`}>
            {selected ? (
              <>
                {/* Thread header */}
                <div className={`flex items-start justify-between gap-3 px-5 py-4 border-b flex-shrink-0 ${divider}`}>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-sm ${textPrimary}`}>{selected.subject}</h3>
                    <p className={`text-xs mt-0.5 ${textSecondary}`}>
                      {getName(selected)} · {getEmail(selected)} · {formatDate(selected.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={toggleStatus}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        selected.status === 'closed'
                          ? isDark ? 'border-green-700 text-green-400 hover:bg-green-900/20' : 'border-green-300 text-green-700 hover:bg-green-50'
                          : isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {selected.status === 'closed'
                        ? <><CheckCircle size={12} /> Rouvrir</>
                        : <><XCircle size={12} /> Clôturer</>
                      }
                    </button>
                    <button
                      onClick={deleteConversation}
                      className={`p-1.5 rounded-lg border transition-colors ${isDark ? 'border-red-900 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
                      title="Supprimer la conversation"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {/* Original message */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">{getName(selected).charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${textPrimary}`}>{getName(selected)}</span>
                        <span className={`text-xs ${textSecondary}`}>· {formatDate(selected.created_at)}</span>
                      </div>
                      <div className={`rounded-xl rounded-tl-sm p-3.5 text-sm ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-50 text-gray-700'}`}>
                        {selected.body}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {(selected.replies || []).map((r, i) => {
                    const isAdmin = r.from === 'admin'
                    return (
                      <div key={i} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isAdmin ? 'bg-blue-600' : 'bg-violet-600'}`}>
                          <span className="text-white text-[10px] font-bold">
                            {isAdmin ? (r.name?.charAt(0) || 'L') : getName(selected).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                            <span className={`text-xs font-semibold ${isAdmin ? (isDark ? 'text-blue-300' : 'text-blue-700') : textPrimary}`}>
                              {isAdmin ? (r.name || 'Level Studios') : (r.name || getName(selected))}
                            </span>
                            <span className={`text-xs ${textSecondary}`}>· {formatDate(r.created_at)}</span>
                          </div>
                          <div className={`rounded-xl p-3.5 text-sm ${
                            isAdmin
                              ? isDark ? 'rounded-tr-sm bg-blue-500/10 border border-blue-500/20 text-blue-100' : 'rounded-tr-sm bg-blue-50 border border-blue-100 text-blue-900'
                              : isDark ? 'rounded-tl-sm bg-zinc-800 text-zinc-300' : 'rounded-tl-sm bg-gray-50 text-gray-700'
                          }`}>
                            {r.body}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Reply input */}
                <div className={`flex-shrink-0 border-t px-5 py-4 ${divider}`}>
                  {selected.status === 'closed' ? (
                    <p className={`text-xs italic text-center ${textSecondary}`}>Ce ticket est clôturé. Rouvrez-le pour répondre.</p>
                  ) : (
                    <div className="flex gap-2">
                      <textarea
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                        className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-colors ${inputCls}`}
                        rows={2}
                        placeholder="Votre réponse… (Entrée pour envoyer)"
                      />
                      <button
                        onClick={sendReply}
                        disabled={!reply.trim() || sending}
                        className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-3 rounded-xl transition-colors self-end py-2.5"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center gap-3 ${textSecondary}`}>
                <MessageSquare size={32} className="opacity-30" />
                <p className="text-sm">Sélectionnez un message</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
