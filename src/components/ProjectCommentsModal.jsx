import React, { useState, useEffect, useRef } from 'react'
import { X, MessageCircle, Send } from 'lucide-react'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { cn } from '../utils'

export default function ProjectCommentsModal({ project, onClose, onCommentAdded }) {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  const textPrimary   = isDark ? 'text-white'    : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass    = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const divider       = isDark ? 'border-zinc-800' : 'border-gray-100'

  useEffect(() => {
    setComments(Store.getProjectComments(project.id))
  }, [project.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  function submit() {
    if (!text.trim()) return
    Store.addProjectComment({
      projectId: project.id,
      text: text.trim(),
      author: user?.name || user?.email || 'Utilisateur',
      email: user?.email || '',
    })
    const updated = Store.getProjectComments(project.id)
    setComments(updated)
    onCommentAdded?.(project.id, updated.length)
    setText('')
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/65" onClick={onClose}>
      <div
        className={cn('w-full max-w-md rounded-2xl flex flex-col border', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-xl')}
        style={{ maxHeight: '75vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('flex items-center justify-between px-5 py-4 border-b flex-shrink-0', divider)}>
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle size={15} className="text-violet-400 flex-shrink-0" />
            <span className={cn('font-bold text-sm truncate', textPrimary)}>{project.title}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-bold flex-shrink-0">{comments.length}</span>
          </div>
          <button onClick={onClose} className={cn('flex-shrink-0 ml-2', textSecondary)}><X size={18} /></button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <MessageCircle size={32} className={cn('opacity-20', textSecondary)} />
              <p className={cn('text-sm', textSecondary)}>Aucun message pour ce projet</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className={cn('rounded-xl p-3', isDark ? 'bg-zinc-800' : 'bg-gray-50')}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className={cn('text-xs font-semibold', textPrimary)}>{c.author}</span>
                  <span className={cn('text-[10px] flex-shrink-0', textSecondary)}>
                    {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={cn('text-sm leading-relaxed whitespace-pre-wrap', textPrimary)}>{c.text}</p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={cn('px-4 py-3 border-t flex gap-2 flex-shrink-0', divider)}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Écrire un message… (Entrée pour envoyer)"
            className={cn('flex-1 px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500', inputClass)}
          />
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-30 text-white rounded-xl transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
