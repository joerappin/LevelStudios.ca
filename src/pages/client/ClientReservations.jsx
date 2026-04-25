import React, { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import ClientLayout from '../../components/ClientLayout'
import { Store } from '../../data/store'
import { formatDate, STATUS_CONFIG, getTierConfig } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { translations } from '../../i18n/translations'
import { useReservations } from '../../hooks/useReservations'


const STUDIOS = ['Cambridge', 'Nook', 'Loft', 'Rooftop']

export default function ClientReservations() {
  const { user } = useAuth()
  const { theme, lang } = useApp()
  const t = (k) => translations[lang]?.[k] || k
  const isDark = theme === 'dark'

  const { reservations, reload } = useReservations({ clientEmail: user?.email })
  const [search, setSearch] = useState('')
  const [studioFilter, setStudioFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [cancelModal, setCancelModal] = useState(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 8

  const handleCancel = (resa) => {
    Store.updateReservation(resa.id, { status: 'annulee' })
    reload()
    setCancelModal(null)
  }

  // Annulation autorisée uniquement si la réservation est à plus de 48h
  const canCancel = (r) => {
    if (!r.date) return false
    const resaDate = new Date(`${r.date}T${r.start_time ? r.start_time + ':00' : '00:00:00'}`)
    return (resaDate - new Date()) / (1000 * 60 * 60) >= 48
  }

  const handlePay = (resa) => {
    Store.updateReservation(resa.id, { status: 'validee', paid_at: new Date().toISOString() })
    reload()
  }

  const filtered = reservations.filter(r => {
    const matchSearch = !search ||
      r.studio?.toLowerCase().includes(search.toLowerCase()) ||
      r.id?.toLowerCase().includes(search.toLowerCase())
    const matchStudio = !studioFilter || r.studio === studioFilter
    const matchDate = !dateFilter || r.date === dateFilter
    return matchSearch && matchStudio && matchDate
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const card = isDark
    ? 'bg-zinc-900 border border-zinc-800 rounded-2xl'
    : 'bg-white border border-gray-200 rounded-2xl shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const tableRow = isDark
    ? 'border-zinc-800 hover:bg-zinc-800/40'
    : 'border-gray-100 hover:bg-gray-50'
  const tableHead = isDark
    ? 'text-zinc-400 border-zinc-800 bg-zinc-900/50'
    : 'text-gray-500 border-gray-100 bg-gray-50'

  return (
    <ClientLayout title={t('my_reservations')}>
      <div className="space-y-5">
        <div id="__section-header" className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className={`text-2xl font-bold ${textPrimary} flex-1`}>{t('my_reservations')}</h2>
        </div>

        {/* Filters */}
        <div id="__section-filters" className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder={t('search')}
              className={`pl-8 pr-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-violet-500 w-52 ${inputClass}`}
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setPage(1) }}
            className={`px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-violet-500 ${inputClass}`}
          />
          <select
            value={studioFilter}
            onChange={e => { setStudioFilter(e.target.value); setPage(1) }}
            className={`px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-violet-500 ${inputClass}`}
          >
            <option value="">{t('all_studios')}</option>
            {STUDIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || dateFilter || studioFilter) && (
            <button
              onClick={() => { setSearch(''); setDateFilter(''); setStudioFilter(''); setPage(1) }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors ${isDark ? 'border-zinc-700 text-zinc-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-700'}`}
            >
              <X size={13} /> Effacer
            </button>
          )}
        </div>

        {/* Table */}
        <div id="__section-table" className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs font-semibold uppercase tracking-wide border-b ${tableHead}`}>
                  <th className="text-left px-4 py-3">{t('studio_col')}</th>
                  <th className="text-left px-4 py-3">{t('date_time')}</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">{t('time_slot')}</th>
                  <th className="text-left px-4 py-3">{t('status')}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">{t('duration')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`text-center py-16 ${textSecondary}`}>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">📅</span>
                        <p className="font-medium">{t('no_data')}</p>
                      </div>
                    </td>
                  </tr>
                ) : paginated.map(r => {
                  const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.validee
                  return (
                    <tr key={r.id} className={`border-b ${tableRow}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={{ 'studio a': '/studios/studio-a.jpg', 'studio b': '/studios/studio-b.jpg', 'studio c': '/studios/studio-c.png' }[(r.studio || '').toLowerCase().trim()] || '/studios/studio-a.jpg'}
                              alt={r.studio || ''}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className={`font-medium ${textPrimary}`}>{r.studio}</p>
                            {r.service && <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${getTierConfig(r.service).cls}`}>{getTierConfig(r.service).label}</span>}
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${textSecondary}`}>{formatDate(r.date)}</td>
                      <td className={`px-4 py-3 hidden sm:table-cell ${textSecondary}`}>
                        {r.start_time} – {r.end_time}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                            {lang === 'fr' ? st.label_fr : st.label_en}
                          </span>
                          {r.modified_by && r.modified_by !== user?.email && (
                            <span className="text-[10px] text-orange-400 font-medium">Modifiée par l'équipe</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 hidden md:table-cell ${textSecondary}`}>{r.duration}h</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {r.status === 'a_payer' && (
                            <button
                              onClick={() => handlePay(r)}
                              className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {t('pay')}
                            </button>
                          )}
                          {['validee', 'a_payer'].includes(r.status) && (
                            canCancel(r) ? (
                              <button
                                onClick={() => setCancelModal(r)}
                                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                                  isDark
                                    ? 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                                    : 'border-gray-200 text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                {t('cancel')}
                              </button>
                            ) : (
                              <span className={`text-[10px] font-medium px-2 py-1 rounded-lg ${isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-100 text-gray-400'}`} title="Annulation impossible moins de 48h avant la session">
                                Non annulable
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div id="__section-pagination" className={`flex items-center justify-between px-4 py-3 border-t text-sm ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
              <span className={textSecondary}>Page {page} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                >
                  <ChevronLeft size={16} className={textSecondary} />
                </button>
                <span className="px-3 py-1 rounded-lg font-semibold text-xs bg-violet-600 text-white">{page}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                >
                  <ChevronRight size={16} className={textSecondary} />
                </button>
              </div>
              <span className={textSecondary}>8 / page</span>
            </div>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCancelModal(null)} />
          <div className={`relative w-full max-w-sm ${card} p-6`}>
            <div className={`flex items-start gap-3 mb-4 p-3 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-800/40' : 'bg-red-50 border border-red-200'}`}>
              <span className="text-red-500 text-lg">⚠</span>
              <div>
                <p className={`font-semibold text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                  {t('cancel_confirm_title')}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-red-400/70' : 'text-red-600'}`}>
                  {t('cancel_confirm_msg')}
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
              <p className={`font-semibold text-sm ${textPrimary}`}>{cancelModal.studio}</p>
              <p className={`text-xs ${textSecondary}`}>
                {formatDate(cancelModal.date)} · {cancelModal.start_time} – {cancelModal.end_time}
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleCancel(cancelModal)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {t('cancel_reservation')}
              </button>
              <button
                onClick={() => setCancelModal(null)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {t('keep_reservation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  )
}
