import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, CheckCircle, ChevronDown, ChevronUp, Circle } from 'lucide-react'
import ClientLayout from '../../components/ClientLayout'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { translations } from '../../i18n/translations'

export default function ClientContact() {
  const { user } = useAuth()
  const { theme, lang } = useApp()
  const t = (k) => translations[lang]?.[k] || k
  const isDark = theme === 'dark'

  const [messages, setMessages] = useState([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [replyTexts, setReplyTexts] = useState({})
  const [sendingReply, setSendingReply] = useState(null)
  const bottomRefs = useRef({})

  const load = () => {
    if (!user) return
    setMessages(Store.getMessages().filter(m =>
      m.from_email === user.email || m.client_email === user.email
    ))
  }

  useEffect(() => { load() }, [user])

  // Mark as seen by client when expanded
  const expand = (msg) => {
    const willOpen = expandedId !== msg.id
    setExpandedId(willOpen ? msg.id : null)
    if (willOpen && msg.unread_for_client) {
      Store.updateMessage(msg.id, { unread_for_client: false })
      load()
    }
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    setTimeout(() => {
      Store.addMessage({
        from_email: user.email,
        from_name: user.name,
        client_email: user.email,
        client_name: user.name,
        subject: subject.trim(),
        body: body.trim(),
        status: 'open',
        replies: [],
        unread_for_client: false,
      })
      load()
      setSubject('')
      setBody('')
      setSending(false)
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    }, 400)
  }

  const handleReply = (msg) => {
    const text = (replyTexts[msg.id] || '').trim()
    if (!text) return
    setSendingReply(msg.id)
    setTimeout(() => {
      const newReply = { from: 'client', name: user.name, body: text, created_at: new Date().toISOString() }
      const updated = { ...msg, replies: [...(msg.replies || []), newReply], read: false }
      Store.updateMessage(msg.id, updated)
      setReplyTexts(prev => ({ ...prev, [msg.id]: '' }))
      setSendingReply(null)
      load()
      setTimeout(() => {
        bottomRefs.current[msg.id]?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    }, 300)
  }

  const card = isDark ? 'bg-zinc-900 border border-zinc-800 rounded-2xl' : 'bg-white border border-gray-200 rounded-2xl shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'

  const unreadCount = messages.filter(m => m.unread_for_client).length

  return (
    <ClientLayout title="Contact SAV">
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Contact SAV</h2>
          {unreadCount > 0 && (
            <span className="bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} réponse{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* New message form */}
        <div className={`${card} p-6`}>
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare size={16} className="text-violet-500" />
            <h3 className={`font-bold text-base ${textPrimary}`}>{t('new_message')}</h3>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle size={26} className="text-green-600" />
              </div>
              <p className={`font-bold text-lg ${textPrimary}`}>{t('message_sent')}</p>
              <p className={`text-sm ${textSecondary}`}>{t('message_sent_sub')}</p>
              <button
                onClick={() => setSent(false)}
                className="mt-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {lang === 'fr' ? 'Nouveau message' : 'New message'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${textPrimary}`}>{t('subject')}</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={lang === 'fr' ? 'Ex : Problème avec ma réservation' : 'Ex: Issue with my reservation'}
                  required
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${textPrimary}`}>{t('message')}</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={lang === 'fr' ? 'Décrivez votre demande en détail...' : 'Describe your request in detail...'}
                  required
                  rows={5}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors resize-none ${inputClass}`}
                />
              </div>
              <button
                type="submit"
                disabled={sending || !subject.trim() || !body.trim()}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Send size={14} />
                {sending ? (lang === 'fr' ? 'Envoi...' : 'Sending...') : t('send')}
              </button>
            </form>
          )}
        </div>

        {/* Message history */}
        <div>
          <h3 className={`font-bold text-base ${textPrimary} mb-3`}>{t('message_history')}</h3>

          {messages.length === 0 ? (
            <div className={`${card} p-12 flex flex-col items-center text-center gap-3`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                <MessageSquare size={20} className={textSecondary} />
              </div>
              <p className={`font-medium ${textPrimary}`}>{lang === 'fr' ? 'Aucun message pour le moment' : 'No messages yet'}</p>
              <p className={`text-sm ${textSecondary}`}>{lang === 'fr' ? 'Vos échanges avec notre équipe apparaîtront ici.' : 'Your exchanges with our team will appear here.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => {
                const isOpen = expandedId === msg.id
                const isClosed = msg.status === 'closed'
                const hasNewReply = msg.unread_for_client && !isOpen

                const statusCls = isClosed
                  ? isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'
                  : 'bg-violet-500/15 text-violet-400'

                return (
                  <div key={msg.id} className={`${card} overflow-hidden ${hasNewReply ? (isDark ? 'ring-1 ring-violet-500/50' : 'ring-1 ring-violet-400') : ''}`}>
                    <button
                      className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'}`}
                      onClick={() => expand(msg)}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-zinc-800' : 'bg-violet-50'}`}>
                          <MessageSquare size={14} className="text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold text-sm truncate ${textPrimary}`}>{msg.subject}</p>
                            {hasNewReply && (
                              <span className="flex-shrink-0 text-[10px] font-bold bg-violet-600 text-white px-1.5 py-px rounded-full">Nouveau</span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${textSecondary}`}>
                            {formatDate(msg.created_at)}
                            {msg.replies?.length > 0 && (
                              <span className="ml-2 text-violet-400 font-semibold">
                                · {msg.replies.length} {lang === 'fr' ? 'message(s)' : 'message(s)'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCls}`}>
                          {isClosed ? (lang === 'fr' ? 'Fermé' : 'Closed') : (lang === 'fr' ? 'Ouvert' : 'Open')}
                        </span>
                        {isOpen ? <ChevronUp size={15} className={textSecondary} /> : <ChevronDown size={15} className={textSecondary} />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className={`border-t px-5 pb-5 pt-4 space-y-3 ${divider}`}>
                        {/* Original message */}
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[10px] font-bold">{user?.name?.charAt(0) || 'C'}</span>
                            </div>
                            <span className={`text-xs font-semibold ${textPrimary}`}>{user?.name}</span>
                            <span className={`text-xs ${textSecondary}`}>· {formatDate(msg.created_at)}</span>
                          </div>
                          <p className={`text-sm leading-relaxed ${textSecondary}`}>{msg.body}</p>
                        </div>

                        {/* Thread replies */}
                        {(msg.replies || []).map((reply, i) => {
                          const isAdmin = reply.from === 'admin'
                          return (
                            <div key={i} className={`p-4 rounded-xl ${
                              isAdmin
                                ? isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                                : isDark ? 'bg-zinc-800' : 'bg-gray-50'
                            } ${isAdmin ? '' : 'ml-4'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-blue-600' : 'bg-violet-600'}`}>
                                  <span className="text-white text-[10px] font-bold">
                                    {isAdmin ? 'L' : (user?.name?.charAt(0) || 'C')}
                                  </span>
                                </div>
                                <span className={`text-xs font-semibold ${isAdmin ? (isDark ? 'text-blue-300' : 'text-blue-700') : textPrimary}`}>
                                  {isAdmin ? (reply.name || 'Level Studios') : reply.name}
                                </span>
                                <span className={`text-xs ${textSecondary}`}>· {formatDate(reply.created_at)}</span>
                              </div>
                              <p className={`text-sm leading-relaxed ${isAdmin ? (isDark ? 'text-blue-100' : 'text-blue-900') : textSecondary}`}>{reply.body}</p>
                            </div>
                          )
                        })}

                        <div ref={el => bottomRefs.current[msg.id] = el} />

                        {/* Reply input — only if open */}
                        {!isClosed && (
                          <div className="flex gap-2 pt-1">
                            <textarea
                              value={replyTexts[msg.id] || ''}
                              onChange={e => setReplyTexts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(msg) } }}
                              placeholder={lang === 'fr' ? 'Votre réponse… (Entrée pour envoyer)' : 'Your reply… (Enter to send)'}
                              rows={2}
                              className={`flex-1 px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-colors ${inputClass}`}
                            />
                            <button
                              onClick={() => handleReply(msg)}
                              disabled={!replyTexts[msg.id]?.trim() || sendingReply === msg.id}
                              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-3 rounded-xl transition-colors self-end py-2.5"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        )}

                        {isClosed && (
                          <p className={`text-xs italic ${textSecondary} px-1`}>
                            {lang === 'fr' ? 'Ce ticket est clôturé.' : 'This ticket is closed.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}
