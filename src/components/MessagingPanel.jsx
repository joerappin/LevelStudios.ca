import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Plus, X, Trash2, Inbox, AlertTriangle, Reply, Paperclip,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, Search, FileText, Mail, FilePenLine,
  Highlighter, Tag,
} from 'lucide-react'
import Layout from './Layout'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'

// ─── Constants ────────────────────────────────────────────────────────────────
const BUBBLE_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500',
  'bg-red-500', 'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500',
]
const FONTS = [
  { label: 'Sans-serif', value: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  { label: 'Arial',      value: 'Arial,sans-serif' },
  { label: 'Georgia',    value: 'Georgia,serif' },
  { label: 'Courier',    value: '"Courier New",monospace' },
  { label: 'Times',      value: '"Times New Roman",serif' },
  { label: 'Verdana',    value: 'Verdana,sans-serif' },
]
const SIZES = ['10', '12', '14', '16', '18', '24', '32', '48']
const LABEL_PALETTE = ['#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4','#F97316']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBubbleColor(email = '') {
  let h = 0
  for (const c of email) h = c.charCodeAt(0) + ((h << 5) - h)
  return BUBBLE_COLORS[Math.abs(h) % BUBBLE_COLORS.length]
}
function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
function initials(name = '?') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ─── RecipientRow ─────────────────────────────────────────────────────────────
function RecipientRow({ label, recipients, onAdd, onRemove, allContacts, isDark, textPrimary, textSecondary }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef()

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const existing  = new Set(recipients.map(r => r.email))
  const available = allContacts.filter(c => !existing.has(c.email))
  const dropBg    = isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200 shadow-xl'

  return (
    <div className={`flex items-start gap-2 px-4 py-2 border-b ${isDark ? 'border-zinc-700' : 'border-gray-100'}`}>
      <span className={`text-xs font-semibold pt-2 w-7 flex-shrink-0 ${textSecondary}`}>{label}</span>
      <div ref={wrapRef} className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 relative py-0.5">
        {recipients.map(r => (
          <span key={r.email} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium ${getBubbleColor(r.email)}`}>
            {r.name || r.email}
            <button type="button" onClick={() => onRemove(r.email)} className="hover:opacity-75"><X size={9} /></button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
            open
              ? isDark ? 'border-violet-500 text-violet-400 bg-violet-500/10' : 'border-violet-400 text-violet-600 bg-violet-50'
              : isDark ? 'border-zinc-600 text-zinc-400 hover:border-violet-500 hover:text-violet-400' : 'border-gray-300 text-gray-400 hover:border-violet-400 hover:text-violet-500'
          }`}
        >
          <Plus size={10} />
          {recipients.length === 0 ? 'Ajouter' : ''}
        </button>

        {open && (
          <div className={`absolute top-full left-0 mt-1 w-72 border rounded-xl z-30 overflow-y-auto ${dropBg}`} style={{ maxHeight: 220 }}>
            {available.length === 0 ? (
              <p className={`px-4 py-3 text-xs text-center ${textSecondary}`}>Tous les contacts sont ajoutés</p>
            ) : available.map(s => (
              <button key={s.email} type="button"
                onMouseDown={e => { e.preventDefault(); onAdd(s) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-violet-50'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${getBubbleColor(s.email)}`}>
                  {initials(s.name)}
                </span>
                <div>
                  <div className={`text-sm font-medium ${textPrimary}`}>{s.name}</div>
                  <div className={`text-[10px] ${textSecondary}`}>{s.role || s.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── RichTextToolbar ──────────────────────────────────────────────────────────
function RichTextToolbar({ editorRef, isDark }) {
  const textColorRef = useRef()
  const bgColorRef   = useRef()

  const exec = (cmd, val = null) => {
    const ed = editorRef.current
    if (!ed) return
    ed.focus()
    document.execCommand('styleWithCSS', false, true)
    document.execCommand(cmd, false, val)
  }

  const applySize = (px) => {
    const ed = editorRef.current
    if (!ed) return
    ed.focus()
    document.execCommand('styleWithCSS', false, true)
    document.execCommand('fontSize', false, '7')
    ed.querySelectorAll('font[size="7"]').forEach(el => {
      el.removeAttribute('size')
      el.style.fontSize = px + 'px'
    })
  }

  const btn = `p-1.5 rounded-md transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-gray-100 text-gray-600'}`
  const sel = `text-xs border rounded-md px-1.5 py-1 outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`
  const sep = `w-px h-5 self-center flex-shrink-0 mx-0.5 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`

  return (
    <div className={`flex items-center flex-wrap gap-0.5 px-3 py-2 border-b ${isDark ? 'border-zinc-700 bg-zinc-900/60' : 'border-gray-200 bg-gray-50'}`}>
      <select onChange={e => exec('fontName', e.target.value)} defaultValue={FONTS[0].value} className={sel} style={{ maxWidth: 100 }}>
        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <select defaultValue="14" onChange={e => applySize(e.target.value)} className={sel} style={{ width: 54 }}>
        {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
      </select>
      <div className={sep} />
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('bold') }} title="Gras" className={btn}><Bold size={13} /></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('italic') }} title="Italique" className={btn}><Italic size={13} /></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('underline') }} title="Souligné" className={btn}><Underline size={13} /></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('strikeThrough') }} title="Barré" className={btn}><Strikethrough size={13} /></button>
      <div className={sep} />
      {/* Text color */}
      <button type="button" title="Couleur du texte" className={btn} onClick={() => textColorRef.current?.click()}>
        <span className="flex flex-col items-center gap-[2px]">
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>A</span>
          <span style={{ width: 13, height: 2, background: '#ef4444', borderRadius: 1 }} />
        </span>
      </button>
      <input ref={textColorRef} type="color" defaultValue="#ef4444" onChange={e => exec('foreColor', e.target.value)} className="w-0 h-0 opacity-0 pointer-events-none absolute" />
      {/* BG color */}
      <button type="button" title="Arrière-plan" className={btn} onClick={() => bgColorRef.current?.click()}>
        <Highlighter size={13} />
      </button>
      <input ref={bgColorRef} type="color" defaultValue="#fef08a" onChange={e => exec('hiliteColor', e.target.value)} className="w-0 h-0 opacity-0 pointer-events-none absolute" />
      <div className={sep} />
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('justifyLeft') }}   title="Gauche"   className={btn}><AlignLeft    size={13} /></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('justifyCenter') }} title="Centre"   className={btn}><AlignCenter  size={13} /></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('justifyRight') }}  title="Droite"   className={btn}><AlignRight   size={13} /></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('justifyFull') }}   title="Justifié" className={btn}><AlignJustify size={13} /></button>
    </div>
  )
}

