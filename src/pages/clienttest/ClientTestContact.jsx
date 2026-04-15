import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import ClientTestLayout from '../../components/ClientTestLayout'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'

const ACCENT = '#00bcd4'

export default function ClientTestContact() {
  const { user } = useAuth()
  const [messages,     setMessages]     = useState([])
  const [subject,      setSubject]      = useState('')
  const [body,         setBody]         = useState('')
  const [sending,      setSending]      = useState(false)
  const [sent,         setSent]         = useState(false)
  const [expandedId,   setExpandedId]   = useState(null)
  const [replyTexts,   setReplyTexts]   = useState({})
  const [sendingReply, setSendingReply] = useState(null)
  const bottomRefs = useRef({})

  const load = () => {
    if (!user) return
    setMessages(Store.getMessages().filter(m =>
      m.from_email === user.email || m.client_email === user.email
    ))
  }

  useEffect(() => { load() }, [user])

  const expand = msg => {
    const willOpen = expandedId !== msg.id
    setExpandedId(willOpen ? msg.id : null)
    if (willOpen && msg.unread_for_client) {
      Store.updateMessage(msg.id, { unread_for_client: false })
      load()
    }
  }

  const handleSend = e => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    setTimeout(() => {
      Store.addMessage({
        from: user.name,
        from_email: user.email,
        client_email: user.email,
        subject: subject.trim(),
        body: body.trim(),
        date: new Date().toISOString(),
        read: false,
        unread_for_client: false,
      })
      setSending(false)
      setSent(true)
      setSubject('')
      setBody('')
      load()
      setTimeout(() => setSent(false), 3000)
    }, 600)
  }

  const handleReply = (msgId, parentSubject) => {
    const text = replyTexts[msgId]?.trim()
    if (!text) return
    setSendingReply(msgId)
    setTimeout(() => {
      Store.addMessage({
        from: user.name,
        from_email: user.email,
        client_email: user.email,
        subject: `Re: ${parentSubject}`,
        body: text,
        date: new Date().toISOString(),
        read: false,
        unread_for_client: false,
        parent_id: msgId,
      })
      setReplyTexts(r => ({ ...r, [msgId]: '' }))
      setSendingReply(null)
      load()
    }, 500)
  }

  const unread = messages.filter(m => m.unread_for_client).length

  return (
    <ClientTestLayout title="Contact SAV">
      <div style={{ padding: '88px 28px 40px', maxWidth: 800 }}>

        {/* New message form */}
        <div style={{
          borderRadius: 16, padding: '24px', marginBottom: 32,
          background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e5e5e5', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={15} style={{ color: ACCENT }} />
            Nouveau message
          </h2>

          {sent && (
            <div style={{
              borderRadius: 12, padding: '12px 16px', marginBottom: 16,
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <CheckCircle size={14} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Message envoyé avec succès !</span>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Sujet
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                placeholder="Objet de votre demande…"
                style={{
                  width: '100%', borderRadius: 10, padding: '10px 14px',
                  background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Message
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                required
                placeholder="Décrivez votre demande…"
                rows={4}
                style={{
                  width: '100%', borderRadius: 10, padding: '10px 14px',
                  background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={sending} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 22px', borderRadius: 10, border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                background: ACCENT, color: '#060606', fontSize: 13, fontWeight: 700,
                opacity: sending ? 0.7 : 1, transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#0097a7' }}
                onMouseLeave={e => { if (!sending) e.currentTarget.style.background = ACCENT }}
              >
                <Send size={13} /> {sending ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </form>
        </div>

        {/* Message history */}
        {messages.length > 0 && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e5e5e5', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              Historique
              {unread > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                  background: ACCENT, color: '#060606',
                }}>
                  {unread} non lu{unread > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map(msg => {
                const isOpen = expandedId === msg.id
                const isFromClient = msg.from_email === user.email || msg.client_email === user.email
                const isReply = !!msg.parent_id

                return (
                  <div key={msg.id} style={{
                    borderRadius: 14,
                    background: msg.unread_for_client ? 'rgba(0,188,212,0.05)' : '#141414',
                    border: msg.unread_for_client
                      ? '1px solid rgba(0,188,212,0.15)'
                      : '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}>
                    {/* Header */}
                    <button
                      onClick={() => expand(msg)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
                        textAlign: 'left', gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          {msg.unread_for_client && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />
                          )}
                          <span style={{
                            fontSize: 13, fontWeight: msg.unread_for_client ? 700 : 600,
                            color: '#e5e5e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {msg.subject}
                          </span>
                          {isReply && (
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                              Réponse
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                          {msg.from} · {formatDate(msg.date)}
                        </div>
                      </div>
                      {isOpen
                        ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                        : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />}
                    </button>

                    {/* Body */}
                    {isOpen && (
                      <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '14px 0 16px', lineHeight: 1.6 }}>
                          {msg.body}
                        </p>

                        {/* Reply form */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            value={replyTexts[msg.id] || ''}
                            onChange={e => setReplyTexts(r => ({ ...r, [msg.id]: e.target.value }))}
                            placeholder="Répondre…"
                            style={{
                              flex: 1, borderRadius: 8, padding: '8px 12px',
                              background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
                              color: '#fff', fontSize: 12, outline: 'none',
                            }}
                            onFocus={e => e.target.style.borderColor = ACCENT}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            onKeyDown={e => { if (e.key === 'Enter') handleReply(msg.id, msg.subject) }}
                          />
                          <button
                            onClick={() => handleReply(msg.id, msg.subject)}
                            disabled={sendingReply === msg.id || !replyTexts[msg.id]?.trim()}
                            style={{
                              padding: '8px 14px', borderRadius: 8, border: 'none',
                              background: ACCENT, color: '#060606', cursor: 'pointer',
                              fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                              opacity: (sendingReply === msg.id || !replyTexts[msg.id]?.trim()) ? 0.5 : 1,
                            }}
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div style={{
            borderRadius: 16, padding: '48px 24px',
            background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.07)',
            textAlign: 'center',
          }}>
            <MessageSquare size={32} style={{ color: 'rgba(255,255,255,0.12)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              Aucun message pour le moment. N'hésitez pas à nous contacter.
            </p>
          </div>
        )}
      </div>
    </ClientTestLayout>
  )
}
