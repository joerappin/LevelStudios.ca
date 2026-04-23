import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Copy, Search, MessageSquare, TrendingUp, Users } from 'lucide-react'
import Layout from '../../components/Layout'
import { Store } from '../../data/store'
import { useReservations } from '../../hooks/useReservations'
import { ADMIN_NAV } from './Dashboard'
import { useApp } from '../../contexts/AppContext'

const STUDIOS = ['Tous', 'Studio A', 'Studio B', 'Studio C']

export default function AdminSatisfaction() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const { reservations: allRes } = useReservations({ interval: 60000 })
  const [trashedEmails, setTrashedEmails] = useState(new Set())
  const [filterStar, setFilterStar] = useState(0)
  const [filterStudio, setFilterStudio] = useState('Tous')
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'

  useEffect(() => {
    fetch('/api/accounts.php?trash=1').then(r => r.json()).catch(() => [])
      .then(trashed => setTrashedEmails(new Set(trashed.map(a => a.email))))
  }, [])

  const activeRes = allRes.filter(r => !trashedEmails.has(r.client_email))
  const ratedRes = activeRes.filter(r => r.rating)
  const avgRating = ratedRes.length > 0
    ? ratedRes.reduce((s, r) => s + r.rating, 0) / ratedRes.length : 0
  const ratingPct = activeRes.length > 0
    ? Math.round((ratedRes.length / activeRes.length) * 100) : 0

  const rateDist = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: ratedRes.filter(r => r.rating === n).length,
  }))

  const studioStats = ['Studio A', 'Studio B', 'Studio C'].map(studio => {
    const sRes = ratedRes.filter(r => r.studio === studio)
    const avg = sRes.length > 0 ? sRes.reduce((s, r) => s + r.rating, 0) / sRes.length : 0
    return { studio, count: sRes.length, avg }
  })

  const filteredReviews = [...ratedRes]
    .filter(r => filterStar === 0 || r.rating === filterStar)
    .filter(r => filterStudio === 'Tous' || r.studio === filterStudio)
    .filter(r => !search ||
      r.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.rating_comment?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/reservation`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Satisfaction client">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${textPrimary}`}>Satisfaction client</h2>
            <p className={`text-sm mt-1 ${textSecondary}`}>
              {ratedRes.length} avis collectés · taux de réponse {ratingPct}%
            </p>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`border rounded-2xl p-6 flex flex-col items-center gap-2 col-span-2 lg:col-span-1 ${card}`}>
            <p className={`text-6xl font-black ${textPrimary}`}>
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={20} className={
                  n <= Math.round(avgRating)
                    ? 'text-amber-400 fill-amber-400'
                    : isDark ? 'text-zinc-700 fill-zinc-700' : 'text-gray-200 fill-gray-200'
                } />
              ))}
            </div>
            <p className={`text-xs ${textSecondary}`}>Note moyenne / 5</p>
          </div>

          {studioStats.map(s => (
            <div key={s.studio} className={`border rounded-2xl p-4 flex flex-col items-center justify-center gap-1 ${card}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>{s.studio}</p>
              <p className={`text-3xl font-black ${textPrimary}`}>{s.avg > 0 ? s.avg.toFixed(1) : '—'}</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={10} className={
                    n <= Math.round(s.avg)
                      ? 'text-amber-400 fill-amber-400'
                      : isDark ? 'text-zinc-700 fill-zinc-700' : 'text-gray-200 fill-gray-200'
                  } />
                ))}
              </div>
              <p className={`text-[10px] ${textSecondary}`}>{s.count} avis</p>
            </div>
          ))}
        </div>

        {/* Distribution + collect */}
        <div className="grid lg:grid-cols-2 gap-6">

          <div className={`border rounded-2xl p-6 ${card}`}>
            <h3 className={`font-bold mb-4 ${textPrimary}`}>Distribution des notes</h3>
            <div className="space-y-2.5">
              {rateDist.map(({ star, count }) => {
                const pct = ratedRes.length > 0 ? Math.round((count / ratedRes.length) * 100) : 0
                return (
                  <button key={star}
                    onClick={() => setFilterStar(filterStar === star ? 0 : star)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 transition-all text-left ${
                      filterStar === star
                        ? isDark ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
                        : isDark ? 'hover:bg-zinc-800 border border-transparent' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-0.5 w-24 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={12} className={
                          n <= star
                            ? 'text-amber-400 fill-amber-400'
                            : isDark ? 'text-zinc-700 fill-zinc-700' : 'text-gray-200 fill-gray-200'
                        } />
                      ))}
                    </div>
                    <div className={`flex-1 h-2.5 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                      <div className="h-2.5 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-sm font-semibold w-7 text-right flex-shrink-0 ${textPrimary}`}>{count}</span>
                    <span className={`text-xs w-9 text-right flex-shrink-0 ${textSecondary}`}>{pct}%</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className={`border rounded-2xl p-6 ${card}`}>
            <h3 className={`font-bold mb-1 ${textPrimary}`}>Recueillir des avis</h3>
            <p className={`text-sm mb-4 ${textSecondary}`}>
              Partagez le lien de réservation pour collecter de nouveaux avis après chaque session.
            </p>
            <div className={`flex items-center gap-2 rounded-xl p-3 mb-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
              <span className={`text-xs flex-1 truncate font-mono ${textSecondary}`}>
                {window.location.origin}/reservation
              </span>
              <button onClick={copyLink}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                  copied
                    ? 'bg-green-500/20 text-green-400'
                    : isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Copy size={12} />
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <div className={`rounded-xl p-4 border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs font-semibold mb-2 ${textSecondary}`}>Comment ça fonctionne</p>
              <ul className={`text-xs space-y-1.5 ${textSecondary}`}>
                <li>• Les avis sont collectés automatiquement après chaque session</li>
                <li>• Le client note de 1 à 5 étoiles et peut laisser un commentaire</li>
                <li>• Les avis sont liés à la réservation et au studio concerné</li>
                <li>• Tous les avis apparaissent dans la liste ci-dessous en temps réel</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews list */}
        <div className={`border rounded-2xl p-6 ${card}`}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h3 className={`font-bold ${textPrimary}`}>Tous les avis</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>
                {filteredReviews.length}
              </span>
              {filterStar > 0 && (
                <button onClick={() => setFilterStar(0)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all"
                >
                  {filterStar}★ ×
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1">
                {STUDIOS.map(s => (
                  <button key={s} onClick={() => setFilterStudio(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      filterStudio === s
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent' : 'bg-gray-100 text-gray-500 hover:text-gray-700 border border-transparent'
                    }`}
                  >{s}</button>
                ))}
              </div>
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                <Search size={12} className={textSecondary} />
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`bg-transparent text-xs outline-none w-32 ${textPrimary}`}
                />
              </div>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 gap-3 ${textSecondary}`}>
              <Star className="w-10 h-10 opacity-20" />
              <p className="text-sm">Aucun avis pour ces critères</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map(r => (
                <div key={r.id}
                  className={`rounded-xl p-4 border transition-all ${
                    isDark ? 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 text-sm font-bold">
                          {(r.client_name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${textPrimary}`}>{r.client_name}</p>
                        <p className={`text-xs ${textSecondary}`}>{r.studio} · {r.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={14} className={
                          n <= r.rating
                            ? 'text-amber-400 fill-amber-400'
                            : isDark ? 'text-zinc-700 fill-zinc-700' : 'text-gray-200 fill-gray-200'
                        } />
                      ))}
                    </div>
                  </div>
                  {r.rating_comment && (
                    <p className={`text-sm mt-3 leading-relaxed ${textSecondary}`}>
                      "{r.rating_comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
