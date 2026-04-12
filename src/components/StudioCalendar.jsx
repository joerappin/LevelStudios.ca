import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Phone, Mail, Building2, Users, Clock, CalendarDays, Tag, Banknote, Trash2, Pencil, Check } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { cn, STATUS_CONFIG } from '../utils'
import { Store } from '../data/store'

const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
const DURATIONS = [1,2,3,4,5,6,8,10]

function calcEndTime(start, dur) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + dur * 60
  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`
}

function buildOptions() {
  const p = Store.getPrices()
  const priceOf = (id, fb) => p.options.find(o => o.id === id)?.price ?? fb
  return [
    { key: 'Photo',     label: 'Photo',            price: priceOf('Photo', 44) },
    { key: 'Short',     label: 'Short vidéo',       price: priceOf('Short', 44) },
    { key: 'Miniature', label: 'Miniature',         price: priceOf('Miniature', 44) },
    { key: 'Live',      label: 'Live stream',       price: priceOf('Live', 662) },
    { key: 'Replay',    label: 'Replay',            price: priceOf('Replay', 74) },
    { key: 'CM',        label: 'Community manager', price: priceOf('CommunityManager', 147) },
    { key: 'Coaching',  label: 'Coaching',          price: priceOf('Coaching', 588) },
  ]
}

function buildServices() {
  const p = Store.getPrices()
  const priceOf = (id, fb) => p.services.find(s => s.id === id)?.price ?? fb
  return [
    { key: 'ARGENT', label: `ARGENT — ${priceOf('ARGENT', 221)} CAD/h`, rate: priceOf('ARGENT', 221) },
    { key: 'GOLD',   label: `GOLD — ${priceOf('GOLD', 587)} CAD/h`,     rate: priceOf('GOLD', 587) },
  ]
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

const STUDIO_PALETTE = [
  { bg: '#3B82F6', light: 'rgba(59,130,246,0.15)', text: '#93C5FD', border: 'rgba(59,130,246,0.35)' },   // blue
  { bg: '#10B981', light: 'rgba(16,185,129,0.15)', text: '#6EE7B7', border: 'rgba(16,185,129,0.35)' },   // emerald
  { bg: '#8B5CF6', light: 'rgba(139,92,246,0.15)', text: '#C4B5FD', border: 'rgba(139,92,246,0.35)' },   // violet
  { bg: '#F59E0B', light: 'rgba(245,158,11,0.15)', text: '#FCD34D', border: 'rgba(245,158,11,0.35)' },   // amber
  { bg: '#EC4899', light: 'rgba(236,72,153,0.15)', text: '#F9A8D4', border: 'rgba(236,72,153,0.35)' },   // pink
  { bg: '#14B8A6', light: 'rgba(20,184,166,0.15)', text: '#5EEAD4', border: 'rgba(20,184,166,0.35)' },   // teal
  { bg: '#6366F1', light: 'rgba(99,102,241,0.15)', text: '#A5B4FC', border: 'rgba(99,102,241,0.35)' },   // indigo
  { bg: '#F97316', light: 'rgba(249,115,22,0.15)', text: '#FDBA74', border: 'rgba(249,115,22,0.35)' },   // orange
]

const STATUS_CFG = {
  validee:     { label: 'Confirmée',  cls: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  livree:      { label: 'Livrée',     cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  tournee:     { label: 'En cours',   cls: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  'post-prod': { label: 'Post-prod',  cls: 'bg-sky-500/20 text-sky-400 border border-sky-500/30' },
  a_payer:     { label: 'En attente', cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  annulee:     { label: 'Annulée',    cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  en_attente:  { label: 'En attente', cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildGrid(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const startDow = (first.getDay() + 6) % 7
  const rows = []
  let cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push(new Date(year, month, d))
    if (cells.length === 7) { rows.push(cells); cells = [] }
  }
  if (cells.length > 0) { while (cells.length < 7) cells.push(null); rows.push(cells) }
  return rows
}

function useStudioColors(studios) {
  return useMemo(() => {
    const map = {}
    studios.forEach((s, i) => { map[s] = STUDIO_PALETTE[i % STUDIO_PALETTE.length] })
    return map
  }, [studios.join(',')])
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StudioCalendar({ reservations = [], showClientDetails = true, onDelete, onUpdate }) {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const now  = new Date()
  const today = now.toISOString().split('T')[0]

  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth())
  const [filter,  setFilter]  = useState('Tous')
  const [selected, setSelected] = useState(null)
  const [editing,  setEditing]  = useState(false)
  const [editForm, setEditForm] = useState({})

  // Derive studio list from reservations
  const studios = useMemo(() => {
    const set = new Set(reservations.map(r => r.studio).filter(Boolean))
    return ['Tous', ...Array.from(set).sort()]
  }, [reservations])

  const studioColors = useStudioColors(studios.slice(1)) // skip 'Tous'

  const filtered = filter === 'Tous' ? reservations : reservations.filter(r => r.studio === filter)

  const grid = buildGrid(year, month)

  function prev() { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }
  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()) }

  function getDay(date) {
    if (!date) return []
    const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    return filtered.filter(r => r.date === ds).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  }

  // ─── Styles ────────────────────────────────────────────────────────────────
  const bg      = isDark ? 'bg-zinc-950' : 'bg-gray-50'
  const card    = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'
  const tp      = isDark ? 'text-white'    : 'text-gray-900'
  const ts      = isDark ? 'text-zinc-400' : 'text-gray-500'
  const cellBase = isDark ? 'bg-zinc-900 hover:bg-zinc-800/60' : 'bg-white hover:bg-violet-50/40'
  const cellOff  = isDark ? 'bg-zinc-950/60' : 'bg-gray-50'

  const stColor = (studio) => studioColors[studio] || STUDIO_PALETTE[0]

  const selectedSt  = selected ? (STATUS_CFG[selected.status] || STATUS_CFG.a_payer) : null
  const selectedCol = selected ? stColor(selected.studio) : null

  return (
    <div className="flex gap-4 h-full">

      {/* ── Calendar ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">

        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToday}
              className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors',
                isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100')}
            >
              Aujourd'hui
            </button>
            <button onClick={prev} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700')}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={next} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700')}>
              <ChevronRight size={16} />
            </button>
            <span className={cn('text-base font-bold ml-1', tp)}>
              {MONTHS[month]} {year}
            </span>
          </div>

          {/* Studio filter pills */}
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {studios.map(s => {
              const active = filter === s
              const col = s === 'Tous' ? null : stColor(s)
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={active && col ? {
                    backgroundColor: col.light,
                    color: col.text,
                    borderColor: col.border,
                  } : {}}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                    active
                      ? s === 'Tous'
                        ? 'bg-violet-600 text-white border-violet-600'
                        : ''
                      : isDark
                        ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                  )}
                >
                  {s !== 'Tous' && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col?.bg }}
                    />
                  )}
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Calendar grid */}
        <div className={cn('border rounded-2xl overflow-hidden flex-1', card)}>
          {/* Day headers */}
          <div className={cn('grid grid-cols-7 border-b', divider)}>
            {DAYS.map(d => (
              <div key={d} className={cn('py-2.5 text-center text-xs font-bold uppercase tracking-widest', ts)}>
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {grid.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7" style={{ minHeight: 110 }}>
              {row.map((cell, ci) => {
                const resas = getDay(cell)
                const ds = cell ? `${cell.getFullYear()}-${String(cell.getMonth()+1).padStart(2,'0')}-${String(cell.getDate()).padStart(2,'0')}` : null
                const isToday = ds === today
                const isLastRow = ri === grid.length - 1
                return (
                  <div
                    key={ci}
                    className={cn(
                      'p-1.5 border-r border-b transition-colors',
                      divider,
                      !cell ? cellOff : cellBase,
                      isLastRow ? 'border-b-0' : '',
                      ci === 6 ? 'border-r-0' : '',
                    )}
                  >
                    {cell && (
                      <>
                        {/* Day number */}
                        <div className="flex items-center justify-between mb-1">
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            isToday
                              ? 'bg-violet-600 text-white'
                              : isDark ? 'text-zinc-400' : 'text-gray-500'
                          )}>
                            {cell.getDate()}
                          </div>
                          {resas.length > 0 && (
                            <span className={cn('text-[9px] font-bold', ts)}>
                              {resas.length} sess.
                            </span>
                          )}
                        </div>

                        {/* Event chips */}
                        <div className="space-y-0.5">
                          {resas.slice(0, 3).map(r => {
                            const col = stColor(r.studio)
                            const label = showClientDetails
                              ? `${r.start_time} · ${r.client_name?.split(' ')[0] || '—'}`
                              : `${r.start_time} · ${r.studio}`
                            return (
                              <button
                                key={r.id}
                                onClick={() => setSelected(r)}
                                style={{ backgroundColor: col.light, color: col.text, borderColor: col.border }}
                                className="w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded border truncate transition-opacity hover:opacity-80 block"
                              >
                                {label}
                              </button>
                            )
                          })}
                          {resas.length > 3 && (
                            <button
                              onClick={() => setSelected(resas[3])}
                              className={cn('text-[10px] font-medium px-1', ts)}
                            >
                              +{resas.length - 3} autres
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        {studios.length > 1 && (
          <div className="flex flex-wrap gap-3">
            {studios.slice(1).map(s => {
              const col = stColor(s)
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: col.bg }} />
                  <span className={cn('text-xs', ts)}>{s}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Detail panel ──────────────────────────────────────────────────── */}
      <div className={cn('w-72 flex-shrink-0 border rounded-2xl overflow-hidden flex flex-col', card)}>
        {selected ? (
          <>
            {/* Color header */}
            <div
              className="px-4 py-4 flex-shrink-0"
              style={{ backgroundColor: selectedCol?.light, borderBottom: `1px solid ${selectedCol?.border}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedCol?.bg }} />
                    <span className="text-xs font-bold" style={{ color: selectedCol?.text }}>{selected.studio}</span>
                  </div>
                  {showClientDetails && (
                    <p className={cn('font-bold text-base truncate', tp)}>{selected.client_name}</p>
                  )}
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', selectedSt?.cls)}>
                    {selectedSt?.label || selected.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  {onUpdate && !editing && (
                    <button
                      onClick={() => {
                        setEditForm({
                          date:       selected.date       || '',
                          startTime:  selected.start_time || '10:00',
                          duration:   selected.duration   || 2,
                          service:    selected.service    || 'ARGENT',
                          persons:    selected.persons    || 1,
                          options:    selected.additional_services || [],
                        })
                        setEditing(true)
                      }}
                      title="Modifier"
                      className={cn('p-1 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50')}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => { setSelected(null); setEditing(false) }}
                    className={cn('p-1 rounded-lg transition-colors', isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200')}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Edit form ── */}
            {editing ? (() => {
              const SERVICES = buildServices()
              const OPTIONS  = buildOptions()
              const ef = editForm
              const set = (k, v) => setEditForm(f => ({ ...f, [k]: v }))
              const toggleOpt = key => set('options', ef.options.includes(key) ? ef.options.filter(o => o !== key) : [...ef.options, key])
              const inputCls = cn('w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-violet-500',
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900')
              const labelCls = cn('block text-[11px] font-semibold uppercase tracking-wide mb-1', ts)

              const handleSave = () => {
                const endTime = calcEndTime(ef.startTime, Number(ef.duration))
                const svc = SERVICES.find(s => s.key === ef.service)
                const optPrice = ef.options.reduce((s, k) => s + (OPTIONS.find(o => o.key === k)?.price || 0), 0)
                const price = (svc?.rate || 221) * Number(ef.duration) + optPrice
                const patch = {
                  date: ef.date,
                  start_time: ef.startTime,
                  end_time: endTime,
                  duration: Number(ef.duration),
                  service: ef.service,
                  persons: Number(ef.persons),
                  additional_services: ef.options,
                  price,
                }
                onUpdate(selected.id, patch)
                setSelected(s => ({ ...s, ...patch }))
                setEditing(false)
              }

              return (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div>
                    <label className={labelCls}>Date</label>
                    <input type="date" value={ef.date} onChange={e => set('date', e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Heure début</label>
                      <select value={ef.startTime} onChange={e => set('startTime', e.target.value)} className={inputCls}>
                        {TIMES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Durée</label>
                      <select value={ef.duration} onChange={e => set('duration', Number(e.target.value))} className={inputCls}>
                        {DURATIONS.map(d => <option key={d} value={d}>{d}h</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Personnes</label>
                    <input type="number" min={1} max={20} value={ef.persons} onChange={e => set('persons', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Formule</label>
                    <div className="flex gap-2">
                      {SERVICES.map(s => (
                        <button key={s.key} type="button" onClick={() => set('service', s.key)}
                          className={cn('flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all',
                            ef.service === s.key
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : isDark ? 'border-zinc-700 text-zinc-400 hover:border-violet-500' : 'border-gray-300 text-gray-600 hover:border-violet-400'
                          )}>
                          {s.key}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Options</label>
                    <div className="space-y-1">
                      {OPTIONS.map(opt => (
                        <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={ef.options.includes(opt.key)} onChange={() => toggleOpt(opt.key)}
                            className="w-3.5 h-3.5 accent-violet-600" />
                          <span className={cn('text-xs flex-1', tp)}>{opt.label}</span>
                          <span className={cn('text-[11px]', ts)}>{opt.price} CAD</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                      <Check size={13} /> Enregistrer
                    </button>
                    <button onClick={() => setEditing(false)}
                      className={cn('flex-1 text-xs font-medium py-2 rounded-lg border transition-colors',
                        isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
                      Annuler
                    </button>
                  </div>
                </div>
              )
            })() : (
            /* ── View mode ── */
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {[
                { icon: CalendarDays, label: 'Date',       value: selected.date },
                { icon: Clock,        label: 'Créneau',    value: `${selected.start_time} – ${selected.end_time}` },
                { icon: Clock,        label: 'Durée',      value: `${selected.duration}h` },
                { icon: Tag,          label: 'Offre',      value: selected.service },
                showClientDetails && selected.price && { icon: Banknote, label: 'Prix', value: `${selected.price} CAD` },
                selected.persons && { icon: Users, label: 'Face caméra', value: `${selected.persons} personne${selected.persons > 1 ? 's' : ''}` },
                showClientDetails && selected.client_email && { icon: Mail,     label: 'Email',     value: selected.client_email },
                showClientDetails && selected.client_phone && { icon: Phone,    label: 'Téléphone', value: selected.client_phone },
                showClientDetails && selected.company     && { icon: Building2, label: 'Société',   value: selected.company },
              ].filter(Boolean).map(({ icon: Icon, label, value }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', isDark ? 'bg-zinc-800' : 'bg-gray-100')}>
                    <Icon size={13} className={ts} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-[11px] font-semibold uppercase tracking-wide', ts)}>{label}</p>
                    <p className={cn('text-sm font-medium truncate', tp)}>{value}</p>
                  </div>
                </div>
              ))}
              {selected.additional_services?.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', isDark ? 'bg-zinc-800' : 'bg-gray-100')}>
                    <Tag size={13} className={ts} />
                  </div>
                  <div>
                    <p className={cn('text-[11px] font-semibold uppercase tracking-wide', ts)}>Options</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selected.additional_services.map(s => (
                        <span key={s} className={cn('text-[11px] px-2 py-0.5 rounded-full', isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600')}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Ref footer */}
            <div className={cn('px-4 py-2.5 border-t flex-shrink-0 flex items-center gap-2', divider)}>
              <p className={cn('text-[11px] font-mono', ts)}>#{selected.id}</p>
              {onDelete && !editing && (
                <button
                  onClick={() => {
                    if (confirm('Mettre cette réservation à la corbeille ?')) {
                      onDelete(selected.id)
                      setSelected(null)
                    }
                  }}
                  title="Mettre à la corbeille"
                  className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50')}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', isDark ? 'bg-zinc-800' : 'bg-gray-100')}>
              <CalendarDays size={22} className={ts} />
            </div>
            <p className={cn('text-sm font-semibold', tp)}>Sélectionnez une session</p>
            <p className={cn('text-xs', ts)}>Cliquez sur un événement pour voir ses détails</p>

            {/* Mini legend / stats */}
            <div className="w-full mt-4 space-y-2">
              {studios.slice(1).map(s => {
                const col = stColor(s)
                const count = reservations.filter(r => r.studio === s).length
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: col.bg }} />
                    <span className={cn('text-xs flex-1 text-left', ts)}>{s}</span>
                    <span className={cn('text-xs font-bold', tp)}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
