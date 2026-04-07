import React, { useState, useEffect } from 'react'
import { Search, Eye, X, ChevronDown } from 'lucide-react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'

const STATUS_MAP = {
  validee:     { label: 'Validée',      cls: 'bg-green-500/20 text-green-400' },
  livree:      { label: 'Livrée',       cls: 'bg-blue-500/20 text-blue-400' },
  en_attente:  { label: 'En attente',   cls: 'bg-yellow-500/20 text-yellow-400' },
  pending:     { label: 'En attente',   cls: 'bg-yellow-500/20 text-yellow-400' },
  annulee:     { label: 'Annulée',      cls: 'bg-red-500/20 text-red-400' },
}

const PERIODS = ['Jour', 'Semaine', 'Mois', 'Année']

export default function ChefBooking() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [reservations, setReservations] = useState([])
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('Mois')
  const [dateFilter, setDateFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  useEffect(() => { setReservations(Store.getReservations()) }, [])

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  const periodFiltered = reservations.filter(r => {
    const d = new Date(r.date)
    if (dateFilter) return r.date === dateFilter
    if (period === 'Jour') return r.date === today
    if (period === 'Semaine') {
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
      return d >= weekAgo
    }
    if (period === 'Mois') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (period === 'Année') return d.getFullYear() === now.getFullYear()
    return true
  })

  const displayed = periodFiltered.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q) ||
      r.client_id?.toLowerCase().includes(q) ||
      r.date?.includes(q)
    )
  })

  return (
    <Layout navItems={CHEF_NAV} title="Booking">
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={cn('flex rounded-xl overflow-hidden border', isDark ? 'border-zinc-700' : 'border-gray-300')}>
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setDateFilter('') }}
                className={cn('px-3 py-2 text-sm font-medium transition-colors',
                  period === p && !dateFilter ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-900'
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className={cn('px-3 py-2 rounded-xl text-sm border', inputClass)}
          />
          <div className={cn('flex items-center gap-2 border rounded-xl px-3 py-2 flex-1 min-w-[200px]', isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-300')}>
            <Search size={14} className={textSecondary} />
            <input
              type="text"
              placeholder="Rechercher par nom, ID résa, date..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={cn('flex-1 text-sm bg-transparent outline-none', textPrimary)}
            />
          </div>
        </div>

        {/* Table */}
        <div className={cn('border rounded-2xl overflow-hidden', card)}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn('border-b text-left', isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-gray-100 bg-gray-50')}>
                  {['ID Résa','ID Client','Validation','Date','Studio','Créneau','Heures','Prix','Promo','Statut','Actions'].map(h => (
                    <th key={h} className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap', textSecondary)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr><td colSpan={11} className={cn('px-4 py-8 text-center text-sm', textSecondary)}>Aucune réservation trouvée</td></tr>
                ) : displayed.map(r => {
                  const st = STATUS_MAP[r.status] || { label: r.status, cls: 'bg-zinc-500/20 text-zinc-400' }
                  return (
                    <tr key={r.id} className={cn('border-b last:border-0', isDark ? 'border-zinc-800 hover:bg-zinc-800/40' : 'border-gray-100 hover:bg-gray-50')}>
                      <td className={cn('px-4 py-3 font-mono text-xs', textSecondary)}>{r.id}</td>
                      <td className={cn('px-4 py-3 font-mono text-xs', textSecondary)}>{r.client_id || '—'}</td>
                      <td className={cn('px-4 py-3 text-xs', textSecondary)}>{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className={cn('px-4 py-3 font-medium', textPrimary)}>{r.date}</td>
                      <td className={cn('px-4 py-3', textPrimary)}>{r.studio}</td>
                      <td className={cn('px-4 py-3 whitespace-nowrap', textSecondary)}>{r.start_time}–{r.end_time}</td>
                      <td className={cn('px-4 py-3', textPrimary)}>{r.duration}h</td>
                      <td className={cn('px-4 py-3 font-semibold', textPrimary)}>{r.price} CAD</td>
                      <td className={cn('px-4 py-3 text-xs', textSecondary)}>{r.promo_code || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', st.cls)}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(r)}
                          className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={cn('text-xs', textSecondary)}>{displayed.length} réservation{displayed.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelected(null)}>
          <div
            className={cn('w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto', isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200 shadow-xl')}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className={cn('font-bold text-lg', textPrimary)}>Détail réservation</h3>
              <button onClick={() => setSelected(null)} className={textSecondary}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['ID', selected.id],
                ['Client', selected.client_name],
                ['Email', selected.client_email],
                ['Téléphone', selected.client_phone || '—'],
                ['Société', selected.company || '—'],
                ['Studio', selected.studio],
                ['Date', selected.date],
                ['Créneau', `${selected.start_time} – ${selected.end_time}`],
                ['Durée', `${selected.duration}h`],
                ['Service', selected.service],
                ['Prix', `${selected.price} CAD`],
                ['Promo', selected.promo_code || '—'],
                ['Statut', STATUS_MAP[selected.status]?.label || selected.status],
                ['Options', selected.additional_services?.join(', ') || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className={cn('text-xs mb-0.5', textSecondary)}>{label}</div>
                  <div className={cn('text-sm font-medium break-all', textPrimary)}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
