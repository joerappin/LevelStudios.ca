import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronDown, Check, CheckCheck, Send, X, Edit2, Trash2,
} from 'lucide-react'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = {
  present:           { label: 'Présent',             color: '#22c55e' },
  absent_injustifie: { label: 'Absence injustifiée', color: '#ef4444' },
  indisponible:      { label: 'Indisponibilité',     color: '#f97316' },
  retard:            { label: 'Retard',              color: '#eab308' },
  conge:             { label: 'Congé',               color: '#3b82f6' },
  arret:             { label: 'Arrêt de travail',    color: '#8b5cf6' },
}
const STATUS_ORDER = ['present', 'absent_injustifie', 'indisponible', 'retard', 'conge', 'arret']

const STUDIOS = ['Présentiel', 'Télétravail']
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAYS_SHORT_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAYS_LONG_FR  = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getISOWeekKey(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function loadProjection() {
  try { return JSON.parse(localStorage.getItem('ls_rh_projection') || '{}') } catch { return {} }
}
function saveProjection(data) { localStorage.setItem('ls_rh_projection', JSON.stringify(data)) }
function loadPlanning() {
  try { return JSON.parse(localStorage.getItem('ls_rh_planning') || '{}') } catch { return {} }
}
function savePlanning(data) { localStorage.setItem('ls_rh_planning', JSON.stringify(data)) }

// ─── PROJECTION TAB ───────────────────────────────────────────────────────────
function ProjectionTab({ employees, freelances = [], isDark }) {
  const [viewDate, setViewDate]     = useState(new Date())
  const [projection, setProjection] = useState(loadProjection)
  const [pickerCell, setPickerCell] = useState(null) // { empId, dateStr }
  const [expandedEmp, setExpandedEmp] = useState(null) // empId | null
  const pickerRef = useRef()

  const year        = viewDate.getFullYear()
  const month       = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthDates  = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1)
    return { date: d, str: toYMD(d), dow: d.getDay() }
  })

  // Close picker on outside click
  useEffect(() => {
    if (!pickerCell) return
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerCell(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerCell])

  function getStatus(empId, dateStr, dow, defaultStatus = 'present') {
    if (dow === 0 || dow === 6) return null // weekend
    return projection[empId]?.[dateStr] || defaultStatus
  }

  function setStatus(empId, dateStr, status) {
    const next = { ...projection, [empId]: { ...(projection[empId] || {}) } }
    if (status === 'present') delete next[empId][dateStr]
    else next[empId][dateStr] = status
    setProjection(next)
    saveProjection(next)
    setPickerCell(null)
  }

  const prevMonth = () => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })
  const nextMonth = () => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })

  const card  = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const tp    = isDark ? 'text-white' : 'text-gray-900'
  const ts    = isDark ? 'text-zinc-400' : 'text-gray-500'
  const rowH  = isDark ? 'border-zinc-800' : 'border-gray-100'
  const thead = isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-gray-100 bg-gray-50'
  const stickyBg = isDark ? 'bg-zinc-900' : 'bg-white'
  const stickyHd = isDark ? 'bg-zinc-800' : 'bg-gray-50'

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth}
            className={`p-2 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
            <ChevronLeft size={16} />
          </button>
          <h3 className={`text-base font-bold w-44 text-center ${tp}`}>
            {MONTHS_FR[month]} {year}
          </h3>
          <button onClick={nextMonth}
            className={`p-2 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
            <ChevronRight size={16} />
          </button>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {STATUS_ORDER.map(key => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUSES[key].color }} />
              <span className={`text-xs ${ts}`}>{STATUSES[key].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar table */}
      <div className={`border rounded-xl overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table style={{ minWidth: `${180 + daysInMonth * 34}px`, borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr className={`border-b ${thead}`}>
                <th className={`text-left px-4 py-3 text-xs font-semibold sticky left-0 z-10 ${stickyHd} ${ts}`}
                  style={{ minWidth: 170 }}>
                  Employé
                </th>
                {monthDates.map(({ str, dow, date }) => {
                  const isWknd = dow === 0 || dow === 6
                  return (
                    <th key={str} className={`py-3 text-center text-xs font-medium ${isWknd ? ts + ' opacity-40' : ts}`}
                      style={{ minWidth: 32, width: 32 }}>
                      <div>{DAYS_SHORT_FR[dow].charAt(0)}</div>
                      <div className="font-bold">{date.getDate()}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth + 1} className={`text-center py-16 ${ts}`}>
                    Aucun employé trouvé
                  </td>
                </tr>
              )}
              {employees.map(emp => {
                const isExpanded = expandedEmp === emp.id
                return (
                  <React.Fragment key={emp.id}>
                    <tr className={`border-b ${rowH}`}>
                      <td
                        className={`px-4 py-2 sticky left-0 z-10 ${stickyBg} cursor-pointer select-none`}
                        onClick={() => setExpandedEmp(isExpanded ? null : emp.id)}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`text-sm font-semibold ${tp}`}>{emp.name}</div>
                          <ChevronDown size={12} className={`transition-transform duration-200 ${ts} ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        <div className={`text-xs ${ts}`}>{emp.role}</div>
                      </td>
                      {monthDates.map(({ str, dow }) => {
                        const isWknd = dow === 0 || dow === 6
                        const status = getStatus(emp.id, str, dow, 'present')
                        const s = status ? STATUSES[status] : null
                        const isOpen = pickerCell?.empId === emp.id && pickerCell?.dateStr === str
                        return (
                          <td key={str} className="text-center py-1.5 relative" style={{ width: 32 }}>
                            {isWknd ? (
                              <div className={`w-5 h-5 mx-auto rounded opacity-15 ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`} />
                            ) : (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); setPickerCell(isOpen ? null : { empId: emp.id, dateStr: str }) }}
                                  title={s?.label}
                                  className="w-5 h-5 mx-auto rounded-full transition-transform hover:scale-125 flex items-center justify-center"
                                  style={{ background: s?.color || '#22c55e' }}
                                />
                                {isOpen && (
                                  <div ref={pickerRef}
                                    className={`absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 rounded-xl border shadow-2xl overflow-hidden ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}
                                    style={{ minWidth: 200 }}>
                                    {STATUS_ORDER.map(key => {
                                      const s2 = STATUSES[key]
                                      const current = (projection[emp.id]?.[str] || 'present') === key
                                      return (
                                        <button key={key} onClick={() => setStatus(emp.id, str, key)}
                                          className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-left transition-colors ${
                                            current
                                              ? isDark ? 'bg-zinc-700' : 'bg-gray-100'
                                              : isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
                                          }`}>
                                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s2.color }} />
                                          <span className={isDark ? 'text-zinc-200' : 'text-gray-700'}>{s2.label}</span>
                                          {current && <Check size={11} className="ml-auto text-violet-400" />}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                    {isExpanded && (
                      <tr className={`border-b ${rowH}`}>
                        <td colSpan={daysInMonth + 1} className={`px-4 py-3 ${isDark ? 'bg-zinc-800/60' : 'bg-gray-50'}`}>
                          <div className={`text-xs font-semibold mb-2 ${ts}`}>RÉSUMÉ DE {MONTHS_FR[month].toUpperCase()} — {emp.name}</div>
                          <div className="flex flex-wrap gap-2">
                            {STATUS_ORDER.map(key => {
                              const count = monthDates.filter(({ str, dow }) => {
                                if (dow === 0 || dow === 6) return false
                                return (projection[emp.id]?.[str] || 'present') === key
                              }).length
                              return (
                                <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-white border border-gray-100'}`}>
                                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUSES[key].color }} />
                                  <span className={`text-xs ${ts}`}>{STATUSES[key].label}</span>
                                  <span className={`text-xs font-bold ${tp}`}>{count}j</span>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}

              {/* ── Séparateur Freelance ──────────────────────────────────── */}
              {freelances.length > 0 && (
                <tr>
                  <td colSpan={daysInMonth + 1} className={`px-4 py-2 ${isDark ? 'bg-zinc-800/40' : 'bg-amber-50/60'}`}>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Freelances — Indisponible par défaut</span>
                  </td>
                </tr>
              )}
              {freelances.map(emp => {
                const isExpanded = expandedEmp === emp.id
                return (
                  <React.Fragment key={emp.id}>
                    <tr className={`border-b ${rowH}`}>
                      <td
                        className={`px-4 py-2 sticky left-0 z-10 ${stickyBg} cursor-pointer select-none`}
                        onClick={() => setExpandedEmp(isExpanded ? null : emp.id)}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`text-sm font-semibold text-amber-400`}>{emp.name}</div>
                          <ChevronDown size={12} className={`transition-transform duration-200 ${ts} ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-xs text-amber-400/60">Freelance</div>
                      </td>
                      {monthDates.map(({ str, dow }) => {
                        const isWknd = dow === 0 || dow === 6
                        const status = getStatus(emp.id, str, dow, 'indisponible')
                        const s = status ? STATUSES[status] : null
                        const isOpen = pickerCell?.empId === emp.id && pickerCell?.dateStr === str
                        return (
                          <td key={str} className="text-center py-1.5 relative" style={{ width: 32 }}>
                            {isWknd ? (
                              <div className={`w-5 h-5 mx-auto rounded opacity-15 ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`} />
                            ) : (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); setPickerCell(isOpen ? null : { empId: emp.id, dateStr: str }) }}
                                  title={s?.label}
                                  className="w-5 h-5 mx-auto rounded-full transition-transform hover:scale-125"
                                  style={{ background: s?.color || STATUSES.indisponible.color }}
                                />
                                {isOpen && (
                                  <div ref={pickerRef}
                                    className={`absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 rounded-xl border shadow-2xl overflow-hidden ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}
                                    style={{ minWidth: 200 }}>
                                    {STATUS_ORDER.map(key => {
                                      const s2 = STATUSES[key]
                                      const current = (projection[emp.id]?.[str] || 'indisponible') === key
                                      return (
                                        <button key={key} onClick={() => setStatus(emp.id, str, key)}
                                          className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-left transition-colors ${
                                            current
                                              ? isDark ? 'bg-zinc-700' : 'bg-gray-100'
                                              : isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
                                          }`}>
                                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s2.color }} />
                                          <span className={isDark ? 'text-zinc-200' : 'text-gray-700'}>{s2.label}</span>
                                          {current && <Check size={11} className="ml-auto text-amber-400" />}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                    {isExpanded && (
                      <tr className={`border-b ${rowH}`}>
                        <td colSpan={daysInMonth + 1} className={`px-4 py-3 ${isDark ? 'bg-zinc-800/60' : 'bg-amber-50'}`}>
                          <div className="text-xs font-semibold mb-2 text-amber-400">RÉSUMÉ DE {MONTHS_FR[month].toUpperCase()} — {emp.name}</div>
                          <div className="flex flex-wrap gap-2">
                            {STATUS_ORDER.map(key => {
                              const count = monthDates.filter(({ str, dow }) => {
                                if (dow === 0 || dow === 6) return false
                                return (projection[emp.id]?.[str] || 'indisponible') === key
                              }).length
                              return (
                                <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-white border border-gray-100'}`}>
                                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUSES[key].color }} />
                                  <span className={`text-xs ${ts}`}>{STATUSES[key].label}</span>
                                  <span className={`text-xs font-bold ${tp}`}>{count}j</span>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

// ─── PLANNING TAB ─────────────────────────────────────────────────────────────
function PlanningTab({ employees, isDark }) {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()))
  const [planning, setPlanning]   = useState(loadPlanning)
  const [editCell, setEditCell]   = useState(null) // { empId, dateStr }
  const [editVal, setEditVal]     = useState({ start: '09:00', end: '18:00', studio: 'Présentiel' })
  const [sentMsg, setSentMsg]     = useState(null)
  const [sentMails, setSentMails] = useState([])

  const weekKey   = getISOWeekKey(weekStart)
  const weekDates = getWeekDates(weekStart)

  const loadSentMails = useCallback(() => {
    const all = Store.getMails()
    setSentMails(all.filter(m => m.planning_week === weekKey && !m.draft && m.sent_at))
  }, [weekKey])

  useEffect(() => { loadSentMails() }, [loadSentMails])

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n })
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n })

  function getCell(empId, dateStr) {
    return planning[weekKey]?.[empId]?.[dateStr] || null
  }

  function openEdit(empId, dateStr) {
    const cur = getCell(empId, dateStr)
    setEditVal(cur ? { ...cur } : { start: '09:00', end: '18:00', studio: 'Présentiel' })
    setEditCell({ empId, dateStr })
  }

  function saveCell() {
    if (!editCell) return
    const { empId, dateStr } = editCell
    const next = JSON.parse(JSON.stringify(planning))
    if (!next[weekKey]) next[weekKey] = {}
    if (!next[weekKey][empId]) next[weekKey][empId] = {}
    next[weekKey][empId][dateStr] = { ...editVal }
    setPlanning(next)
    savePlanning(next)
    setEditCell(null)
  }

  function clearCell(empId, dateStr) {
    const next = JSON.parse(JSON.stringify(planning))
    if (next[weekKey]?.[empId]?.[dateStr]) {
      delete next[weekKey][empId][dateStr]
      setPlanning(next)
      savePlanning(next)
    }
    setEditCell(null)
  }

  function sendPlanningMails() {
    const weekPlanning = planning[weekKey] || {}
    let count = 0

    employees.forEach(emp => {
      const empSched = weekPlanning[emp.id]
      if (!empSched || Object.keys(empSched).length === 0) return

      const rows = weekDates.map(d => {
        const ds = toYMD(d)
        const cell = empSched[ds]
        const dayName = DAYS_LONG_FR[d.getDay()]
        const dayNum  = `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
        if (!cell) {
          return `<tr>
            <td style="padding:10px 14px;color:#6b7280;font-size:13px">${dayName} ${dayNum}</td>
            <td style="padding:10px 14px;color:#6b7280;font-size:13px">—</td>
            <td style="padding:10px 14px;color:#6b7280;font-size:13px">—</td>
          </tr>`
        }
        return `<tr>
          <td style="padding:10px 14px;font-size:13px;font-weight:600">${dayName} ${dayNum}</td>
          <td style="padding:10px 14px;font-size:13px">${cell.start} – ${cell.end}</td>
          <td style="padding:10px 14px;font-size:13px">${cell.studio}</td>
        </tr>`
      }).join('')

      const body = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;color:#111">
        <div style="background:#0f0f0f;padding:24px 28px;border-radius:12px 12px 0 0">
          <div style="color:#a78bfa;font-size:12px;font-weight:700;letter-spacing:1px;margin-bottom:6px">LEVEL STUDIOS</div>
          <h2 style="color:#fff;margin:0;font-size:20px">Planning — ${weekKey}</h2>
          <p style="color:#9ca3af;margin:8px 0 0;font-size:13px">
            Semaine du ${weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            au ${weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style="background:#fafafa;padding:20px 28px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
          <p style="margin:0 0 16px;font-size:14px;color:#374151">Bonjour <strong>${emp.name}</strong>,</p>
          <p style="margin:0 0 16px;font-size:14px;color:#374151">Voici votre planning pour la semaine :</p>
          <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
            <thead>
              <tr style="background:#1e1b4b">
                <th style="padding:10px 14px;text-align:left;color:#a78bfa;font-size:12px;font-weight:700">JOUR</th>
                <th style="padding:10px 14px;text-align:left;color:#a78bfa;font-size:12px;font-weight:700">HORAIRES</th>
                <th style="padding:10px 14px;text-align:left;color:#a78bfa;font-size:12px;font-weight:700">STUDIO</th>
              </tr>
            </thead>
            <tbody style="background:#fff">${rows}</tbody>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
            Ce message a été envoyé automatiquement depuis Level Studios.<br/>
            Pour toute question, contactez votre responsable.
          </p>
        </div>
      </div>`

      Store.addMail({
        from_email:      user?.email || 'admin@levelstudios.ca',
        from_name:       user?.name  || 'Level Studios',
        to:              [{ email: emp.email, name: emp.name }],
        cc:              [],
        subject:         `Planning ${weekKey} — ${emp.name}`,
        body,
        attachments:     [],
        urgent:          false,
        labels:          [],
        sent_at:         new Date().toISOString(),
        read:            false,
        read_by:         [],
        planning_week:   weekKey,
        requires_receipt: true,
      })
      count++
    })

    setSentMsg(count > 0
      ? `Planning envoyé à ${count} employé${count > 1 ? 's' : ''}.`
      : 'Aucun horaire défini — rien à envoyer.')
    setTimeout(() => setSentMsg(null), 5000)
    loadSentMails()
  }

  const card     = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const tp       = isDark ? 'text-white' : 'text-gray-900'
  const ts       = isDark ? 'text-zinc-400' : 'text-gray-500'
  const rowH     = isDark ? 'border-zinc-800' : 'border-gray-100'
  const thead    = isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-gray-100 bg-gray-50'
  const stickyBg = isDark ? 'bg-zinc-900' : 'bg-white'
  const stickyHd = isDark ? 'bg-zinc-800' : 'bg-gray-50'
  const inputCls = isDark ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-gray-100 text-gray-900 border-gray-200'

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={prevWeek}
            className={`p-2 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
            <ChevronLeft size={16} />
          </button>
          <div className={`text-center ${tp}`}>
            <div className="text-sm font-bold">{weekKey}</div>
            <div className={`text-xs ${ts}`}>
              {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              {' '}–{' '}
              {weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <button onClick={nextWeek}
            className={`p-2 rounded-lg border transition-colors ${isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {sentMsg && (
            <span className={`text-sm flex items-center gap-1.5 ${sentMsg.includes('Aucun') ? ts : 'text-green-400'}`}>
              <Check size={14} /> {sentMsg}
            </span>
          )}
          <button onClick={sendPlanningMails}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30">
            <Send size={14} /> Valider et envoyer le planning
          </button>
        </div>
      </div>

      {/* Planning table */}
      <div className={`border rounded-xl overflow-hidden mb-5 ${card}`}>
        <div className="overflow-x-auto">
          <table style={{ minWidth: 860, borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr className={`border-b ${thead}`}>
                <th className={`text-left px-4 py-3 text-xs font-semibold sticky left-0 z-10 ${stickyHd} ${ts}`}
                  style={{ minWidth: 150 }}>
                  Employé
                </th>
                {weekDates.map(d => {
                  const isWknd = d.getDay() === 0 || d.getDay() === 6
                  const isToday = toYMD(d) === toYMD(new Date())
                  return (
                    <th key={toYMD(d)}
                      className={`text-center py-3 px-1 text-xs font-medium ${isWknd ? ts + ' opacity-50' : tp}`}
                      style={{ minWidth: 110 }}>
                      <div className={isToday ? 'text-violet-400' : ''}>{DAYS_SHORT_FR[d.getDay()]}</div>
                      <div className={`font-bold text-sm ${isToday ? 'text-violet-400' : ''}`}>{d.getDate()}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className={`text-center py-16 ${ts}`}>Aucun employé trouvé</td>
                </tr>
              )}
              {employees.map(emp => (
                <tr key={emp.id} className={`border-b last:border-0 ${rowH}`}>
                  <td className={`px-4 py-3 sticky left-0 z-10 ${stickyBg}`}>
                    <div className={`text-sm font-semibold ${tp}`}>{emp.name}</div>
                    <div className={`text-xs ${ts}`}>{emp.role}</div>
                  </td>
                  {weekDates.map(d => {
                    const dateStr = toYMD(d)
                    const isWknd = d.getDay() === 0 || d.getDay() === 6
                    const cell   = getCell(emp.id, dateStr)
                    const isEdit = editCell?.empId === emp.id && editCell?.dateStr === dateStr

                    return (
                      <td key={dateStr} className={`px-1.5 py-2 align-top ${isWknd ? 'opacity-30' : ''}`}>
                        {isEdit ? (
                          <div className={`rounded-xl border p-2.5 shadow-xl ${isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-gray-300'}`}>
                            <div className="flex items-center gap-1 mb-1.5">
                              <input type="time" value={editVal.start}
                                onChange={e => setEditVal(v => ({ ...v, start: e.target.value }))}
                                className={`flex-1 text-xs rounded border px-1 py-0.5 outline-none ${inputCls}`} />
                              <span className={`text-xs flex-shrink-0 ${ts}`}>–</span>
                              <input type="time" value={editVal.end}
                                onChange={e => setEditVal(v => ({ ...v, end: e.target.value }))}
                                className={`flex-1 text-xs rounded border px-1 py-0.5 outline-none ${inputCls}`} />
                            </div>
                            <select value={editVal.studio}
                              onChange={e => setEditVal(v => ({ ...v, studio: e.target.value }))}
                              className={`w-full text-xs rounded border px-1 py-0.5 outline-none mb-2 ${inputCls}`}>
                              {STUDIOS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <div className="flex gap-1">
                              <button onClick={saveCell}
                                className="flex-1 text-xs py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors">
                                OK
                              </button>
                              <button onClick={() => clearCell(emp.id, dateStr)}
                                className="text-xs px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors">
                                <Trash2 size={10} />
                              </button>
                              <button onClick={() => setEditCell(null)}
                                className={`text-xs px-2 py-1 rounded-lg transition-colors ${isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                                <X size={10} />
                              </button>
                            </div>
                          </div>
                        ) : cell ? (
                          <button onClick={() => !isWknd && openEdit(emp.id, dateStr)}
                            className={`w-full rounded-lg p-2 text-left transition-all group ${
                              isWknd ? 'cursor-default' : isDark ? 'bg-violet-500/15 hover:bg-violet-500/25' : 'bg-violet-50 hover:bg-violet-100'
                            }`}>
                            <div className="text-xs font-bold text-violet-400">{cell.start}–{cell.end}</div>
                            <div className={`text-xs ${ts}`}>{cell.studio}</div>
                            <Edit2 size={9} className={`mt-0.5 opacity-0 group-hover:opacity-60 ${ts} transition-opacity`} />
                          </button>
                        ) : (
                          <button onClick={() => !isWknd && openEdit(emp.id, dateStr)} disabled={isWknd}
                            className={`w-full h-12 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center ${
                              isWknd
                                ? 'cursor-default opacity-0'
                                : isDark
                                  ? 'border-zinc-700 hover:border-violet-500/50 hover:bg-violet-500/5'
                                  : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'
                            }`}>
                            {!isWknd && <span className={`text-xs ${ts}`}>+</span>}
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Read receipts */}
      {sentMails.length > 0 && (
        <div className={`border rounded-xl p-4 ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${tp}`}>
            <CheckCheck size={15} className="text-violet-400" />
            Accusés de lecture — {weekKey}
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sentMails.map(mail => {
              const recipient = mail.to?.[0]
              const readBy = mail.read_by || []
              const entry  = readBy[0]
              return (
                <div key={mail.id}
                  className={`flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                  <div className="min-w-0">
                    <div className={`text-sm font-medium truncate ${tp}`}>{recipient?.name}</div>
                    <div className={`text-xs truncate ${ts}`}>{recipient?.email}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {entry ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCheck size={13} />
                          <span className="text-xs font-semibold">Lu</span>
                        </div>
                        <div className={`text-xs ${ts}`}>
                          {new Date(entry.read_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}{' '}
                          {new Date(entry.read_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Check size={13} className={ts} />
                        <span className={`text-xs ${ts}`}>Non lu</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FREELANCE TAB ────────────────────────────────────────────────────────────
const EMPTY_MISSION = { mission: '', startDate: '', endDate: '', amountHT: '', taxRate: '14.975', notes: '' }

function FreelanceTab({ freelances, isDark }) {
  const [missions, setMissions]   = useState({})
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState(EMPTY_MISSION)
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    const m = {}
    freelances.forEach(f => { m[f.id] = Store.getFreelanceMission(f.id) })
    setMissions(m)
    if (freelances.length && !editId) setEditId(freelances[0].id)
  }, [freelances]) // eslint-disable-line

  useEffect(() => {
    if (!editId) return
    setForm({ ...EMPTY_MISSION, ...missions[editId] })
  }, [editId]) // eslint-disable-line

  function save() {
    if (!editId) return
    Store.saveFreelanceMission(editId, form)
    setMissions(m => ({ ...m, [editId]: form }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const amountTTC = form.amountHT && form.taxRate
    ? (parseFloat(form.amountHT) * (1 + parseFloat(form.taxRate) / 100)).toFixed(2)
    : ''

  const tp       = isDark ? 'text-white' : 'text-gray-900'
  const ts       = isDark ? 'text-zinc-400' : 'text-gray-500'
  const card     = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const inputCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const rowH     = isDark ? 'border-zinc-800' : 'border-gray-100'

  if (freelances.length === 0) {
    return (
      <div className={`border rounded-xl p-12 text-center ${card}`}>
        <div className={`text-sm ${ts}`}>Aucun compte Freelance créé.<br/>Créez-en un depuis la gestion des comptes.</div>
      </div>
    )
  }

  const selected = freelances.find(f => f.id === editId)

  return (
    <div className="flex gap-5" style={{ minHeight: 420 }}>
      {/* List */}
      <div className={`border rounded-xl overflow-hidden flex-shrink-0 ${card}`} style={{ width: 240 }}>
        <div className={`px-4 py-3 border-b text-xs font-semibold ${ts} ${rowH}`}>FREELANCES</div>
        {freelances.map(f => {
          const m = missions[f.id] || {}
          const isActive = editId === f.id
          return (
            <button key={f.id} onClick={() => setEditId(f.id)}
              className={`w-full text-left px-4 py-3 border-b transition-colors ${rowH} ${isActive ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' : isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'}`}>
              <div className={`text-sm font-semibold ${isActive ? 'text-amber-400' : tp}`}>{f.name}</div>
              <div className={`text-xs truncate ${ts}`}>{m.mission || 'Aucune mission définie'}</div>
              {m.startDate && m.endDate && (
                <div className={`text-xs mt-0.5 ${ts}`}>
                  {new Date(m.startDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  {' – '}
                  {new Date(m.endDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className={`flex-1 border rounded-xl p-5 ${card}`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className={`text-base font-bold ${tp}`}>{selected.name}</div>
              <div className="text-xs text-amber-400 font-semibold">{selected.id}</div>
            </div>
            <button onClick={save}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors">
              {saved ? <><Check size={14} /> Sauvegardé</> : <><Check size={14} /> Enregistrer</>}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={`block text-xs font-semibold mb-1.5 ${ts}`}>Mission / Description</label>
              <textarea value={form.mission} onChange={e => setForm(f => ({ ...f, mission: e.target.value }))}
                rows={3} placeholder="Décrire la mission du prestataire…"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none ${inputCls}`} />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${ts}`}>Date de début</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${inputCls}`} />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${ts}`}>Date de fin</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${inputCls}`} />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${ts}`}>Montant HT (CAD)</label>
              <input type="number" min="0" step="0.01" value={form.amountHT} onChange={e => setForm(f => ({ ...f, amountHT: e.target.value }))}
                placeholder="Ex : 2500.00"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${inputCls}`} />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${ts}`}>Taux de taxe (%)</label>
              <input type="number" min="0" step="0.001" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                placeholder="Ex : 14.975"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${inputCls}`} />
            </div>

            {/* TTC calculé automatiquement */}
            {amountTTC && (
              <div className={`sm:col-span-2 flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <div>
                  <div className={`text-xs font-semibold ${ts}`}>Montant TTC</div>
                  <div className="text-lg font-bold text-amber-400">{parseFloat(amountTTC).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
                </div>
                <div className={`ml-auto text-xs ${ts}`}>
                  HT {parseFloat(form.amountHT).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  {' + '}taxes ({form.taxRate}%)
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className={`block text-xs font-semibold mb-1.5 ${ts}`}>Notes internes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Observations, clauses particulières…"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none ${inputCls}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function RHPanel() {
  const { theme }  = useApp()
  const isDark     = theme === 'dark'
  const [tab, setTab]         = useState('projection')
  const [allStaff, setAllStaff] = useState([])

  useEffect(() => {
    fetch('/api/accounts.php')
      .then(r => r.json())
      .then(accounts => {
        setAllStaff(accounts.filter(a => a.type !== 'client' && !a.deleted && a.active !== false))
      })
      .catch(() => {
        setAllStaff(Store.getEmployees().filter(e => !e.deleted && e.active !== false))
      })
  }, [])

  const employees  = allStaff.filter(e => e.roleKey !== 'freelance')
  const freelances = allStaff.filter(e => e.roleKey === 'freelance')

  const tp = isDark ? 'text-white' : 'text-gray-900'
  const ts = isDark ? 'text-zinc-400' : 'text-gray-500'

  const TABS = [
    { id: 'projection', label: 'Projection' },
    { id: 'planning',   label: 'Planning' },
    { id: 'freelance',  label: `Freelance${freelances.length ? ` (${freelances.length})` : ''}` },
  ]

  return (
    <div>
      {/* Sub-tab bar */}
      <div className={`flex items-center gap-1 mb-6 p-1 rounded-xl w-fit ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? t.id === 'freelance' ? 'bg-amber-500 text-black shadow-sm' : 'bg-violet-600 text-white shadow-sm'
                : isDark ? `${ts} hover:text-white` : `${ts} hover:text-gray-700`
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'projection' && <ProjectionTab employees={employees} freelances={freelances} isDark={isDark} />}
      {tab === 'planning'   && <PlanningTab   employees={employees} isDark={isDark} />}
      {tab === 'freelance'  && <FreelanceTab  freelances={freelances} isDark={isDark} />}
    </div>
  )
}
