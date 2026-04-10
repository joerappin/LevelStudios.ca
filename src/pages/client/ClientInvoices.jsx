import React, { useState, useEffect } from 'react'
import {
  CalendarDays, Download, TrendingUp, Clock, Search, Star, X, Send,
} from 'lucide-react'
import ClientLayout from '../../components/ClientLayout'
import { Store } from '../../data/store'
import { formatDate, cn, STATUS_CONFIG, getTierConfig } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'

const PAID_STATUSES = ['validee', 'tournee', 'post-prod', 'livree']
const ALL_STATUSES  = ['a_payer', 'validee', 'tournee', 'post-prod', 'livree', 'annulee']

function getPrice(r) {
  const p = Store.getPrices()
  const svc = (id, fb) => p.services.find(s => s.id === id)?.price ?? fb
  const opt = (id, fb) => p.options.find(o => o.id === id)?.price ?? fb
  const pricePerHour = (r.service || '').toUpperCase().includes('GOLD') ? svc('GOLD', 587) : svc('ARGENT', 221)
  const base = (Number(r.duration) || 1) * pricePerHour
  const opts = r.options || {}
  const OPTION_PRICES = {
    photo: opt('Photo', 44), short: opt('Short', 44), thumbnail: opt('Miniature', 44),
    live: opt('Live', 662), briefing: opt('BriefingLive', 118), replay: opt('Replay', 74),
    cm: opt('CommunityManager', 147), coaching: opt('Coaching', 588),
  }
  return base + Object.entries(opts).reduce((s, [k, v]) => v ? s + (OPTION_PRICES[k] || 0) : s, 0)
}

function isRatable(r) {
  if (r.status === 'annulee') return false
  const sessionDate = new Date(r.date)
  const tomorrow = new Date(sessionDate)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return Date.now() >= tomorrow.getTime()
}

function StarRating({ value, onChange, size = 20 }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={cn(
              'transition-colors',
              n <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-zinc-600 fill-transparent'
            )}
          />
        </button>
      ))}
    </div>
  )
}

