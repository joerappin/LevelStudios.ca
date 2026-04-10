import React, { useState, useEffect } from 'react'
import { Check, Star, Zap, Camera, Video, Image, Radio, Users, MessageCircle, TrendingUp } from 'lucide-react'
import ClientLayout from '../../components/ClientLayout'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { translations } from '../../i18n/translations'

function buildPacks() {
  const p = Store.getPrices()
  const a = p.services.find(s => s.id === 'ARGENT')?.price ?? 221
  const g = p.services.find(s => s.id === 'GOLD')?.price ?? 587
  const round = v => Math.round(v)
  return {
    ARGENT_PACKS: [
      { hours: 1,  pricePerHour: a,             total: a * 1,              discount: null },
      { hours: 4,  pricePerHour: round(a * 0.9), total: round(a * 0.9) * 4,  discount: 10 },
      { hours: 10, pricePerHour: round(a * 0.85),total: round(a * 0.85) * 10, discount: 15, popular: true },
      { hours: 20, pricePerHour: round(a * 0.8), total: round(a * 0.8) * 20,  discount: 20 },
    ],
    GOLD_PACKS: [
      { hours: 1,  pricePerHour: g,             total: g * 1,              discount: null },
      { hours: 4,  pricePerHour: round(g * 0.9), total: round(g * 0.9) * 4,  discount: 10 },
      { hours: 10, pricePerHour: round(g * 0.85),total: round(g * 0.85) * 10, discount: 15, popular: true },
      { hours: 20, pricePerHour: round(g * 0.8), total: round(g * 0.8) * 20,  discount: 20 },
    ],
    argentBase: a,
    goldBase: g,
  }
}

function buildOptions() {
  const p = Store.getPrices()
  const priceOf = (id, fb) => p.options.find(o => o.id === id)?.price ?? fb
  return {
    OPTIONS_BASE: [
      { key: 'option_photo',     icon: Camera,     price: priceOf('Photo', 44),             label_fr: 'Photo',             label_en: 'Photo' },
      { key: 'option_short',     icon: Video,      price: priceOf('Short', 44),             label_fr: 'Short vidéo',       label_en: 'Short video' },
      { key: 'option_thumbnail', icon: Image,      price: priceOf('Miniature', 44),         label_fr: 'Miniature',         label_en: 'Thumbnail' },
    ],
    OPTIONS_LIVE: [
      { key: 'option_live',     icon: Radio,       price: priceOf('Live', 662),             label_fr: 'Live stream',       label_en: 'Live stream' },
      { key: 'option_briefing', icon: Zap,         price: priceOf('BriefingLive', 118),     label_fr: 'Briefing live',     label_en: 'Live briefing' },
      { key: 'option_replay',   icon: Video,       price: priceOf('Replay', 74),            label_fr: 'Replay',            label_en: 'Replay' },
    ],
    OPTIONS_ACCOM: [
      { key: 'option_cm',       icon: Users,       price: priceOf('CommunityManager', 147), label_fr: 'Community manager', label_en: 'Community manager' },
      { key: 'option_coaching', icon: TrendingUp,  price: priceOf('Coaching', 588),         label_fr: 'Coaching',          label_en: 'Coaching' },
    ],
  }
}

