import React, { useState, useEffect, useRef } from 'react'
import { Send, Plus, X, MessageSquare } from 'lucide-react'
import Layout from './Layout'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { cn } from '../utils'

// Tous les comptes connus : admin + employés du store
const ADMIN_CONTACT = { id: 'admin', email: 'joe.rappin@gmail.com', name: 'Joe Rappin', role: 'Admin' }

function getAllContacts() {
  return [ADMIN_CONTACT, ...Store.getEmployees()]
}

export default function MessagingPanel({ navItems, title = 'Messagerie' }) {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const [messages, setMessages] = useState([])
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newRecipient, setNewRecipient] = useState('')
  const [newBody, setNewBody] = useState('')
  const bottomRef = useRef(null)
  const myEmail = user?.email

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-500'

  function reload() {
    setMessages(Store.getInternalMessages())
    setContacts(getAllContacts().filter(c => c.email !== myEmail))
  }

  useEffect(() => {
    reload()
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedContact, messages])

  // Construire la liste des conversations à partir des messages
  const contactEmails = new Set()
  messages.forEach(m => {
    if (m.from_email === myEmail) contactEmails.add(m.to_email)
    if (m.to_email === myEmail) contactEmails.add(m.from_email)
  })

  const conversations = Array.from(contactEmails).map(email => {
    const known = contacts.find(c => c.email === email)
    const thread = messages.filter(m =>
      (m.from_email === myEmail && m.to_email === email) ||
      (m.to_email === myEmail && m.from_email === email)
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    const last = thread[thread.length - 1]
    const unread = thread.filter(m => m.to_email === myEmail && !m.read).length
    return {
      email,
      name: known?.name || last?.from_name || last?.to_name || email,
      role: known?.role || '',
      last,
      unread,
    }
  }).sort((a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0))

  const thread = selectedContact
    ? messages.filter(m =>
        (m.from_email === myEmail && m.to_email === selectedContact.email) ||
        (m.to_email === myEmail && m.from_email === selectedContact.email)
      ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : []

  function handleSelectContact(contact) {
    setSelectedContact(contact)
    messages
      .filter(m => m.from_email === contact.email && m.to_email === myEmail && !m.read)
      .forEach(m => Store.updateInternalMessage(m.id, { read: true }))
    reload()
  }

  function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedContact) return
    Store.addInternalMessage({
      from_email: myEmail,
      from_name: user?.name,
      to_email: selectedContact.email,
      to_name: selectedContact.name,
      body: newMessage.trim(),
    })
    setNewMessage('')
    reload()
  }

  function handleNewConversation(e) {
    e.preventDefault()
    if (!newRecipient || !newBody.trim()) return
    const recipient = contacts.find(c => c.email === newRecipient)
    Store.addInternalMessage({
      from_email: myEmail,
      from_name: user?.name,
      to_email: newRecipient,
      to_name: recipient?.name || newRecipient,
      body: newBody.trim(),
    })
    reload()
    setShowNewModal(false)
    setNewBody('')
    setNewRecipient('')
    setSelectedContact({ email: newRecipient, name: recipient?.name || newRecipient, role: recipient?.role || '' })
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return (
    <Layout navItems={navItems} title={title}>
      <div className={cn('border rounded-2xl overflow-hidden flex', card)} style={{ height: '72vh' }}>

        {/* Gauche : liste des conversations */}
        <div className={cn('w-72 flex-shrink-0 flex flex-col border-r', isDark ? 'border-zinc-800' : 'border-gray-200')}>
          <div className={cn('p-4 border-b flex items-center justify-between', isDark ? 'border-zinc-800' : 'border-gray-100')}>
            <div className="flex items-center gap-2">
              <span className={cn('font-semibold text-sm', textPrimary)}>Conversations</span>
              {totalUnread > 0 && (
                <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{totalUnread}</span>
              )}
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
              title="Nouveau message"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className={cn('w-8 h-8 mx-auto mb-2', textSecondary)} />
                <p className={cn('text-xs', textSecondary)}>Aucune conversation</p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-3 text-xs text-violet-400 hover:underline"
                >
                  Commencer une conversation →
                </button>
              </div>
            ) : conversations.map(c => (
              <button
                key={c.email}
                onClick={() => handleSelectContact(c)}
                className={cn(
                  'w-full px-4 py-3 flex items-start gap-3 text-left transition-colors border-b',
                  selectedContact?.email === c.email
                    ? isDark ? 'bg-zinc-800 border-transparent' : 'bg-violet-50 border-transparent'
                    : isDark ? 'hover:bg-zinc-800/50 border-zinc-800' : 'hover:bg-gray-50 border-gray-100'
                )}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white bg-blue-600">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn('text-sm font-medium truncate', textPrimary)}>{c.name}</span>
                    {c.unread > 0 && (
                      <span className="text-[10px] bg-violet-600 text-white rounded-full px-1.5 py-0.5 font-bold flex-shrink-0">{c.unread}</span>
                    )}
                  </div>
                  {c.role && <p className={cn('text-[10px]', textSecondary)}>{c.role}</p>}
                  <p className={cn('text-xs truncate mt-0.5', textSecondary)}>{c.last?.body}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Droite : fil de messages */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className={cn('w-10 h-10 mx-auto mb-2', textSecondary)} />
                <p className={cn('text-sm', textSecondary)}>Sélectionnez une conversation</p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-3 text-sm text-violet-400 hover:underline"
                >
                  ou commencez-en une nouvelle
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header du fil */}
              <div className={cn('px-5 py-3.5 border-b flex items-center gap-3', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-600 flex-shrink-0">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={cn('font-semibold text-sm', textPrimary)}>{selectedContact.name}</div>
                  <div className={cn('text-xs', textSecondary)}>{selectedContact.role || selectedContact.email}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {thread.length === 0 && (
                  <p className={cn('text-center text-xs mt-8', textSecondary)}>Commencez la conversation</p>
                )}
                {thread.map(m => {
                  const isMe = m.from_email === myEmail
                  return (
                    <div key={m.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                        isMe
                          ? 'bg-violet-600 text-white rounded-br-sm'
                          : isDark ? 'bg-zinc-800 text-white rounded-bl-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      )}>
                        <p className="leading-relaxed">{m.body}</p>
                        <p className={cn('text-[10px] mt-1', isMe ? 'text-white/60' : textSecondary)}>
                          {new Date(m.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Zone d'envoi */}
              <form onSubmit={handleSend} className={cn('p-4 border-t flex gap-2', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Votre message..."
                  className={cn('flex-1 px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors', inputClass)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Modale nouveau message */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowNewModal(false)}>
          <div
            className={cn('w-full max-w-sm rounded-2xl p-6 space-y-4', isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200 shadow-xl')}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className={cn('font-bold', textPrimary)}>Nouveau message</h3>
              <button onClick={() => setShowNewModal(false)} className={textSecondary}><X size={18} /></button>
            </div>
            <form onSubmit={handleNewConversation} className="space-y-3">
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textPrimary)}>Destinataire</label>
                <select
                  value={newRecipient}
                  onChange={e => setNewRecipient(e.target.value)}
                  className={cn('w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500', inputClass)}
                  required
                >
                  <option value="">Sélectionner...</option>
                  {contacts.map(c => (
                    <option key={c.id || c.email} value={c.email}>{c.name} — {c.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textPrimary)}>Message</label>
                <textarea
                  value={newBody}
                  onChange={e => setNewBody(e.target.value)}
                  rows={3}
                  placeholder="Votre message..."
                  className={cn('w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors resize-none', inputClass)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!newRecipient || !newBody.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