// ── Modal notation ────────────────────────────────────────────────────────────
function RatingModal({ reservation, onClose, onSave, isDark, mandatory = false }) {
  const [stars,   setStars]   = useState(0)
  const [comment, setComment] = useState('')
  const [error,   setError]   = useState('')

  function submit() {
    if (stars === 0)       return setError('Veuillez sélectionner une note.')
    if (!comment.trim())   return setError('Un commentaire est obligatoire.')
    onSave(reservation.id, stars, comment.trim())
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className={cn('w-full max-w-md rounded-2xl shadow-2xl overflow-hidden', isDark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-gray-200')}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: isDark ? '#3f3f46' : '#f1f5f9' }}>
          <div>
            <p className={cn('font-bold text-base', isDark ? 'text-white' : 'text-gray-900')}>
              {mandatory ? '⭐ Notation obligatoire' : 'Évaluer votre session'}
            </p>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-zinc-400' : 'text-gray-500')}>
              {reservation.studio} — {formatDate(reservation.date)}
            </p>
          </div>
          {!mandatory && (
            <button onClick={onClose} className={cn('w-8 h-8 flex items-center justify-center rounded-lg', isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-100')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">
          {mandatory && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', color: '#fbbf24' }}>
              Veuillez évaluer votre session pour continuer à utiliser votre espace client.
            </div>
          )}

          {/* Étoiles */}
          <div className="flex flex-col items-center gap-2">
            <p className={cn('text-sm font-semibold', isDark ? 'text-zinc-300' : 'text-gray-700')}>Votre note globale</p>
            <StarRating value={stars} onChange={setStars} size={32} />
            <p className={cn('text-xs h-4', isDark ? 'text-zinc-500' : 'text-gray-400')}>
              {stars === 1 ? 'Très insatisfait' : stars === 2 ? 'Insatisfait' : stars === 3 ? 'Correct' : stars === 4 ? 'Satisfait' : stars === 5 ? 'Excellent !' : ''}
            </p>
          </div>

          {/* Commentaire */}
          <div>
            <label className={cn('block text-sm font-semibold mb-1.5', isDark ? 'text-zinc-300' : 'text-gray-700')}>
              Commentaire <span className="text-red-400">*</span>
            </label>
            <textarea
              value={comment}
              onChange={e => { setComment(e.target.value); setError('') }}
              placeholder="Décrivez votre expérience en quelques mots…"
              rows={3}
              className={cn(
                'w-full rounded-xl px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-amber-500/40 resize-none',
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <button
            onClick={submit}
            disabled={stars === 0 || !comment.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40"
            style={{ background: stars > 0 && comment.trim() ? 'linear-gradient(135deg, #d97706, #f59e0b)' : undefined, color: 'white', backgroundColor: stars > 0 && comment.trim() ? undefined : '#52525b' }}
          >
            <Send size={14} />
            Envoyer mon évaluation
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ClientInvoices() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const [reservations, setReservations] = useState([])
  const [search,       setSearch]       = useState('')
  const [ratingTarget, setRatingTarget] = useState(null)   // réservation à noter (modal)
  const [mandatoryPending, setMandatoryPending] = useState(null) // blocage obligatoire

  function load() {
    if (!user) return
    const all = Store.getReservations()
      .filter(r => r.client_email === user.email)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    setReservations(all)

    // Vérifie s'il y a une notation obligatoire en attente
    const pending = all.find(r => isRatable(r) && !r.rating && r.status !== 'annulee')
    setMandatoryPending(pending || null)
  }

  useEffect(() => { load() }, [user])

  function saveRating(id, stars, comment) {
    const r = reservations.find(x => x.id === id)
    if (!r) return
    Store.updateReservation(id, { ...r, rating: stars, rating_comment: comment })
    load()
    setRatingTarget(null)
    setMandatoryPending(null)
  }

  const filtered = reservations.filter(r =>
    !search ||
    (r.studio || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.id || '').toLowerCase().includes(search.toLowerCase())
  )

  const paid = reservations.filter(r => PAID_STATUSES.includes(r.status))
  const totalSpent = paid.reduce((s, r) => s + getPrice(r), 0)
  const totalHours = paid.reduce((s, r) => s + (Number(r.duration) || 0), 0)

  const card       = isDark ? 'bg-zinc-900 border border-zinc-800 rounded-2xl' : 'bg-white border border-gray-200 rounded-2xl shadow-sm'
  const textP      = isDark ? 'text-white' : 'text-gray-900'
  const textS      = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider    = isDark ? 'border-zinc-800' : 'border-gray-100'
  const tableHead  = isDark ? 'text-zinc-400 border-zinc-800 bg-zinc-900/50' : 'text-gray-500 border-gray-100 bg-gray-50'
  const tableRow   = isDark ? 'border-zinc-800 hover:bg-zinc-800/40' : 'border-gray-100 hover:bg-gray-50'
  const inputBg    = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'

  return (
    <ClientLayout title="Réservations">

      {/* Blocage obligatoire */}
      {mandatoryPending && (
        <RatingModal
          reservation={mandatoryPending}
          onClose={null}
          onSave={saveRating}
          isDark={isDark}
          mandatory
        />
      )}

      {/* Modal notation volontaire */}
      {ratingTarget && !mandatoryPending && (
        <RatingModal
          reservation={ratingTarget}
          onClose={() => setRatingTarget(null)}
          onSave={saveRating}
          isDark={isDark}
        />
      )}

      <div className="space-y-4">

        {/* Header */}
        <div>
          <h2 className={`text-2xl font-bold ${textP}`}>Réservations</h2>
          <p className={`text-sm mt-0.5 ${textS}`}>Historique de vos sessions et factures.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`${card} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={17} className="text-green-400" />
              </div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${textS}`}>Total dépensé</p>
            </div>
            <p className={`text-3xl font-black ${textP}`}>
              {totalSpent.toLocaleString('fr-CA')}
              <span className={`text-sm font-medium ml-1.5 ${textS}`}>CAD</span>
            </p>
            <p className={`text-xs mt-1 ${textS}`}>{paid.length} session{paid.length !== 1 ? 's' : ''} facturée{paid.length !== 1 ? 's' : ''}</p>
          </div>
          <div className={`${card} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                <Clock size={17} className="text-violet-400" />
              </div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${textS}`}>Heures facturées</p>
            </div>
            <p className={`text-3xl font-black ${textP}`}>
              {totalHours}
              <span className={`text-base font-medium ml-1 ${textS}`}>h</span>
            </p>
            <p className={`text-xs mt-1 ${textS}`}>toutes sessions confondues</p>
          </div>
          <div className={`${card} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Star size={17} className="text-amber-400" />
              </div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${textS}`}>Note moyenne</p>
            </div>
            {(() => {
              const rated = reservations.filter(r => r.rating)
              const avg = rated.length > 0 ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1) : null
              return (
                <>
                  <p className={`text-3xl font-black ${textP}`}>
                    {avg ?? '—'}
                    {avg && <span className={`text-base font-medium ml-1 ${textS}`}>/ 5</span>}
                  </p>
                  <p className={`text-xs mt-1 ${textS}`}>{rated.length} avis déposé{rated.length !== 1 ? 's' : ''}</p>
                </>
              )
            })()}
          </div>
        </div>

        {/* Table */}
        <div className={`${card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
            <p className={`text-sm font-semibold ${textP}`}>Toutes vos sessions</p>
            <div className="relative">
              <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textS}`} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`pl-8 pr-4 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-violet-500 w-40 ${inputBg}`}
                placeholder="Studio, ID…"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs font-semibold uppercase tracking-wide border-b ${tableHead}`}>
                  <th className="text-left px-5 py-3">Référence</th>
                  <th className="text-left px-5 py-3">Studio</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Date</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Durée</th>
                  <th className="text-left px-5 py-3">Montant</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3">Facture</th>
                  <th className="text-left px-5 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`text-center py-16 ${textS}`}>
                      <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucune réservation</p>
                      <p className="text-xs mt-1 opacity-60">Vos sessions apparaîtront ici</p>
                    </td>
                  </tr>
                ) : filtered.map(r => {
                  const st = STATUS_CONFIG[r.status]
                  const amount = getPrice(r)
                  const canDownload = PAID_STATUSES.includes(r.status)
                  const canRate = isRatable(r) && r.status !== 'annulee'
                  const hasRated = !!r.rating

                  return (
                    <tr key={r.id} className={`border-b ${tableRow}`}>
                      {/* Référence */}
                      <td className="px-5 py-3">
                        <p className={`font-mono text-xs ${textS}`}>#{r.id}</p>
                      </td>

                      {/* Studio */}
                      <td className="px-5 py-3">
                        <p className={`font-semibold text-sm ${textP}`}>{r.studio}</p>
                        <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${getTierConfig(r.service).cls}`}>
                          {getTierConfig(r.service).label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className={`px-5 py-3 hidden sm:table-cell text-sm ${textS}`}>
                        {formatDate(r.date)}
                        <span className="block text-xs opacity-70">{r.start_time} – {r.end_time}</span>
                      </td>

                      {/* Durée */}
                      <td className={`px-5 py-3 hidden md:table-cell text-sm ${textS}`}>{r.duration}h</td>

                      {/* Montant */}
                      <td className="px-5 py-3">
                        {canDownload
                          ? <p className={`font-bold text-sm ${textP}`}>{amount.toLocaleString('fr-CA')} CAD</p>
                          : <p className={`text-sm ${textS}`}>—</p>
                        }
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-3">
                        {st && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                            {st.label_fr}
                          </span>
                        )}
                      </td>

                      {/* Facture */}
                      <td className="px-5 py-3">
                        {canDownload ? (
                          <button
                            onClick={() => {
                              // Génère un PDF factice (placeholder)
                              const content = `FACTURE LEVEL STUDIOS\n\nRéf: #${r.id}\nClient: ${r.client_name || user?.name}\nStudio: ${r.studio}\nDate: ${formatDate(r.date)}\nDurée: ${r.duration}h\nMontant: ${amount.toLocaleString('fr-CA')} CAD\nStatut: ${st?.label_fr || r.status}\n\nMerci de votre confiance.\nLevel Studios`
                              const blob = new Blob([content], { type: 'text/plain' })
                              const url  = URL.createObjectURL(blob)
                              const a    = document.createElement('a')
                              a.href = url
                              a.download = `facture-level-${r.id}.txt`
                              a.click()
                              URL.revokeObjectURL(url)
                            }}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                              isDark
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200'
                            )}
                            title="Télécharger la facture"
                          >
                            <Download size={12} />
                            PDF
                          </button>
                        ) : (
                          <span className={`text-xs ${textS}`}>—</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="px-5 py-3">
                        {hasRated ? (
                          <div className="flex flex-col gap-0.5">
                            <StarRating value={r.rating} size={13} />
                            {r.rating_comment && (
                              <p className={`text-[10px] max-w-[140px] truncate ${textS}`} title={r.rating_comment}>
                                "{r.rating_comment}"
                              </p>
                            )}
                          </div>
                        ) : canRate ? (
                          <button
                            onClick={() => setRatingTarget(r)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30"
                          >
                            <Star size={11} />
                            Évaluer
                          </button>
                        ) : (
                          <span className={`text-xs ${textS}`}>
                            {r.status === 'annulee' ? '—' : 'Dispo J+1'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {paid.length > 0 && (
            <div className={`flex items-center justify-between px-5 py-4 border-t ${divider}`}>
              <span className={`text-sm font-semibold ${textS}`}>
                Total facturé ({paid.length} session{paid.length !== 1 ? 's' : ''})
              </span>
              <span className={`text-base font-black ${textP}`}>
                {totalSpent.toLocaleString('fr-CA')} CAD
              </span>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}
