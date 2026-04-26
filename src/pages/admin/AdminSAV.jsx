import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Send, MessageSquare, CheckCircle, XCircle, Trash2,
  Check, CheckCheck, ChevronDown, History, X, Phone, Mail,
} from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { formatDate } from '../../utils'

const LEAD_COLUMNS = [
  'Pool Leads',
  'Leads à contacter',
  'Rappel 1',
  'Rappel 2',
  'Rappel 3',
  'Leads Jamais pris',
  'Annulation',
  'Follow Up',
]

const LEAD_COL_COLORS = {
  'Pool Leads':          'border-violet-500/40 bg-violet-500/5',
  'Leads à contacter':   'border-blue-500/40 bg-blue-500/5',
  'Rappel 1':            'border-amber-500/40 bg-amber-500/5',
  'Rappel 2':            'border-orange-500/40 bg-orange-500/5',
  'Rappel 3':            'border-red-400/40 bg-red-400/5',
  'Leads Jamais pris':   'border-zinc-600/40 bg-zinc-600/5',
  'Annulation':          'border-red-600/40 bg-red-600/5',
  'Follow Up':           'border-green-500/40 bg-green-500/5',
}

const LEAD_COL_BADGE = {
  'Pool Leads':          'bg-violet-500/20 text-violet-300',
  'Leads à contacter':   'bg-blue-500/20 text-blue-300',
  'Rappel 1':            'bg-amber-500/20 text-amber-300',
  'Rappel 2':            'bg-orange-500/20 text-orange-300',
  'Rappel 3':            'bg-red-400/20 text-red-300',
  'Leads Jamais pris':   'bg-zinc-600/20 text-zinc-400',
  'Annulation':          'bg-red-600/20 text-red-400',
  'Follow Up':           'bg-green-500/20 text-green-300',
}

const KPI_COLORS = {
  violet: 'text-violet-400',
  amber:  'text-amber-400',
  red:    'text-red-400',
  green:  'text-green-400',
}

