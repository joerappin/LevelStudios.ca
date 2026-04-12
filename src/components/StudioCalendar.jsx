import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Phone, Mail, Building2, Users, Clock, CalendarDays, Tag, Banknote, Trash2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { cn } from '../utils'

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
export default function StudioCalendar({ reservations = [], showClientDetails = true, onDelete }) {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const now  = new Date()
  const today = now.toISOString().split('T')[0]

  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth())
  const [filter,  setFilter]  = useState('Tous')
  const [selected, setSelected] = useState(null) // reservation object

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
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: selectedCol?.bg }}
                    />
                    <span className="text-xs font-bold" style={{ color: selectedCol?.text }}>{selected.studio}</span>
                  </div>
                  {showClientDetails && (
                    <p className={cn('font-bold text-base truncate', tp)}>{selected.client_name}</p>
                  )}
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', selectedSt?.cls)}>
                    {selectedSt?.label || selected.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className={cn('p-1 rounded-lg flex-shrink-0 transition-colors mt-0.5', isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200')}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Info rows */}
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
                        <span key={s} className={cn('text-[11px] px-2 py-0.5 rounded-full', isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600')}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ref footer */}
            <div className={cn('px-4 py-2.5 border-t flex-shrink-0 flex items-center gap-2', divider)}>
              <p className={cn('text-[11px] font-mono', ts)}>#{selected.id}</p>
              {onDelete && (
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