// ─── ComposeModal ─────────────────────────────────────────────────────────────
function ComposeModal({ onClose, onSend, onDraft, allContacts, labels, isDark, draft, myEmail, myName }) {
  const [to,        setTo]        = useState(draft?.to    || [])
  const [cc,        setCc]        = useState(draft?.cc    || [])
  const [showCc,    setShowCc]    = useState((draft?.cc || []).length > 0)
  const [subject,   setSubject]   = useState(draft?.subject || '')
  const [urgent,    setUrgent]    = useState(draft?.urgent  || false)
  const [attachments, setAttachments] = useState(draft?.attachments || [])
  const [mailLabels,  setMailLabels]  = useState(draft?.labels || [])
  const [hasBody,   setHasBody]   = useState(!!(draft?.body))
  const editorRef  = useRef()
  const fileRef    = useRef()

  const textPrimary   = isDark ? 'text-white'    : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const modalBg       = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
  const inputCls      = isDark ? 'bg-transparent text-white placeholder-zinc-500' : 'bg-transparent text-gray-900 placeholder-gray-400'
  const borderDiv     = isDark ? 'border-zinc-700' : 'border-gray-100'

  useEffect(() => {
    if (draft?.body && editorRef.current) editorRef.current.innerHTML = draft.body
    setTimeout(() => editorRef.current?.focus(), 80)
  }, [])

  useEffect(() => {
    const handler = () => onClose()
    window.addEventListener('app:escape', handler)
    return () => window.removeEventListener('app:escape', handler)
  }, [])

  const getBody = () => editorRef.current?.innerHTML || ''

  const canSend = to.length > 0 && subject.trim()

  const buildData = (isDraftFlag) => ({
    from_email: myEmail,
    from_name:  myName,
    to, cc, subject,
    body: getBody(),
    attachments,
    urgent,
    labels: mailLabels,
    draft: isDraftFlag,
    ...(isDraftFlag ? {} : { sent_at: new Date().toISOString(), read: false }),
  })

  const handleFile = (e) => {
    Array.from(e.target.files || []).forEach(f => {
      setAttachments(prev => [...prev, { name: f.name, size: f.size, type: f.type }])
    })
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className={`w-full max-w-3xl border rounded-2xl flex flex-col shadow-2xl ${modalBg}`} style={{ height: '88vh' }}>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${borderDiv}`}>
          <div className="flex items-center gap-2.5">
            <h3 className={`font-bold ${textPrimary}`}>{draft?.id ? 'Modifier le brouillon' : 'Nouveau message'}</h3>
            <button type="button" onClick={() => setUrgent(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                urgent
                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                  : isDark ? 'border-zinc-700 text-zinc-400 hover:border-red-500/30 hover:text-red-400' : 'border-gray-200 text-gray-400 hover:text-red-500'
              }`}
            >
              <AlertTriangle size={11} /> Urgent
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onDraft(buildData(true))}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <FilePenLine size={12} /> Brouillon
            </button>
            <button type="button" onClick={onClose} className={`${textSecondary} hover:text-red-400 transition-colors`}><X size={18} /></button>
          </div>
        </div>

        {/* To */}
        <RecipientRow label="À" recipients={to}
          onAdd={c => { if (!to.find(r => r.email === c.email)) setTo(p => [...p, c]) }}
          onRemove={email => setTo(p => p.filter(r => r.email !== email))}
          allContacts={allContacts} isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
        />

        {/* Cc toggle */}
        {!showCc && (
          <div className={`px-4 py-1 border-b ${borderDiv}`}>
            <button type="button" onClick={() => setShowCc(true)} className={`text-xs ${textSecondary} hover:text-violet-400 transition-colors`}>
              + Ajouter Cc
            </button>
          </div>
        )}
        {showCc && (
          <RecipientRow label="Cc" recipients={cc}
            onAdd={c => { if (!cc.find(r => r.email === c.email)) setCc(p => [...p, c]) }}
            onRemove={email => setCc(p => p.filter(r => r.email !== email))}
            allContacts={allContacts} isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
          />
        )}

        {/* Subject + labels */}
        <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${borderDiv}`}>
          <input
            value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Objet"
            className={`flex-1 text-sm font-semibold outline-none ${inputCls}`}
          />
          {labels.length > 0 && (
            <div className="flex items-center gap-1">
              {labels.map(l => (
                <button key={l.id} type="button" title={l.name}
                  onClick={() => setMailLabels(p => p.includes(l.id) ? p.filter(x => x !== l.id) : [...p, l.id])}
                  className={`w-4 h-4 rounded-full transition-all ring-2 ring-offset-1 ${mailLabels.includes(l.id) ? 'ring-white/70 scale-110' : 'ring-transparent opacity-40 hover:opacity-80'}`}
                  style={{ background: l.color, '--tw-ring-offset-color': isDark ? '#18181b' : '#fff' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className={`flex flex-wrap items-center gap-2 px-4 py-2 border-b ${borderDiv}`}>
            {attachments.map((a, i) => (
              <span key={i} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                <Paperclip size={10} />
                {a.name}
                <span className={`text-[10px] ${textSecondary}`}>({(a.size / 1024).toFixed(0)} Ko)</span>
                <button type="button" onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} className="hover:text-red-400"><X size={9} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <RichTextToolbar editorRef={editorRef} isDark={isDark} />

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto">
          {!hasBody && (
            <div className={`absolute inset-0 px-5 py-4 text-sm pointer-events-none ${textSecondary}`}>
              Rédigez votre message…
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setHasBody(!!(editorRef.current?.textContent?.trim()))}
            className={`w-full h-full px-5 py-4 text-sm outline-none leading-relaxed ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{ minHeight: '100%' }}
          />
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-t ${borderDiv}`}>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Paperclip size={12} /> Joindre
            </button>
            <input ref={fileRef} type="file" multiple onChange={handleFile} className="hidden" />
            <button type="button" onClick={onClose} className={`text-xs ${textSecondary} hover:text-red-400 transition-colors`}>Annuler</button>
          </div>
          <button type="button" onClick={() => onSend(buildData(false))} disabled={!canSend}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
          >
            <Send size={14} /> Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MessagingPanel({ navItems, title = 'Messagerie' }) {
  const { user }  = useAuth()
  const { theme } = useApp()
  const isDark    = theme === 'dark'
  const myEmail   = user?.email
  const myName    = user?.name

  const [mails,         setMails]         = useState([])
  const [labels,        setLabels]        = useState([])
  const [allContacts,   setAllContacts]   = useState([])
  const [folder,        setFolder]        = useState('inbox')
  const [selectedMail,  setSelectedMail]  = useState(null)
  const [showCompose,   setShowCompose]   = useState(false)
  const [composeDraft,  setComposeDraft]  = useState(null)
  const [search,        setSearch]        = useState('')
  const [showAddLabel,  setShowAddLabel]  = useState(false)
  const [newLabelName,  setNewLabelName]  = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_PALETTE[0])

  const textPrimary   = isDark ? 'text-white'    : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const borderCls     = isDark ? 'border-zinc-800' : 'border-gray-100'

  const reload = useCallback(() => {
    setMails(Store.getMails())
    setLabels(Store.getMailLabels())
    const admin = { id: 'admin', email: 'joe.rappin@gmail.com', name: 'Joe Rappin', role: 'Admin' }
    setAllContacts([admin, ...Store.getEmployees()].filter(c => c.email !== myEmail))
  }, [myEmail])

  useEffect(() => { reload() }, [reload])

  // Escape closes compose
  useEffect(() => {
    const h = () => { if (showCompose) { setShowCompose(false); setComposeDraft(null) } }
    window.addEventListener('app:escape', h)
    return () => window.removeEventListener('app:escape', h)
  }, [showCompose])

  // ── Folder filtering ───────────────────────────────────────────────────────
  const myMails = mails.filter(m => {
    const involvedMe = m.from_email === myEmail || m.to?.some(r => r.email === myEmail) || m.cc?.some(r => r.email === myEmail)
    return involvedMe
  })

  const folderMails = myMails.filter(m => {
    const inTrash = m.trashed_by?.includes(myEmail)
    if (folder === 'trash')  return inTrash
    if (inTrash) return false
    if (folder === 'drafts') return m.draft && m.from_email === myEmail
    if (m.draft) return false
    if (folder === 'inbox')  return m.to?.some(r => r.email === myEmail) || m.cc?.some(r => r.email === myEmail)
    if (folder === 'sent')   return m.from_email === myEmail
    // custom label
    return m.labels?.includes(folder)
  })

  const displayMails = [...(search
    ? folderMails.filter(m =>
        m.subject?.toLowerCase().includes(search.toLowerCase()) ||
        m.from_name?.toLowerCase().includes(search.toLowerCase()) ||
        stripHtml(m.body).toLowerCase().includes(search.toLowerCase())
      )
    : folderMails
  )].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  // ── Counts ─────────────────────────────────────────────────────────────────
  const inboxUnread = myMails.filter(m =>
    !m.draft && !m.read && !m.trashed_by?.includes(myEmail) &&
    (m.to?.some(r => r.email === myEmail) || m.cc?.some(r => r.email === myEmail))
  ).length
  const draftCount = myMails.filter(m => m.draft && m.from_email === myEmail && !m.trashed_by?.includes(myEmail)).length

  const FOLDERS = [
    { id: 'inbox',  label: 'Réception',  icon: <Inbox    size={14} />, count: inboxUnread },
    { id: 'sent',   label: 'Envoyés',    icon: <Send     size={14} /> },
    { id: 'drafts', label: 'Brouillons', icon: <FileText size={14} />, count: draftCount },
    { id: 'trash',  label: 'Corbeille',  icon: <Trash2   size={14} /> },
  ]

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSelect = (mail) => {
    setSelectedMail(mail)
    const isRecipient = mail.to?.some(r => r.email === myEmail) || mail.cc?.some(r => r.email === myEmail)
    if (isRecipient) {
      const updates = {}
      if (!mail.read) updates.read = true
      if (mail.requires_receipt) {
        const already = (mail.read_by || []).some(r => r.email === myEmail)
        if (!already) {
          updates.read_by = [...(mail.read_by || []), { email: myEmail, name: myName, read_at: new Date().toISOString() }]
        }
      }
      if (Object.keys(updates).length > 0) {
        Store.updateMail(mail.id, updates)
        reload()
      }
    }
  }

  const handleSend = (data) => {
    if (composeDraft?.id) {
      Store.updateMail(composeDraft.id, { ...data, draft: false })
    } else {
      Store.addMail(data)
    }
    setShowCompose(false); setComposeDraft(null)
    reload(); setFolder('sent'); setSelectedMail(null)
  }

  const handleDraft = (data) => {
    if (composeDraft?.id) {
      Store.updateMail(composeDraft.id, data)
    } else {
      Store.addMail(data)
    }
    setShowCompose(false); setComposeDraft(null)
    reload(); setFolder('drafts'); setSelectedMail(null)
  }

  const handleDelete = (mail) => {
    if (folder === 'trash') {
      Store.deleteMail(mail.id)
    } else {
      Store.updateMail(mail.id, { trashed_by: [...(mail.trashed_by || []), myEmail] })
    }
    setSelectedMail(null); reload()
  }

  const handleReply = (mail) => {
    const replyTo = mail.from_email === myEmail ? mail.to : [{ email: mail.from_email, name: mail.from_name }]
    setComposeDraft({
      to: replyTo, cc: [],
      subject: mail.subject?.startsWith('Re: ') ? mail.subject : `Re: ${mail.subject}`,
      body: `<br/><br/><blockquote style="border-left:3px solid #8B5CF6;padding-left:12px;margin-top:12px;color:#888">${mail.body}</blockquote>`,
    })
    setShowCompose(true)
  }

  const handleToggleLabel = (mail, labelId) => {
    const updated = mail.labels?.includes(labelId)
      ? mail.labels.filter(l => l !== labelId)
      : [...(mail.labels || []), labelId]
    Store.updateMail(mail.id, { labels: updated })
    setSelectedMail(m => m ? { ...m, labels: updated } : m)
    reload()
  }

  const addLabel = () => {
    if (!newLabelName.trim()) return
    Store.addMailLabel({ name: newLabelName.trim(), color: newLabelColor })
    setNewLabelName(''); setShowAddLabel(false); reload()
  }

  const deleteLabel = (id) => {
    Store.deleteMailLabel(id)
    if (folder === id) setFolder('inbox')
    reload()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const panelBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'

  return (
    <Layout navItems={navItems} title={title}>
      <div className={`border rounded-2xl overflow-hidden flex ${panelBg}`} style={{ height: '78vh' }}>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <div className={`w-52 flex-shrink-0 flex flex-col border-r ${borderCls}`}>
          <div className={`p-3 border-b ${borderCls}`}>
            <button onClick={() => { setComposeDraft(null); setShowCompose(true) }}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              <Plus size={15} /> Rédiger
            </button>
          </div>

          <div className="p-2 space-y-0.5">
            {FOLDERS.map(f => (
              <button key={f.id} onClick={() => { setFolder(f.id); setSelectedMail(null) }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  folder === f.id
                    ? isDark ? 'bg-violet-600/20 text-violet-300' : 'bg-violet-50 text-violet-700'
                    : isDark ? `${textSecondary} hover:bg-zinc-800` : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">{f.icon} {f.label}</span>
                {f.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${folder === f.id ? 'bg-violet-500 text-white' : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-200 text-gray-600'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Labels */}
          <div className={`border-t mt-1 p-2 flex-1 overflow-y-auto ${borderCls}`}>
            <div className="flex items-center justify-between px-2 py-1 mb-0.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Libellés</span>
              <button onClick={() => setShowAddLabel(v => !v)} className={`${textSecondary} hover:text-violet-400 transition-colors`}><Plus size={12} /></button>
            </div>

            {showAddLabel && (
              <div className={`mb-2 p-2.5 rounded-xl border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                <input
                  value={newLabelName}
                  onChange={e => setNewLabelName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLabel()}
                  placeholder="Nom du libellé"
                  autoFocus
                  className={`w-full text-xs outline-none mb-2 ${isDark ? 'bg-transparent text-white placeholder-zinc-500' : 'bg-transparent text-gray-900 placeholder-gray-400'}`}
                />
                <div className="flex gap-1 mb-2 flex-wrap">
                  {LABEL_PALETTE.map(c => (
                    <button key={c} type="button" onClick={() => setNewLabelColor(c)}
                      className={`w-4 h-4 rounded-full flex-shrink-0 border-2 transition-all ${newLabelColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={addLabel} className="flex-1 text-[11px] bg-violet-600 text-white rounded-lg py-1 font-semibold">Créer</button>
                  <button onClick={() => setShowAddLabel(false)} className={`flex-1 text-[11px] border rounded-lg py-1 ${isDark ? 'border-zinc-700 text-zinc-400' : 'border-gray-200 text-gray-500'}`}>Annuler</button>
                </div>
              </div>
            )}

            {labels.map(l => (
              <div key={l.id} className={`group flex items-center justify-between pr-1 rounded-xl transition-colors ${folder === l.id ? isDark ? 'bg-zinc-800' : 'bg-gray-100' : isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'}`}>
                <button onClick={() => { setFolder(l.id); setSelectedMail(null) }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium flex-1 text-left ${folder === l.id ? textPrimary : textSecondary}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                  {l.name}
                </button>
                <button onClick={() => deleteLabel(l.id)} className={`opacity-0 group-hover:opacity-100 p-1 rounded-md hover:text-red-400 transition-all ${textSecondary}`}><X size={11} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mail list ───────────────────────────────────────────────── */}
        <div className={`w-80 flex-shrink-0 flex flex-col border-r ${borderCls} ${selectedMail ? 'hidden lg:flex' : 'flex'}`}>
          <div className={`p-3 border-b ${borderCls}`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
              <Search size={13} className={textSecondary} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
                className={`flex-1 outline-none ${isDark ? 'bg-transparent text-white placeholder-zinc-500' : 'bg-transparent text-gray-900 placeholder-gray-400'}`}
              />
              {search && <button onClick={() => setSearch('')}><X size={12} className={textSecondary} /></button>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {displayMails.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-16 gap-2 ${textSecondary}`}>
                <Mail size={28} className="opacity-20" />
                <p className="text-xs">Aucun message</p>
              </div>
            ) : displayMails.map(m => {
              const fromMe = m.from_email === myEmail
              const displayName = fromMe
                ? (m.to?.[0]?.name || m.to?.[0]?.email || '?')
                : (m.from_name || m.from_email)
              const unread = !m.read && !fromMe && !m.draft
              return (
                <button key={m.id} onClick={() => handleSelect(m)}
                  className={`w-full px-4 py-3 flex flex-col gap-0.5 text-left transition-colors border-b ${
                    selectedMail?.id === m.id
                      ? isDark ? 'bg-zinc-800 border-transparent' : 'bg-violet-50 border-transparent'
                      : isDark ? `hover:bg-zinc-800/40 ${borderCls}` : `hover:bg-gray-50 ${borderCls}`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {unread && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />}
                      <span className={`text-sm truncate ${unread ? `font-bold ${textPrimary}` : textSecondary}`}>{displayName}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {m.urgent && <AlertTriangle size={11} className="text-red-400" />}
                      {m.attachments?.length > 0 && <Paperclip size={10} className={textSecondary} />}
                      <span className={`text-[10px] ${textSecondary}`}>{fmtDate(m.created_at)}</span>
                    </div>
                  </div>
                  <span className={`text-xs truncate ${unread ? `font-semibold ${textPrimary}` : textSecondary}`}>
                    {m.draft && <span className="text-amber-400 mr-1">[Brouillon]</span>}
                    {m.subject || '(sans objet)'}
                  </span>
                  <span className={`text-[11px] truncate ${textSecondary}`}>{stripHtml(m.body).slice(0, 80)}</span>
                  {m.labels?.length > 0 && (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {m.labels.map(lid => {
                        const lab = labels.find(l => l.id === lid)
                        return lab ? <span key={lid} className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ background: lab.color }}>{lab.name}</span> : null
                      })}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Mail view ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!selectedMail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className={`text-center ${textSecondary}`}>
                <Mail size={40} className="mx-auto mb-3 opacity-15" />
                <p className="text-sm">Sélectionnez un message</p>
                <button onClick={() => { setComposeDraft(null); setShowCompose(true) }}
                  className="mt-3 text-xs text-violet-400 hover:underline"
                >
                  ou rédigez-en un nouveau →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mail header */}
              <div className={`px-6 py-4 border-b ${borderCls}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h2 className={`font-bold text-base ${textPrimary}`}>{selectedMail.subject || '(sans objet)'}</h2>
                      {selectedMail.urgent && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <AlertTriangle size={9} /> URGENT
                        </span>
                      )}
                      {selectedMail.labels?.map(lid => {
                        const lab = labels.find(l => l.id === lid)
                        return lab ? <span key={lid} className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ background: lab.color }}>{lab.name}</span> : null
                      })}
                    </div>
                    <div className={`flex flex-wrap gap-x-4 gap-y-0.5 text-xs ${textSecondary}`}>
                      <span>De : <span className={`font-medium ${textPrimary}`}>{selectedMail.from_name} &lt;{selectedMail.from_email}&gt;</span></span>
                      <span>À : <span className={textPrimary}>{selectedMail.to?.map(r => r.name || r.email).join(', ')}</span></span>
                      {selectedMail.cc?.length > 0 && (
                        <span>Cc : <span className={textPrimary}>{selectedMail.cc.map(r => r.name || r.email).join(', ')}</span></span>
                      )}
                      <span>{new Date(selectedMail.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Label toggles */}
                    {labels.length > 0 && (
                      <div className="flex gap-1">
                        {labels.map(l => (
                          <button key={l.id} onClick={() => handleToggleLabel(selectedMail, l.id)}
                            title={l.name}
                            className={`w-4 h-4 rounded-full transition-all ring-2 ring-offset-1 ${selectedMail.labels?.includes(l.id) ? 'ring-white/60 scale-110' : 'ring-transparent opacity-35 hover:opacity-70'}`}
                            style={{ background: l.color }}
                          />
                        ))}
                      </div>
                    )}
                    <button onClick={() => handleReply(selectedMail)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Reply size={13} /> Répondre
                    </button>
                    {selectedMail.draft && (
                      <button onClick={() => { setComposeDraft(selectedMail); setShowCompose(true) }}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        <FilePenLine size={13} /> Modifier
                      </button>
                    )}
                    <button onClick={() => handleDelete(selectedMail)}
                      title={folder === 'trash' ? 'Supprimer définitivement' : 'Mettre à la corbeille'}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {/* Attachments */}
                {selectedMail.attachments?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMail.attachments.map((a, i) => (
                      <span key={i} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                        <Paperclip size={10} /> {a.name}
                        <span className={textSecondary}>({(a.size / 1024).toFixed(0)} Ko)</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Mail body */}
              <div
                className={`flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}
                dangerouslySetInnerHTML={{ __html: selectedMail.body || '<em style="color:#888">Message vide</em>' }}
              />
            </>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <ComposeModal
          onClose={() => { setShowCompose(false); setComposeDraft(null) }}
          onSend={handleSend}
          onDraft={handleDraft}
          allContacts={allContacts}
          labels={labels}
          isDark={isDark}
          draft={composeDraft}
          myEmail={myEmail}
          myName={myName}
        />
      )}
    </Layout>
  )
}
