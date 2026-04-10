import React, { useState, useEffect, useMemo } from 'react'
import {
  Receipt, TrendingUp, ChevronLeft, ChevronRight,
  RotateCcw, Tag, BarChart2, Building2, CalendarDays,
} from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { formatPrice } from '../../utils'

const PAID = ['validee', 'livree', 'tournee', 'post-prod']
const SKIP = ['annulee'] // excluded from hours + session count (cancelled = didn't happen)
const STUDIOS = ['Studio A', 'Studio B', 'Studio C']
const STUDIO_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500']
const STUDIO_TEXT   = ['text-violet-400', 'text-blue-400', 'text-emerald-400']
const STUDIO_BG     = ['bg-violet-500/10', 'bg-blue-500/10', 'bg-emerald-500/10']
const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const DAYS_FR   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function getMonday(d) {
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data, isDark, textSecondary, formatVal }) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-0.5 h-36 w-full">
      {data.map((d, i) => {
        const pct = Math.max(2, (d.value / maxVal) * 100)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            {/* Tooltip */}
            {d.value > 0 && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-zinc-800 text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-lg">
                {formatVal ? formatVal(d.value) : formatPrice(d.value)}
              </div>
            )}
            <div
              className={`w-full rounded-t transition-all ${d.value > 0 ? 'bg-violet-500/80 hover:bg-violet-500' : isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}
              style={{ height: `${pct}%` }}
            />
            <span className={`text-[8px] truncate w-full text-center leading-tight ${textSecondary}`} style={{ maxWidth: '100%' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Mini stat card ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, bg, card, textPrimary, textSecondary }) {
  return (
    <div className={`border rounded-2xl p-5 ${card}`}>
      <div className={`flex items-center gap-2 mb-2 text-xs font-semibold ${textSecondary}`}>
        <span className={`${color}`}>{icon}</span>
        {label}
      </div>
      <div className={`text-2xl font-black ${textPrimary}`}>{value}</div>
    </div>
  )
}

export default function AdminRecette() {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const [allRes, setAllRes] = useState([])
  const [trashedEmails, setTrashedEmails] = useState(new Set())
  const [period, setPeriod] = useState('year')  // day | week | month | year | all
  const [chartYear, setChartYear] = useState(new Date().getFullYear())
  const [chartMonth, setChartMonth] = useState(new Date().getMonth())

  useEffect(() => {
    setAllRes(Store.getReservations())
    fetch('/api/accounts.php?trash=1')
      .then(r => r.json())
      .then(trashed => setTrashedEmails(new Set(trashed.map(a => a.email))))
      .catch(() => {})
  }, [])

  // Active reservations (exclude trashed)
  const activeRes = useMemo(() => allRes.filter(r => !trashedEmails.has(r.client_email)), [allRes, trashedEmails])

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const tableHead = isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'
  const tableRow = isDark ? 'border-zinc-800/50 hover:bg-zinc-800/20' : 'border-gray-100 hover:bg-gray-50'

  const now = new Date()
  const todayStr = toYMD(now)

  // ─── Period filter ──────────────────────────────────────────────────────────
  function inPeriod(r) {
    const d = new Date(r.date)
    if (period === 'day')   return r.date === todayStr
    if (period === 'week') {
      const mon = getMonday(now)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59)
      return d >= mon && d <= sun
    }
    if (period === 'month') return d.getMonth() === chartMonth && d.getFullYear() === chartYear
    if (period === 'year')  return d.getFullYear() === chartYear
    return true // 'all'
  }

  const filtered  = activeRes.filter(r => inPeriod(r))
  // Countable = exclude cancelled reservations from hours + session counts
  const countable = filtered.filter(r => !SKIP.includes(r.status))
  const paid      = countable.filter(r => PAID.includes(r.status))
  const ca        = paid.reduce((s, r) => s + (r.price || 0), 0)
  const sessions  = countable.length
  const hours     = countable.reduce((s, r) => s + (r.duration || 0), 0)

  // ─── By studio ──────────────────────────────────────────────────────────────
  const studioStats = STUDIOS.map((s, si) => {
    const sRes  = countable.filter(r => r.studio === s)
    const sPaid = sRes.filter(r => PAID.includes(r.status))
    return {
      name: s,
      ca: sPaid.reduce((acc, r) => acc + (r.price || 0), 0),
      sessions: sRes.length,
      hours: sRes.reduce((acc, r) => acc + (r.duration || 0), 0),
      colorBar: STUDIO_COLORS[si],
      colorText: STUDIO_TEXT[si],
      colorBg: STUDIO_BG[si],
    }
  })

  // ─── Chart data ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const paidAll = activeRes.filter(r => PAID.includes(r.status))
    if (period === 'year' || period === 'all') {
      return MONTHS_FR.map((label, mi) => ({
        label,
        value: paidAll
          .filter(r => { const d = new Date(r.date); return d.getMonth() === mi && d.getFullYear() === chartYear })
          .reduce((s, r) => s + (r.price || 0), 0),
      }))
    }
    if (period === 'month') {
      const days = new Date(chartYear, chartMonth + 1, 0).getDate()
      return Array.from({ length: days }, (_, di) => {
        const dateStr = `${chartYear}-${String(chartMonth + 1).padStart(2, '0')}-${String(di + 1).padStart(2, '0')}`
        return {
          label: String(di + 1),
          value: paidAll.filter(r => r.date === dateStr).reduce((s, r) => s + (r.price || 0), 0),
        }
      })
    }
    if (period === 'week') {
      const mon = getMonday(now)
      return DAYS_FR.map((label, di) => {
        const d = new Date(mon); d.setDate(mon.getDate() + di)
        const dateStr = toYMD(d)
        return {
          label,
          value: paidAll.filter(r => r.date === dateStr).reduce((s, r) => s + (r.price || 0), 0),
        }
      })
    }
    // day: slots
    const TIME_SLOTS = ['09','10','11','12','13','14','15','16','17','18','19','20','21']
    return TIME_SLOTS.map(h => ({
      label: `${h}h`,
      value: paidAll.filter(r => r.date === todayStr && r.start_time?.startsWith(h)).reduce((s, r) => s + (r.price || 0), 0),
    }))
  }, [activeRes, period, chartYear, chartMonth])

  // ─── All-time totals (for summary row, also exclude cancelled) ─────────────
  const allPaid = activeRes.filter(r => !SKIP.includes(r.status) && PAID.includes(r.status))
  const caTotal = allPaid.reduce((s, r) => s + (r.price || 0), 0)

  // ─── Remboursements (all-time) ──────────────────────────────────────────────
  const refunded    = activeRes.filter(r => r.status === 'rembourse')
  const refundedCA  = refunded.reduce((s, r) => s + (r.price || 0), 0)

  // ─── Tarif réduit — reservations with promo code (all-time) ────────────────
  const discounted    = activeRes.filter(r => r.promo_code)
  const discountedCA  = discounted.reduce((s, r) => s + (r.price || 0), 0)
  // Estimate savings: compare with what it would have been at full price
  // We just show the total amount at promo price and count

  // ─── Year / month navigation ────────────────────────────────────────────────
  const canPrevYear  = chartYear > 2024
  const canNextYear  = chartYear < now.getFullYear() + 1
  const canPrevMonth = !(chartYear === 2024 && chartMonth === 0)
  const canNextMonth = !(chartYear === now.getFullYear() && chartMonth === now.getMonth())

  const PERIODS = [
    { key: 'day',   label: 'Jour' },
    { key: 'week',  label: 'Semaine' },
    { key: 'month', label: 'Mois' },
    { key: 'year',  label: 'Année' },
    { key: 'all',   label: 'Total' },
  ]

  const periodLabel = (() => {
    if (period === 'day')   return `${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
    if (period === 'week') {
      const mon = getMonday(now); const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return `${mon.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
    }
    if (period === 'month') return `${MONTHS_FR[chartMonth]} ${chartYear}`
    if (period === 'year')  return String(chartYear)
    return 'Depuis le début'
  })()

  return (
    <Layout navItems={ADMIN_NAV} title="Recette">
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-violet-400" />
            <h2 className={`text-xl font-bold ${textPrimary}`}>Recette</h2>
            <span className={`text-sm ${textSecondary}`}>— {periodLabel}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Year / month nav */}
            {(period === 'year' || period === 'month') && (
              <div className="flex items-center gap-1">
                {period === 'month' && (
                  <>
                    <button
                      onClick={() => { if (chartMonth === 0) { setChartMonth(11); setChartYear(y => y - 1) } else setChartMonth(m => m - 1) }}
                      disabled={!canPrevMonth}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    ><ChevronLeft className="w-4 h-4" /></button>
                    <span className={`text-sm font-semibold min-w-[90px] text-center ${textPrimary}`}>{MONTHS_FR[chartMonth]} {chartYear}</span>
                    <button
                      onClick={() => { if (chartMonth === 11) { setChartMonth(0); setChartYear(y => y + 1) } else setChartMonth(m => m + 1) }}
                      disabled={!canNextMonth}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    ><ChevronRight className="w-4 h-4" /></button>
                  </>
                )}
                {period === 'year' && (
                  <>
                    <button onClick={() => setChartYear(y => y - 1)} disabled={!canPrevYear} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft className="w-4 h-4" /></button>
                    <span className={`text-sm font-semibold min-w-[48px] text-center ${textPrimary}`}>{chartYear}</span>
                    <button onClick={() => setChartYear(y => y + 1)} disabled={!canNextYear} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronRight className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            )}
            {/* Period tabs */}
            <div className={`flex rounded-xl border overflow-hidden text-sm font-medium ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
              {PERIODS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-3 py-1.5 transition-colors ${period === key ? 'bg-violet-600 text-white' : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Summary KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`border rounded-2xl p-5 lg:col-span-1 ${card}`}>
            <div className={`flex items-center gap-1.5 mb-2 text-xs font-semibold ${textSecondary}`}>
              <TrendingUp className="w-3.5 h-3.5 text-green-400" /> CA période
            </div>
            <div className="text-2xl font-black text-green-400">{formatPrice(ca)}</div>
            {period !== 'all' && (
              <div className={`text-xs mt-1 ${textSecondary}`}>Total : {formatPrice(caTotal)}</div>
            )}
          </div>
          <StatCard label="Sessions" value={sessions} icon={<CalendarDays className="w-3.5 h-3.5" />} color="text-blue-400" card={card} textPrimary={textPrimary} textSecondary={textSecondary} />
          <StatCard label="Heures réservées" value={`${hours}h`} icon={<BarChart2 className="w-3.5 h-3.5" />} color="text-violet-400" card={card} textPrimary={textPrimary} textSecondary={textSecondary} />
          <StatCard label="CA moyen/session" value={paid.length > 0 ? formatPrice(ca / paid.length) : '—'} icon={<Receipt className="w-3.5 h-3.5" />} color="text-amber-400" card={card} textPrimary={textPrimary} textSecondary={textSecondary} />
        </div>

        {/* ── CA par studio ── */}
        <div className={`border rounded-2xl p-6 ${card}`}>
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-violet-400" />
            <h3 className={`font-bold ${textPrimary}`}>CA par studio</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {studioStats.map((s, si) => {
              const pct = ca > 0 ? Math.round((s.ca / ca) * 100) : 0
              return (
                <div key={s.name} className={`rounded-xl p-4 ${s.colorBg} border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-bold ${s.colorText}`}>{s.name}</span>
                    <span className={`text-xs font-bold ${s.colorText}`}>{pct}%</span>
                  </div>
                  <div className={`text-2xl font-black mb-1 ${textPrimary}`}>{formatPrice(s.ca)}</div>
                  <div className={`h-1.5 rounded-full mb-2 ${isDark ? 'bg-black/20' : 'bg-white/60'}`}>
                    <div className={`h-1.5 rounded-full transition-all ${s.colorBar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`text-xs ${textSecondary}`}>{s.sessions} session{s.sessions !== 1 ? 's' : ''} · {s.hours}h</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Revenue chart ── */}
        <div className={`border rounded-2xl p-6 ${card}`}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-violet-400" />
            <h3 className={`font-bold ${textPrimary}`}>
              {period === 'year' || period === 'all' ? `Évolution mensuelle ${chartYear}` :
               period === 'month' ? `CA journalier — ${MONTHS_FR[chartMonth]} ${chartYear}` :
               period === 'week'  ? 'CA cette semaine' :
               "CA aujourd'hui par tranche horaire"}
            </h3>
          </div>
          <BarChart data={chartData} isDark={isDark} textSecondary={textSecondary} />
          {/* Y-axis hint */}
          <div className={`flex justify-between mt-3 text-[10px] ${textSecondary}`}>
            <span>0</span>
            <span>{formatPrice(Math.max(...chartData.map(d => d.value), 0))}</span>
          </div>
        </div>

        {/* ── Tableau CA par studio x période ── */}
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className={`px-5 py-3 border-b ${isDark ? 'border-zinc-800' : 'border-gray-200'} flex items-center gap-2`}>
            <Building2 className="w-4 h-4 text-violet-400" />
            <h3 className={`font-bold text-sm ${textPrimary}`}>Détail CA studio — {periodLabel}</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className={`border-b text-xs font-semibold ${tableHead}`}>
                <th className="text-left px-5 py-3">Studio</th>
                <th className="text-right px-5 py-3">Sessions</th>
                <th className="text-right px-5 py-3 hidden sm:table-cell">Heures</th>
                <th className="text-right px-5 py-3">CA TTC</th>
                <th className="text-right px-5 py-3 hidden md:table-cell">Part %</th>
              </tr>
            </thead>
            <tbody>
              {studioStats.map((s, si) => {
                const pct = ca > 0 ? ((s.ca / ca) * 100).toFixed(1) : '0.0'
                return (
                  <tr key={s.name} className={`border-b transition-colors ${tableRow}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${s.colorBar}`} />
                        <span className={`text-sm font-medium ${textPrimary}`}>{s.name}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-right text-sm ${textPrimary}`}>{s.sessions}</td>
                    <td className={`px-5 py-3.5 text-right text-sm hidden sm:table-cell ${textSecondary}`}>{s.hours}h</td>
                    <td className={`px-5 py-3.5 text-right text-sm font-bold ${s.colorText}`}>{formatPrice(s.ca)}</td>
                    <td className={`px-5 py-3.5 text-right text-sm hidden md:table-cell ${textSecondary}`}>{pct}%</td>
                  </tr>
                )
              })}
              <tr className={isDark ? 'bg-zinc-800/40' : 'bg-gray-50'}>
                <td className={`px-5 py-3.5 text-sm font-bold ${textPrimary}`}>Total</td>
                <td className={`px-5 py-3.5 text-right text-sm font-bold ${textPrimary}`}>{sessions}</td>
                <td className={`px-5 py-3.5 text-right text-sm font-bold hidden sm:table-cell ${textPrimary}`}>{hours}h</td>
                <td className={`px-5 py-3.5 text-right text-sm font-bold text-green-400`}>{formatPrice(ca)}</td>
                <td className="px-5 py-3.5 text-right text-sm hidden md:table-cell">
                  <span className={`text-xs font-bold ${textSecondary}`}>100%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Remboursements + Tarif réduit ── */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Remboursements */}
          <div className={`border rounded-2xl p-6 ${card}`}>
            <div className="flex items-center gap-2 mb-5">
              <RotateCcw className="w-4 h-4 text-pink-400" />
              <h3 className={`font-bold ${textPrimary}`}>Remboursements</h3>
              <span className={`text-xs ${textSecondary}`}>— tout historique</span>
            </div>
            {refunded.length === 0 ? (
              <p className={`text-sm ${textSecondary}`}>Aucun remboursement enregistré.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 ${isDark ? 'bg-pink-500/5 border border-pink-500/20' : 'bg-pink-50 border border-pink-200'}`}>
                    <div className={`text-xs font-semibold mb-1 text-pink-400`}>Nombre</div>
                    <div className={`text-2xl font-black text-pink-400`}>{refunded.length}</div>
                  </div>
                  <div className={`rounded-xl p-3 ${isDark ? 'bg-pink-500/5 border border-pink-500/20' : 'bg-pink-50 border border-pink-200'}`}>
                    <div className={`text-xs font-semibold mb-1 text-pink-400`}>Montant total</div>
                    <div className={`text-xl font-black text-pink-400`}>{formatPrice(refundedCA)}</div>
                  </div>
                </div>
                <div className={`text-xs ${textSecondary}`}>
                  Montant moyen : <span className={textPrimary}>{formatPrice(refundedCA / refunded.length)}</span>
                </div>
                {/* List last 5 */}
                <div className="space-y-1.5">
                  {[...refunded].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5).map(r => (
                    <div key={r.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                      <div className={textSecondary}>
                        <span className={`font-medium ${textPrimary}`}>{r.client_name}</span>
                        {' · '}{r.studio}{' · '}{r.date}
                      </div>
                      <span className="text-pink-400 font-bold">{formatPrice(r.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tarif réduit */}
          <div className={`border rounded-2xl p-6 ${card}`}>
            <div className="flex items-center gap-2 mb-5">
              <Tag className="w-4 h-4 text-amber-400" />
              <h3 className={`font-bold ${textPrimary}`}>Tarifs réduits</h3>
              <span className={`text-xs ${textSecondary}`}>— avec code promo</span>
            </div>
            {discounted.length === 0 ? (
              <p className={`text-sm ${textSecondary}`}>Aucune réservation avec code promo.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className={`text-xs font-semibold mb-1 text-amber-400`}>Nombre</div>
                    <div className={`text-2xl font-black text-amber-400`}>{discounted.length}</div>
                  </div>
                  <div className={`rounded-xl p-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className={`text-xs font-semibold mb-1 text-amber-400`}>CA promos</div>
                    <div className={`text-xl font-black text-amber-400`}>{formatPrice(discountedCA)}</div>
                  </div>
                </div>
                <div className={`text-xs ${textSecondary}`}>
                  Part des sessions : <span className={textPrimary}>{activeRes.length > 0 ? ((discounted.length / activeRes.length) * 100).toFixed(1) : 0}%</span>
                  {' · '}CA moyen : <span className={textPrimary}>{formatPrice(discountedCA / discounted.length)}</span>
                </div>
                {/* Breakdown by promo code */}
                {(() => {
                  const byCode = {}
                  discounted.forEach(r => {
                    const code = r.promo_code || 'Inconnu'
                    if (!byCode[code]) byCode[code] = { count: 0, ca: 0 }
                    byCode[code].count++
                    byCode[code].ca += r.price || 0
                  })
                  return (
                    <div className="space-y-1.5">
                      {Object.entries(byCode).sort((a, b) => b[1].count - a[1].count).slice(0, 6).map(([code, data]) => (
                        <div key={code} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-amber-400`}>{code}</span>
                            <span className={textSecondary}>{data.count}×</span>
                          </div>
                          <span className={`font-bold ${textPrimary}`}>{formatPrice(data.ca)}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  )
}