export default function ClientSubscription() {
  const { user } = useAuth()
  const { theme, lang } = useApp()
  const t = (k) => translations[lang]?.[k] || k
  const isDark = theme === 'dark'

  const { ARGENT_PACKS, GOLD_PACKS, argentBase, goldBase } = buildPacks()
  const { OPTIONS_BASE, OPTIONS_LIVE, OPTIONS_ACCOM } = buildOptions()

  const [packs, setPacks] = useState([])
  const [allPacks, setAllPacks] = useState([])
  const [buySuccess, setBuySuccess] = useState(null)

  useEffect(() => {
    if (!user) return
    const all = Store.getHourPacks().filter(p => p.client_email === user.email)
    setAllPacks(all)
    setPacks(all.filter(p => p.hours_used < p.hours_total))
  }, [user])

  const handleBuyPack = (tier, pack) => {
    const name = `${tier} — Pack ${pack.hours}h`
    Store.addHourPack({
      client_email: user.email,
      client_name: user.name,
      name,
      tier,
      hours_total: pack.hours,
      hours_used: 0,
      price_cad: pack.total,
      price_per_hour: pack.pricePerHour,
    })
    const all = Store.getHourPacks().filter(p => p.client_email === user.email)
    setAllPacks(all)
    setPacks(all.filter(p => p.hours_used < p.hours_total))
    setBuySuccess(name)
    setTimeout(() => setBuySuccess(null), 3000)
  }

  const totalHours = packs.reduce((s, p) => s + (p.hours_total - p.hours_used), 0)

  const card = isDark
    ? 'bg-zinc-900 border border-zinc-800 rounded-2xl'
    : 'bg-white border border-gray-200 rounded-2xl shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'

  const PackCard = ({ tier, pack, color }) => {
    const isGold = tier === 'GOLD'
    const accent = isGold ? 'from-yellow-500 to-amber-500' : 'from-zinc-400 to-zinc-300'
    return (
      <div className={`relative ${card} p-5 flex flex-col gap-3 ${pack.popular ? (isDark ? 'ring-2 ring-violet-500/60' : 'ring-2 ring-violet-500/40') : ''}`}>
        {pack.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              ⭐ Populaire
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-sm font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
            <Star size={14} className={isGold ? 'text-yellow-500' : 'text-zinc-400'} />
            Pack {pack.hours}h
          </div>
          {pack.discount && (
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              -{pack.discount}%
            </span>
          )}
        </div>
        <div>
          <p className={`text-2xl font-black ${textPrimary}`}>
            {pack.total.toLocaleString('fr-CA')} <span className="text-sm font-semibold text-violet-500">CAD</span>
          </p>
          <p className={`text-xs ${textSecondary} mt-0.5`}>
            {pack.pricePerHour} CAD{t('per_hour')}
          </p>
        </div>
        <ul className="space-y-1.5 text-xs">
          <li className={`flex items-center gap-2 ${textSecondary}`}>
            <Check size={12} className="text-violet-500 flex-shrink-0" />
            {pack.hours} heure{pack.hours > 1 ? 's' : ''} de studio
          </li>
          <li className={`flex items-center gap-2 ${textSecondary}`}>
            <Check size={12} className="text-violet-500 flex-shrink-0" />
            {t('no_expiry')}
          </li>
          {pack.discount && (
            <li className={`flex items-center gap-2 ${textSecondary}`}>
              <Check size={12} className="text-green-500 flex-shrink-0" />
              Économie {pack.discount}% vs tarif horaire
            </li>
          )}
        </ul>
        <button
          onClick={() => handleBuyPack(tier, pack)}
          className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            pack.popular
              ? 'bg-violet-600 hover:bg-violet-700 text-white'
              : isDark
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          {t('buy_pack')}
        </button>
      </div>
    )
  }

  const OptionRow = ({ option }) => (
    <div className={`flex items-center justify-between py-3 border-b ${divider} last:border-0`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
          <option.icon size={14} className="text-violet-500" />
        </div>
        <span className={`text-sm font-medium ${textPrimary}`}>
          {lang === 'fr' ? option.label_fr : option.label_en}
        </span>
      </div>
      <span className={`text-sm font-bold ${textPrimary}`}>
        {option.price} <span className="text-xs text-violet-500 font-semibold">CAD</span>
      </span>
    </div>
  )

  return (
    <ClientLayout title={t('subscription')}>
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${textPrimary}`}>{t('subscription')}</h2>

        {/* Success toast */}
        {buySuccess && (
          <div className="fixed top-20 right-4 z-50 max-w-sm w-full">
            <div className="bg-green-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3">
              <Check size={18} className="flex-shrink-0" />
              <p className="text-sm font-semibold">{buySuccess} acheté avec succès !</p>
            </div>
          </div>
        )}

        {/* Section 1 — Utilisation */}
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base font-bold ${textPrimary}`}>{t('usage')}</h3>
            <button className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              {t('buy_credits')}
            </button>
          </div>

          {packs.length === 0 ? (
            <div className={`text-center py-8 ${textSecondary}`}>
              <p className="text-sm">{t('no_active_sub')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {packs.map(pack => {
                const used = pack.hours_used
                const total = pack.hours_total
                const pct = Math.round((used / total) * 100)
                return (
                  <div key={pack.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${textPrimary}`}>{pack.name}</span>
                      <span className={`text-xs ${textSecondary}`}>{used}h / {total}h utilisées</span>
                    </div>
                    <div className={`w-full h-2.5 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-xs ${textSecondary}`}>{total - used}h restantes</span>
                      <span className={`text-xs font-semibold ${pct > 80 ? 'text-violet-500' : textSecondary}`}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
              <div className={`pt-3 border-t ${divider} flex items-center justify-between`}>
                <span className={`text-sm font-semibold ${textSecondary}`}>Total disponible</span>
                <span className="text-lg font-black text-violet-500">{totalHours}h</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2 — Offres ARGENT */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center">
              <Star size={14} className="text-white" />
            </div>
            <h3 className={`text-base font-bold ${textPrimary}`}>{t('argent_offer')}</h3>
            <span className={`text-xs ${textSecondary}`}>À partir de {argentBase} CAD/h</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ARGENT_PACKS.map((pack, i) => (
              <PackCard key={i} tier="ARGENT" pack={pack} />
            ))}
          </div>
        </div>

        {/* Section 2 — Offres GOLD */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Star size={14} className="text-white" />
            </div>
            <h3 className={`text-base font-bold ${textPrimary}`}>{t('gold_offer')}</h3>
            <span className={`text-xs ${textSecondary}`}>À partir de {goldBase} CAD/h</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GOLD_PACKS.map((pack, i) => (
              <PackCard key={i} tier="GOLD" pack={pack} />
            ))}
          </div>
        </div>

        {/* Section 3 — Options supplémentaires */}
        <div>
          <h3 className={`text-base font-bold ${textPrimary} mb-3`}>{t('options_title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Options de base */}
            <div className={`${card} p-4`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 text-violet-500`}>Options de base</p>
              {OPTIONS_BASE.map((opt, i) => <OptionRow key={i} option={opt} />)}
            </div>
            {/* Options Live */}
            <div className={`${card} p-4`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 text-violet-500`}>Option Live</p>
              {OPTIONS_LIVE.map((opt, i) => <OptionRow key={i} option={opt} />)}
            </div>
            {/* Accompagnement */}
            <div className={`${card} p-4`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 text-violet-500`}>Accompagnement</p>
              {OPTIONS_ACCOM.map((opt, i) => <OptionRow key={i} option={opt} />)}
            </div>
          </div>
        </div>

        {/* Section 4 — Facturation */}
        <div className={`${card} overflow-hidden`}>
          <div className={`px-5 py-4 border-b ${divider}`}>
            <h3 className={`text-base font-bold ${textPrimary}`}>{t('billing')}</h3>
          </div>
          {allPacks.length === 0 ? (
            <div className={`text-center py-12 ${textSecondary}`}>
              <p className="text-sm">Aucun achat effectué pour le moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {allPacks.map(pack => (
                <div key={pack.id} className={`flex items-center justify-between px-5 py-4 ${isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'} transition-colors`}>
                  <div>
                    <p className={`font-semibold text-sm ${textPrimary}`}>{pack.name}</p>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      {formatDate(pack.created_at)} · {pack.hours_used}/{pack.hours_total}h utilisées
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${textPrimary}`}>{pack.price_cad?.toLocaleString('fr-CA')} CAD</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      pack.hours_used < pack.hours_total
                        ? 'bg-green-100 text-green-700'
                        : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {pack.hours_used < pack.hours_total ? 'Actif' : 'Expiré'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}