function fmtDt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function HistoryPopup({ history, onClose, title }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-80 max-h-[70vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold text-white">Historique</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="text-xs text-zinc-500 px-4 pt-2 pb-1 truncate">{title}</div>
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {(!history || history.length === 0) ? (
            <p className="text-xs text-zinc-600 text-center py-4">Aucun historique</p>
          ) : [...history].reverse().map((h, i) => (
            <div key={i} className="border border-zinc-800 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[10px] font-semibold text-violet-300">{h.action}</span>
                <span className="text-[10px] text-zinc-600">{fmtDt(h.at)}</span>
              </div>
              {h.from && <p className="text-[10px] text-zinc-500">{h.from} → <span className="text-zinc-300">{h.to}</span></p>}
              {!h.from && h.to && <p className="text-[10px] text-zinc-400">{h.to}</p>}
              <p className="text-[10px] text-zinc-600 mt-0.5">par {h.by}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LeadCard({ lead, onMove, isDark }) {
  const [showHistory, setShowHistory] = useState(false)
  const [showMove,    setShowMove]    = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) { if (ref.current && !ref.current.contains(e.target)) setShowMove(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const badge = LEAD_COL_BADGE[lead.column] || 'bg-zinc-700 text-zinc-300'

  return (
    <>
      <div className={`border rounded-xl p-3 space-y-2 transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
            {(lead.name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.name || 'Visiteur'}</p>
            <div className="flex items-center gap-1 flex-wrap mt-0.5">
              {lead.formula && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{lead.formula}</span>
              )}
              {lead.source === 'contact' && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400">Page contact</span>
              )}
              {!lead.source && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">Chatbot</span>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-1">
          {lead.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-zinc-500 flex-shrink-0" />
              <span className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-zinc-500 flex-shrink-0" />
              <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{lead.phone}</span>
            </div>
          )}
        </div>
        {lead.subject && (
          <p className={`text-[10px] truncate italic ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>"{lead.subject}"</p>
        )}
        <div className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>{fmtDt(lead.created_at)}</div>
        <div className="flex items-center gap-1.5 pt-0.5" ref={ref}>
          <div className="relative flex-1">
            <button onClick={() => setShowMove(v => !v)}
              className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${badge}`}>
              <span className="truncate">{lead.column}</span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            </button>
            {showMove && (
              <div className={`absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border shadow-2xl overflow-hidden ${
                isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
              }`}>
                {LEAD_COLUMNS.filter(c => c !== lead.column).map(col => (
                  <button key={col} onClick={() => { onMove(lead, col); setShowMove(false) }}
                    className={`w-full text-left px-3 py-2 text-[10px] font-medium transition-colors ${
                      isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-gray-50 text-gray-700'
                    }`}>
                    {col}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setShowHistory(true)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors flex-shrink-0 ${
              isDark ? 'border-zinc-700 text-zinc-500 hover:text-violet-400 hover:border-violet-500/40' : 'border-gray-200 text-gray-400 hover:text-violet-600'
            }`}
            title="Historique des actions">
            <History className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {showHistory && (
        <HistoryPopup history={lead.history} title={lead.name || lead.email} onClose={() => setShowHistory(false)} />
      )}
    </>
  )
}

function CloserBoard({ isDark, user }) {
  const [leads,         setLeads]         = useState([])
  const [search,        setSearch]        = useState('')
  const [selectedMonth, setSelectedMonth] = useState('all')

  const load = () => setLeads(Store.getLeads())
  useEffect(() => { load() }, [])

  const now = new Date()
  const MONTHS = [{ value: 'all', label: 'Tous les mois' }]
  for (let m = 0; m <= now.getMonth(); m++) {
    const d = new Date(now.getFullYear(), m, 1)
    MONTHS.push({
      value: `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    })
  }

  const monthFiltered = selectedMonth === 'all' ? leads : leads.filter(l => {
    if (!l.created_at) return false
    const d = new Date(l.created_at)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth
  })

  const kpi = {
    total:     monthFiltered.length,
    toCall:    monthFiltered.filter(l => ['Rappel 1', 'Rappel 2', 'Rappel 3'].includes(l.column)).length,
    lost:      monthFiltered.filter(l => ['Leads Jamais pris', 'Annulation'].includes(l.column)).length,
    converted: monthFiltered.filter(l => l.column === 'Follow Up').length,
  }

  const filtered = search
    ? monthFiltered.filter(l => [l.name, l.email, l.phone, l.formula].some(v => v?.toLowerCase().includes(search.toLowerCase())))
    : monthFiltered

  function moveLead(lead, newCol) {
    Store.updateLead(lead.id, { column: newCol }, {
      action: 'Déplacé', from: lead.column, to: newCol, by: user?.name || 'Admin',
    })
    load()
  }

  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputCls = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
        >
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un lead…"
            className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
          />
        </div>
        <span className={`text-xs ${textSecondary}`}>{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total leads', value: kpi.total,     color: 'violet', sub: '' },
          { label: 'À rappeler',  value: kpi.toCall,    color: 'amber',  sub: 'Rappel 1 · 2 · 3' },
          { label: 'Perdus',      value: kpi.lost,      color: 'red',    sub: 'Non pris · Annulation' },
          { label: 'Convertis',   value: kpi.converted, color: 'green',  sub: 'Follow Up' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-3 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs truncate ${textSecondary}`}>{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${KPI_COLORS[k.color]}`}>{k.value}</p>
            {k.sub && <p className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: `${LEAD_COLUMNS.length * 210}px` }}>
          {LEAD_COLUMNS.map(col => {
            const colLeads = filtered.filter(l => l.column === col)
            return (
              <div key={col} className={`flex-shrink-0 w-48 border rounded-2xl flex flex-col overflow-hidden ${LEAD_COL_COLORS[col] || 'border-zinc-700/40'}`}>
                <div className="px-3 py-2.5 border-b border-zinc-800/30 flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-bold truncate ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{col}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${LEAD_COL_BADGE[col] || 'bg-zinc-700 text-zinc-400'}`}>
                    {colLeads.length}
                  </span>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-460px)]">
                  {colLeads.length === 0 ? (
                    <div className={`text-center text-[10px] py-4 ${isDark ? 'text-zinc-700' : 'text-gray-300'}`}>Vide</div>
                  ) : colLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onMove={moveLead} isDark={isDark} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AdminSAV() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [tab,      setTab]      = useState('messages') // 'messages' | 'closed' | 'closer'
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')
  const [reply,    setReply]    = useState('')
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef(null)

  const card          = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const inputCls      = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const textPrimary   = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider       = isDark ? 'border-zinc-800' : 'border-gray-100'

  const leadsCount = Store.getLeads().length

  const load = (keepSelected) => {
    const msgs = Store.getMessages()
    setMessages(msgs)
    if (keepSelected) {
      const refreshed = msgs.find(m => m.id === keepSelected.id)
      if (refreshed) setSelected(refreshed)
    }
  }

  useEffect(() => { Store.purgeOldMessages(); load() }, [])
  useEffect(() => { setSelected(null) }, [tab])

  const getName  = (m) => m.from_name  || m.client_name  || 'Client'
  const getEmail = (m) => m.from_email || m.client_email || ''

  const parseMsgPreview = (m) => {
    const body = m.body || ''
    const action = (body.match(/\[ACTION:\s*([^\]]+)\]/) || [])[1]?.trim()
    const resId  = (body.match(/\[RES:\s*([^\]]+)\]/)    || [])[1]?.trim()
    if (action || resId) return { action, resId }
    return null
  }

  const unreadCount = messages.filter(m => !m.read && m.status !== 'closed').length
  const closedCount = messages.filter(m => m.status === 'closed').length

  const filtered = messages.filter(m => {
    const matchSearch = !search ||
      getName(m).toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'closed' ? m.status === 'closed' : m.status !== 'closed'
    return matchSearch && matchTab
  })

  const selectMsg = (m) => {
    Store.updateMessage(m.id, { read: true })
    setSelected({ ...m, read: true })
    setMessages(Store.getMessages())
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
    Store.updateMessage(selected.id, { status: newStatus })
    setSelected({ ...selected, status: newStatus })
    setMessages(Store.getMessages())
  }

  const deleteConversation = () => {
    if (!selected) return
    Store.deleteMessage(selected.id)
    setSelected(null)
    setMessages(Store.getMessages())
  }

  const TabBar = () => (
    <div className={`flex items-center gap-1 p-1 rounded-xl border flex-shrink-0 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200'}`}>
      {[
        { id: 'messages', label: 'Messages',          badge: unreadCount },
        { id: 'closed',   label: 'Messages clôturés', badge: closedCount },
        { id: 'closer',   label: 'Closer',            badge: leadsCount  },
      ].map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === t.id
              ? 'bg-violet-600 text-white shadow'
              : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          }`}>
          {t.label}
          {t.badge > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              tab === t.id ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
            }`}>
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )

  return (
    <Layout navItems={ADMIN_NAV} title="SAV">
      <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 120px)' }}>

        {/* Tab bar + search */}
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <TabBar />
          {(tab === 'messages' || tab === 'closed') && (
            <div className="relative flex-1 min-w-[180px]">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`}
                placeholder="Rechercher un client ou sujet…"
              />
            </div>
          )}
        </div>

        {/* ── MESSAGES / CLOSED TABS ─────────────────────────────────────────── */}
        {(tab === 'messages' || tab === 'closed') && (
          <div className="grid lg:grid-cols-5 gap-5 flex-1 min-h-0">
            {/* List */}
            <div className="lg:col-span-2 overflow-y-auto space-y-2 pr-1">
              {filtered.length === 0 ? (
                <div className={`text-sm p-6 text-center ${textSecondary}`}>Aucun message</div>
              ) : filtered.map(m => {
                const isClosed     = m.status === 'closed'
                const hasUnread    = !m.read
                const isClientChat = m.is_client_chat
                return (
                  <button key={m.id} onClick={() => selectMsg(m)}
                    className={`w-full text-left rounded-xl px-4 py-3.5 border transition-colors ${
                      selected?.id === m.id
                        ? isDark ? 'bg-zinc-800 border-violet-500' : 'bg-violet-50 border-violet-400'
                        : isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="flex items-start gap-2">
                      {hasUnread && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${hasUnread ? textPrimary : textSecondary}`}>{getName(m)}</span>
                          {m.client_id && (
                            <span className="text-[9px] font-mono bg-zinc-700/50 text-zinc-400 px-1.5 py-0.5 rounded flex-shrink-0">{m.client_id}</span>
                          )}
                          <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            isClosed
                              ? isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500'
                              : isClientChat ? 'bg-blue-500/15 text-blue-400' : 'bg-violet-500/15 text-violet-400'
                          }`}>
                            {isClosed ? 'Clôturé' : isClientChat ? 'Chat' : 'Ouvert'}
                          </span>
                        </div>
                        {(() => {
                          const p = parseMsgPreview(m)
                          if (p) return (
                            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                              {p.action && <span className={`text-xs truncate font-medium ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{p.action}</span>}
                              {p.action && p.resId && <span className={`text-xs flex-shrink-0 ${textSecondary}`}>·</span>}
                              {p.resId && <span className={`text-[10px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>{p.resId}</span>}
                            </div>
                          )
                          return <div className={`text-xs truncate mt-0.5 ${textSecondary}`}>{m.subject}</div>
                        })()}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>{formatDate(m.created_at)}</span>
                          {m.replies?.length > 0 && (
                            <span className="text-xs text-violet-400 font-medium">· {m.replies.length} msg{m.replies.length > 1 ? 's' : ''}</span>
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
                  <div className={`flex items-start justify-between gap-3 px-5 py-4 border-b flex-shrink-0 ${divider}`}>
                    <div className="min-w-0">
                      <h3 className={`font-bold text-sm ${textPrimary}`}>{selected.subject}</h3>
                      <p className={`text-xs mt-0.5 ${textSecondary}`}>
                        {getName(selected)} · {getEmail(selected)}
                        {selected.client_id && <span className="ml-2 font-mono bg-zinc-700/40 px-1 rounded text-[10px]">{selected.client_id}</span>}
                        {' · '}{formatDate(selected.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={toggleStatus}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          selected.status === 'closed'
                            ? isDark ? 'border-green-700 text-green-400 hover:bg-green-900/20' : 'border-green-300 text-green-700 hover:bg-green-50'
                            : isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}>
                        {selected.status === 'closed'
                          ? <><CheckCircle size={12} /> Rouvrir</>
                          : <><XCircle size={12} /> Clôturer</>
                        }
                      </button>
                      <button onClick={deleteConversation}
                        className={`p-1.5 rounded-lg border transition-colors ${isDark ? 'border-red-900 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
                        title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-[10px] font-bold">{getName(selected).charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${textPrimary}`}>{getName(selected)}</span>
                          <span className={`text-xs ${textSecondary}`}>· {formatDate(selected.created_at)}</span>
                        </div>
                        <div className={`rounded-xl rounded-tl-sm p-3.5 text-sm max-w-[85%] ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-50 text-gray-700'}`}>
                          {selected.body}
                        </div>
                      </div>
                    </div>

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
                            <div className={`rounded-xl p-3.5 text-sm max-w-[85%] ${
                              isAdmin
                                ? isDark ? 'rounded-tr-sm bg-blue-500/10 border border-blue-500/20 text-blue-100' : 'rounded-tr-sm bg-blue-50 border border-blue-100 text-blue-900'
                                : isDark ? 'rounded-tl-sm bg-zinc-800 text-zinc-300' : 'rounded-tl-sm bg-gray-50 text-gray-700'
                            }`}>
                              {r.body}
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1 mt-0.5 justify-end">
                                {selected.unread_for_client === false
                                  ? <><CheckCheck className="w-3 h-3 text-blue-400" /><span className="text-[9px] text-blue-400">Lu</span></>
                                  : <><Check className="w-3 h-3 text-zinc-500" /><span className="text-[9px] text-zinc-500">Envoyé</span></>
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>

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
                        <button onClick={sendReply} disabled={!reply.trim() || sending}
                          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-3 rounded-xl transition-colors self-end py-2.5">
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
        )}

        {/* ── CLOSER TAB ────────────────────────────────────────────────────── */}
        {tab === 'closer' && (
          <div className="flex-1 overflow-auto">
            <CloserBoard isDark={isDark} user={user} />
          </div>
        )}
      </div>
    </Layout>
  )
}
