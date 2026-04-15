import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Users, MapPin, CheckCircle, ChevronLeft, ChevronRight, LogOut, Tag, X } from 'lucide-react'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { formatPrice, cn } from '../utils'
import { translations } from '../i18n/translations'
import { sendWelcomeEmail } from '../utils/emailService'

const STEPS = ['Studio', 'Choix', 'Service', 'Date & Heure', 'Options', 'Confirmation']

const DURATIONS = [
  { value: 1, label: '1h' },
  { value: 2, label: '2h' },
  { value: 3, label: '3h' },
  { value: 4, label: '4h' },
  { value: 8, label: 'Journée', sub: '8h' },
]

const STUDIOS = [
  { id: 'Studio A', name: 'Studio A', desc: 'Élégant & chaleureux · décor salon moderne · lumineux', capacity: 4, address: '123 Rue Saint-Laurent', city: 'Montréal', img: '/studios/studio-a.jpg' },
  { id: 'Studio B', name: 'Studio B', desc: 'Sombre & sophistiqué · ambiance premium · fauteuils velours', capacity: 4, address: '123 Rue Saint-Laurent', city: 'Montréal', img: '/studios/studio-b.jpg' },
  { id: 'Studio C', name: 'Studio C', desc: 'Tech & moderne · éclairage néon · table conférence', capacity: 6, address: '456 Ave du Mont-Royal', city: 'Montréal', img: '/studios/studio-c.png' },
]

// ─── Prices are read from Store (admin-configurable, persists across builds) ─
function buildServices() {
  const p = Store.getPrices()
  const priceOf = (id, fallback) => p.services.find(s => s.id === id)?.price ?? fallback
  return [
  {
    id: 'ARGENT', name: 'ARGENT', price: priceOf('ARGENT', 221), badge: 'ARGENT',
    features: [
      'Opérateur sur place',
      "Jusqu'à 4 caméras 4K",
      "Jusqu'à 4 microphones",
      'Pré-montage',
      'Synchronisation audio vidéo',
      'Choix du décor et de l\'ambiance',
      'Envoi fichiers bruts audio et vidéo instantané après la fin du tournage',
      'Envoi fichier mix audio instantané après la fin du tournage',
      'Sauvegarde des fichiers pendant 7 jours',
    ],
  },
  {
    id: 'GOLD', name: 'GOLD', price: priceOf('GOLD', 587), badge: 'GOLD',
    features: [
      'Formule Argent (tournage, livraison rushes instantanées, synchro audio)',
      'Introduction dynamique',
      'Motion design',
      'Sound design',
      'Sound effect',
      '1 révision incluse',
      'Sauvegarde des fichiers pendant 2 mois',
    ],
  },
  ]
}

function buildAdditionalGroups() {
  const p = Store.getPrices()
  const priceOf = (id, fallback) => p.options.find(o => o.id === id)?.price ?? fallback
  return [
    { group: 'Base',           items: [{ id: 'Photo', name: 'Photo', price: priceOf('Photo', 44) }, { id: 'Short', name: 'Short vidéo', price: priceOf('Short', 44) }, { id: 'Miniature', name: 'Miniature', price: priceOf('Miniature', 44) }] },
    { group: 'Live',           items: [{ id: 'Live', name: 'Live stream', price: priceOf('Live', 662) }, { id: 'BriefingLive', name: 'Briefing live (obligatoire)', price: priceOf('BriefingLive', 118) }, { id: 'Replay', name: 'Replay', price: priceOf('Replay', 74) }] },
    { group: 'Accompagnement', items: [{ id: 'CommunityManager', name: 'Community manager', price: priceOf('CommunityManager', 147) }, { id: 'Coaching', name: 'Coaching', price: priceOf('Coaching', 588) }] },
  ]
}

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
const MONTH_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getCalendarDays(year, month) {
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array(firstDay).fill(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
}

export default function NewReservation() {
  const navigate = useNavigate()
  const { user, logout, login, register } = useAuth()
  const { theme, lang, toggleLang } = useApp()
  const isDark = theme === 'dark'
  const t = (k) => translations[lang]?.[k] || k

  // Read prices from Store (admin-configurable)
  const SERVICES          = buildServices()
  const ADDITIONAL_GROUPS = buildAdditionalGroups()

  const [step, setStep]     = useState(1)
  const [done, setDone]     = useState(false)
  const [promoResult, setPromoResult] = useState(null)
  const [promoError, setPromoError]   = useState('')
  const [quickRegisterOpen, setQuickRegisterOpen] = useState(false)
  const [quickLoginOpen, setQuickLoginOpen] = useState(false)
  const [quickRegisterForm, setQuickRegisterForm] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', company: '', tps: '', tvq: '', cgu: false })
  const [quickLoginForm, setQuickLoginForm] = useState({ email: '', password: '' })
  const [quickRegisterError, setQuickRegisterError] = useState('')
  const [quickLoginError, setQuickLoginError] = useState('')

  // ── Google Sign-In ──────────────────────────────────────────────────────
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  const googleBtnRef = useRef(null)

  const handleGoogleCredential = (response) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      const { given_name, family_name, email, name } = payload
      const firstName = given_name || name?.split(' ')[0] || ''
      const lastName  = family_name || name?.split(' ').slice(1).join(' ') || ''
      const result = register({ firstName, lastName, email, password: `google_${Date.now()}`, googleAuth: true, clientType: 'particulier' })
      if (result.success) {
        setQuickRegisterOpen(false); setQuickLoginOpen(false)
        sendWelcomeEmail({ firstName, lastName, email, clientType: 'particulier' })
      }
    } catch {}
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.google?.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential, auto_select: false })
    }
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, [GOOGLE_CLIENT_ID])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || (!quickRegisterOpen && !quickLoginOpen)) return
    const timer = setTimeout(() => {
      if (googleBtnRef.current && window.google?.accounts.id) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 400,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
        })
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [quickRegisterOpen, quickLoginOpen, GOOGLE_CLIENT_ID, isDark])
  // ───────────────────────────────────────────────────────────────────────

  const [calView, setCalView] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })
  const INITIAL_FORM = { persons: 1, duration: 1, service: '', date: '', start_time: '', studio: '', additional_services: [], promo_code: '', name: user?.name || '', email: user?.email || '', phone: '' }
  const [form, setForm] = useState(INITIAL_FORM)

  const studio  = STUDIOS.find(s => s.id === form.studio)
  const service = SERVICES.find(s => s.id === form.service)
  const basePrice       = (service?.price ?? 0) * form.duration
  const additionalPrice = form.additional_services.reduce((sum, id) => {
    for (const g of ADDITIONAL_GROUPS) {
      const item = g.items.find(i => i.id === id)
      if (item) return sum + item.price
    }
    return sum
  }, 0)
  let totalPrice = basePrice + additionalPrice
  if (promoResult) {
    totalPrice = promoResult.type === 'percentage'
      ? totalPrice * (1 - promoResult.value / 100)
      : Math.max(0, totalPrice - promoResult.value)
  }
  const tps  = totalPrice * 0.05
  const tvq  = totalPrice * 0.09975
  const totalTTC = totalPrice + tps + tvq

  const endTime = () => {
    if (!form.start_time) return ''
    const h = parseInt(form.start_time)
    return `${String(h + form.duration).padStart(2, '0')}:00`
  }

  const canNext = () => {
    if (step === 1) return !!form.studio
    if (step === 2) return true
    if (step === 3) return !!form.service
    if (step === 4) return !!(form.date && form.start_time)
    if (step === 5) return true
    if (step === 6) return !!user
    return false
  }

  const handleSubmit = () => {
    Store.addReservation({
      client_email: user?.email || form.email, client_name: user?.name || form.name,
      client_id: user?.id || 'GUEST',
      studio: form.studio, service: form.service,
      price: Math.round(totalPrice * 100) / 100,
      date: form.date, start_time: form.start_time, end_time: endTime(),
      duration: form.duration, persons: form.persons,
      status: 'a_payer',
      additional_services: form.additional_services,
      promo_code: promoResult ? form.promo_code : null,
    })
    setDone(true)
  }

  const checkPromo = () => {
    setPromoError('')
    const result = Store.validatePromoCode(form.promo_code.toUpperCase())
    if (result) setPromoResult(result)
    else { setPromoError('Code promo invalide ou expiré'); setPromoResult(null) }
  }

  const toggleAdditional = (id) => setForm(f => ({
    ...f,
    additional_services: f.additional_services.includes(id)
      ? f.additional_services.filter(a => a !== id)
      : [...f.additional_services, id],
  }))

  const calDays = useMemo(() => getCalendarDays(calView.year, calView.month), [calView])
  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0)

  // ─── Done screen ───────────────────────────────────────────────────────
  if (done) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center p-4', isDark ? 'bg-zinc-950' : 'bg-gray-50')}>
        <div className={cn('max-w-md w-full rounded-2xl p-8 text-center', isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200 shadow-xl')}>
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className={cn('text-2xl font-black mb-2', isDark ? 'text-white' : 'text-gray-900')}>Réservation validée !</h2>
          <p className={cn('text-sm mb-6', isDark ? 'text-zinc-400' : 'text-gray-500')}>Votre réservation est enregistrée et en attente de paiement. Notre équipe vous contactera sous 24h.</p>
          <div className={cn('rounded-xl p-5 mb-6 text-left space-y-2.5 text-sm', isDark ? 'bg-zinc-800' : 'bg-gray-50')}>
            {[
              ['Studio', form.studio],
              ['Formule', service?.name],
              ['Date', form.date ? new Date(form.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''],
              ['Horaire', form.start_time && `${form.start_time} – ${endTime()}`],
              ['Total', formatPrice(totalTTC)],
            ].map(([k, v]) => v && (
              <div key={k} className="flex justify-between">
                <span className={isDark ? 'text-zinc-400' : 'text-gray-500'}>{k}</span>
                <span className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className={cn('flex-1 py-3 rounded-xl font-semibold text-sm border transition-colors', isDark ? 'border-zinc-700 text-white hover:bg-zinc-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}>
              Accueil
            </button>
            {user && (
              <button onClick={() => navigate('/clienttest/reservations')} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                Mes réservations
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Summary card ──────────────────────────────────────────────────────
  const SummaryCard = () => (
    <div className={cn('rounded-2xl overflow-hidden border', isDark ? 'border-zinc-800' : 'border-gray-200')}>
      {/* Studio image header */}
      <div className="h-44 relative overflow-hidden bg-zinc-900">
        {studio ? (
          <img
            src={studio.img}
            alt={studio.name}
            className="absolute inset-0 w-full h-full object-cover scale-110 transition-all duration-700"
            style={{ objectPosition: 'center' }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute bottom-4 left-4 right-4">
          {studio ? (
            <>
              <div className="text-white font-bold text-lg leading-tight">{studio.name}</div>
              <div className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{studio.address}
              </div>
            </>
          ) : (
            <div className="text-white/40 text-sm italic">Aucun studio sélectionné</div>
          )}
        </div>
      </div>

      {/* Summary details */}
      <div className={cn('p-5 space-y-3', isDark ? 'bg-zinc-900' : 'bg-white')}>
        <h3 className={cn('font-bold text-sm uppercase tracking-wide mb-4', isDark ? 'text-zinc-400' : 'text-gray-400')}>Votre réservation</h3>

        {[
          { label: 'Personnes', value: form.persons ? `${form.persons} personne${form.persons > 1 ? 's' : ''}` : null },
          { label: 'Durée',     value: form.duration ? `${form.duration}h` : null },
          { label: 'Formule',   value: service?.name },
          { label: 'Date',      value: form.date ? new Date(form.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : null },
          { label: 'Heure',     value: form.start_time ? `${form.start_time} – ${endTime()}` : null },
          { label: 'Studio',    value: studio?.name },
          { label: 'Adresse',   value: studio?.address },
        ].map(({ label, value }) => value && (
          <div key={label} className="flex justify-between text-sm">
            <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>{label}</span>
            <span className={cn('font-medium text-right', isDark ? 'text-zinc-200' : 'text-gray-700')}>{value}</span>
          </div>
        ))}

        {form.additional_services.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>Options</span>
            <span className={cn('font-medium text-right', isDark ? 'text-zinc-200' : 'text-gray-700')}>{form.additional_services.length} ajoutée{form.additional_services.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {promoResult && (
          <div className="flex justify-between text-sm">
            <span className="text-green-500">Promo</span>
            <span className="text-green-400 font-medium">-{promoResult.type === 'percentage' ? `${promoResult.value}%` : `${promoResult.value} CAD`}</span>
          </div>
        )}

        <div className={cn('border-t pt-3 mt-2 space-y-1.5', isDark ? 'border-zinc-800' : 'border-gray-100')}>
          <div className="flex justify-between text-xs font-bold">
            <span className={isDark ? 'text-zinc-300' : 'text-gray-700'}>Sous-total</span>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>TPS (5%)</span>
            <span className={isDark ? 'text-zinc-300' : 'text-gray-600'}>{formatPrice(tps)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>TVQ (9,975%)</span>
            <span className={isDark ? 'text-zinc-300' : 'text-gray-600'}>{formatPrice(tvq)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-1.5 border-t" style={{ borderColor: isDark ? '#27272a' : '#f3f4f6' }}>
            <span className={cn('text-sm font-semibold', isDark ? 'text-zinc-400' : 'text-gray-500')}>Total</span>
            <span className={cn('text-xl font-black', isDark ? 'text-white' : 'text-gray-900')}>{formatPrice(totalTTC)}</span>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── Main render ───────────────────────────────────────────────────────
  return (
    <div className={cn('min-h-screen', isDark ? 'bg-zinc-950' : 'bg-gray-50')}>

      {/* Top bar */}
      <header className={cn('h-16 border-b px-4 sm:px-6 flex items-center justify-between', isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200')}>
        {/* Left — Créer son compte (si non connecté) */}
        <div className="flex items-center gap-3 w-1/3">
          {!user && (
            <button onClick={() => { setQuickRegisterOpen(true); setQuickRegisterError('') }}
              className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors', isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
              Créer son compte
            </button>
          )}
        </div>

        {/* Center — Level Studios (reset + retour accueil) */}
        <button onClick={() => { setStep(1); setForm(INITIAL_FORM); setPromoResult(null); setPromoError(''); navigate('/') }}
          className="flex items-center gap-2 hover:opacity-75 transition-opacity">
          <img src="/logo.png" className="w-14 h-14 object-contain" alt="Level Studios" style={{ filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
          <span className={cn('font-bold text-sm hidden sm:block', isDark ? 'text-white' : 'text-gray-900')}>Level Studios</span>
        </button>

        {/* Right */}
        <div className="flex items-center gap-2 w-1/3 justify-end">
          <button onClick={toggleLang} className={cn('text-sm font-medium px-2 py-1 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')}>
            {lang === 'fr' ? '🇫🇷' : '🇬🇧'}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <span className={cn('text-xs hidden sm:block', isDark ? 'text-zinc-400' : 'text-gray-500')}>{user.email}</span>
              <button onClick={() => { logout(); navigate('/') }} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-gray-700')}>
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setQuickLoginOpen(true); setQuickLoginError('') }} className={cn('text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors', isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
              Se connecter
            </button>
          )}
        </div>
      </header>

      {/* Step indicator */}
      <div className={cn('border-b px-4 sm:px-6', isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200')}>
        <div className="max-w-5xl mx-auto flex">
          {STEPS.map((s, i) => (
            <div key={s} className={cn('flex-1 py-3.5 text-center text-xs font-semibold border-b-2 transition-colors',
              i + 1 === step ? 'border-violet-600 text-violet-500'
              : i + 1 < step  ? (isDark ? 'border-zinc-600 text-zinc-400' : 'border-gray-300 text-gray-400')
              : (isDark ? 'border-transparent text-zinc-600' : 'border-transparent text-gray-300')
            )}>
              {i + 1 < step ? <Check className="w-3.5 h-3.5 inline mr-1" /> : null}{s}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex gap-8 items-start">

        {/* Left: form */}
        <div className="flex-1 min-w-0">

          {/* Step 1 — Studio */}
          {step === 1 && (
            <div>
              <p className={cn('text-sm mb-6', isDark ? 'text-zinc-400' : 'text-gray-500')}>
                Sélectionnez votre studio.
              </p>
              <div className={cn('flex gap-2 mb-5 text-xs font-medium')}>
                <div className={cn('px-3 py-1.5 rounded-full', isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600')}>Montréal</div>
              </div>
              <div className="space-y-3">
                {STUDIOS.map(s => {
                  const isSelected = form.studio === s.id
                  const isDimmed = form.studio && !isSelected
                  return (
                    <button key={s.id} onClick={() => { setForm(f => ({ ...f, studio: s.id, persons: f.persons > s.capacity ? s.capacity : f.persons })); setTimeout(() => setStep(2), 280) }}
                      className={cn('w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-300',
                        isSelected
                          ? 'border-violet-600 shadow-lg shadow-violet-900/20'
                          : isDimmed
                            ? (isDark ? 'border-zinc-800 opacity-40 hover:opacity-70' : 'border-gray-200 opacity-40 hover:opacity-70')
                            : isDark ? 'border-zinc-800 hover:border-zinc-600' : 'border-gray-200 hover:border-violet-300'
                      )}>
                      <div className="flex">
                        <div className="w-28 h-20 flex-shrink-0 overflow-hidden">
                          <img src={s.img} alt={s.name} className={cn('w-full h-full object-cover transition-transform duration-300', isSelected ? 'scale-105' : 'scale-100')} />
                        </div>
                        <div className={cn('flex-1 p-4 flex items-center justify-between', isDark ? 'bg-zinc-900' : 'bg-white')}>
                          <div>
                            <div className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>{s.name}</div>
                            <div className={cn('text-xs mt-0.5', isDark ? 'text-zinc-400' : 'text-gray-500')}>{s.desc}</div>
                            <div className={cn('flex items-center gap-3 mt-2 text-xs', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.capacity} pers. max</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.city}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2 — Choix */}
          {step === 2 && (
            <div>
              <p className={cn('text-sm mb-6', isDark ? 'text-zinc-400' : 'text-gray-500')}>
                Sélectionnez votre configuration.
              </p>

              <div className="mb-8">
                <h3 className={cn('font-semibold text-sm mb-3', isDark ? 'text-zinc-300' : 'text-gray-700')}>Nombre de personnes face caméras</h3>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6].map(n => {
                    const maxPersons = studio?.capacity ?? 6
                    const disabled = n > maxPersons
                    return (
                      <button key={n}
                        disabled={disabled}
                        onClick={() => setForm(f => ({ ...f, persons: n }))}
                        className={cn('w-14 h-14 rounded-xl font-bold text-lg border-2 transition-all',
                          disabled
                            ? isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                            : form.persons === n
                              ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/30'
                              : isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-violet-500/50' : 'bg-white border-gray-200 text-gray-700 hover:border-violet-400'
                        )}>
                        {n}
                      </button>
                    )
                  })}
                </div>
                {studio && (
                  <p className={cn('text-xs mt-2', isDark ? 'text-zinc-600' : 'text-gray-400')}>
                    Capacité max du {studio.name} : {studio.capacity} personnes
                  </p>
                )}
              </div>

              <div className="mb-8">
                <h3 className={cn('font-semibold text-sm mb-3', isDark ? 'text-zinc-300' : 'text-gray-700')}>Durée</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DURATIONS.map((d, i) => (
                    <button key={i} onClick={() => setForm(f => ({ ...f, duration: d.value }))}
                      className={cn('py-3 px-2 rounded-xl border-2 text-center transition-all',
                        form.duration === d.value
                          ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/30'
                          : isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-violet-500/50' : 'bg-white border-gray-200 text-gray-700 hover:border-violet-400'
                      )}>
                      <div className="font-bold text-sm">{d.label}</div>
                      {d.sub && <div className="text-xs opacity-70">{d.sub}</div>}
                    </button>
                  ))}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setForm(f => ({ ...f, duration: Math.min(f.duration + 1, 12) }))}
                      className={cn('flex-1 rounded-xl border-2 text-center transition-all font-bold text-base',
                        isDark ? 'bg-zinc-900 border-zinc-700 text-violet-400 hover:border-violet-500 hover:bg-zinc-800' : 'bg-white border-gray-200 text-violet-600 hover:border-violet-400'
                      )}>
                      +
                    </button>
                    <button
                      onClick={() => setForm(f => ({ ...f, duration: Math.max(f.duration - 1, 1) }))}
                      className={cn('flex-1 rounded-xl border-2 text-center transition-all font-bold text-base',
                        isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                      )}>
                      −
                    </button>
                  </div>
                </div>
                <p className={cn('text-xs mt-2', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                  Durée sélectionnée : <span className="font-semibold">{form.duration}h</span>
                </p>
              </div>

            </div>
          )}

          {/* Step 3 — Service */}
          {step === 3 && (
            <div>
              <p className={cn('text-sm mb-8', isDark ? 'text-zinc-400' : 'text-gray-500')}>
                Sélectionnez la formule qui correspond à votre projet.
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {SERVICES.map(s => {
                  const isSelected = form.service === s.id
                  return (
                    <div key={s.id} className={cn('relative rounded-2xl border-2 flex flex-col transition-all duration-200', s.badge ? 'mt-4 overflow-visible' : 'overflow-hidden',
                      isSelected
                        ? 'border-violet-600 shadow-xl shadow-violet-900/30'
                        : isDark ? 'border-zinc-800 hover:border-zinc-600' : 'border-gray-200 hover:border-violet-300'
                    )}>
                      {/* Badge centré à cheval sur le bord supérieur */}
                      {s.badge && (
                        <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                          <span className={cn('text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg',
                            s.id === 'GOLD' ? 'bg-amber-500 shadow-amber-900/40' : 'bg-zinc-500 shadow-zinc-900/40'
                          )}>{s.badge}</span>
                        </div>
                      )}

                      {/* Card header */}
                      <div className={cn('px-6 pb-5 rounded-t-2xl overflow-hidden', s.badge ? 'pt-8' : 'pt-6', isDark ? 'bg-zinc-900' : 'bg-white')}>
                        <div className="mt-4 mb-5">
                          <span className={cn('text-4xl font-black', isDark ? 'text-white' : 'text-gray-900')}>{s.price} CAD</span>
                          <span className={cn('text-sm ml-1', isDark ? 'text-zinc-500' : 'text-gray-400')}>/heure</span>
                          <span className={cn('text-xs ml-1.5', isDark ? 'text-zinc-600' : 'text-gray-400')}>+ tx</span>
                        </div>
                        <button
                          onClick={() => { setForm(f => ({ ...f, service: s.id })); setTimeout(() => setStep(4), 280) }}
                          className={cn('w-full py-3 rounded-xl font-bold text-sm transition-colors',
                            isSelected
                              ? 'bg-violet-600 hover:bg-violet-700 text-white'
                              : isDark ? 'bg-zinc-800 hover:bg-violet-600 text-white' : 'bg-gray-100 hover:bg-violet-600 hover:text-white text-gray-800'
                          )}>
                          Choisir et continuer
                        </button>
                      </div>

                      {/* Divider */}
                      <div className={cn('mx-6 border-t', isDark ? 'border-zinc-800' : 'border-gray-100')} />

                      {/* Features */}
                      <div className={cn('px-6 py-5 flex-1 rounded-b-2xl overflow-hidden', isDark ? 'bg-zinc-900' : 'bg-white')}>
                        <p className={cn('text-xs font-semibold uppercase tracking-widest mb-4', isDark ? 'text-zinc-500' : 'text-gray-400')}>Ce que vous recevez</p>
                        <ul className="space-y-2.5">
                          {s.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <div className="w-4 h-4 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-2.5 h-2.5 text-violet-400" />
                              </div>
                              <span className={cn('text-sm leading-snug', isDark ? 'text-zinc-300' : 'text-gray-600')}>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4 — Date & Heure */}
          {step === 4 && (
            <div>
              <p className={cn('text-sm mb-6', isDark ? 'text-zinc-400' : 'text-gray-500')}>
                Choisissez la date de votre session.
              </p>

              <div className="flex gap-6 items-start">
              <div className={cn('rounded-2xl border p-5 w-2/3', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200')}>
                {/* Calendar header */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCalView(v => {
                    const d = new Date(v.year, v.month - 1, 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500')}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={cn('font-semibold text-sm', isDark ? 'text-white' : 'text-gray-900')}>
                    {MONTH_FR[calView.month]} {calView.year}
                  </span>
                  <button onClick={() => setCalView(v => {
                    const d = new Date(v.year, v.month + 1, 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500')}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS_FR.map(d => (
                    <div key={d} className={cn('text-center text-xs font-medium py-1', isDark ? 'text-zinc-500' : 'text-gray-400')}>{d}</div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calDays.map((day, i) => {
                    if (!day) return <div key={i} />
                    const dateStr = `${calView.year}-${String(calView.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const d = new Date(calView.year, calView.month, day)
                    const disabled = d < todayDate
                    const isSelected = form.date === dateStr
                    const isToday = d.getTime() === todayDate.getTime()
                    return (
                      <button key={i} disabled={disabled}
                        onClick={() => setForm(f => ({ ...f, date: dateStr }))}
                        className={cn('w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all',
                          isSelected ? 'bg-violet-600 text-white shadow-sm'
                          : disabled ? (isDark ? 'text-zinc-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')
                          : isToday  ? (isDark ? 'text-violet-400 font-bold' : 'text-violet-600 font-bold')
                          : isDark   ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-100'
                        )}>
                        {day}
                      </button>
                    )
                  })}
                </div>

                {form.date && (
                  <div className={cn('mt-4 pt-4 border-t text-sm text-center font-medium', isDark ? 'border-zinc-800 text-violet-400' : 'border-gray-100 text-violet-600')}>
                    {new Date(form.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                )}
              </div>

              {/* Créneaux horaires — apparaissent à droite du calendrier */}
              {form.date && (
                <div className="w-1/3">
                  <h3 className={cn('font-semibold text-sm mb-3', isDark ? 'text-zinc-300' : 'text-gray-700')}>Heure d'arrivée</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map(t => {
                      const h = parseInt(t)
                      const endH = h + form.duration
                      const isValid = endH <= 22
                      const isSelected = form.start_time === t
                      return (
                        <button key={t} disabled={!isValid}
                          onClick={() => { setForm(f => ({ ...f, start_time: t })); setTimeout(() => setStep(5), 280) }}
                          className={cn('py-3 rounded-xl text-sm font-semibold border-2 transition-all',
                            isSelected ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/30'
                            : !isValid  ? (isDark ? 'border-zinc-800 text-zinc-700 cursor-not-allowed' : 'border-gray-100 text-gray-300 cursor-not-allowed')
                            : isDark    ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-violet-500/50' : 'bg-white border-gray-200 text-gray-700 hover:border-violet-400'
                          )}>
                          {t}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Step 5 — Options */}
          {step === 5 && (
            <div>
              <div className="mb-6">
                <button onClick={() => setStep(6)}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-violet-400 border-2 border-violet-600/40 hover:bg-violet-600/10 transition-colors">
                  Continuer sans option
                </button>
              </div>
              <p className={cn('text-sm mb-6', isDark ? 'text-zinc-400' : 'text-gray-500')}>
                Ajoutez des services optionnels à votre session.
              </p>
              <div className="space-y-6">
                {ADDITIONAL_GROUPS.map(({ group, items }) => (
                  <div key={group}>
                    <h3 className={cn('text-xs font-bold uppercase tracking-widest mb-3', isDark ? 'text-zinc-500' : 'text-gray-400')}>{group}</h3>
                    <div className="space-y-2">
                      {items.map(item => {
                        const selected = form.additional_services.includes(item.id)
                        return (
                          <button key={item.id} onClick={() => toggleAdditional(item.id)}
                            className={cn('w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                              selected
                                ? 'bg-violet-600/10 border-violet-600'
                                : isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600' : 'bg-white border-gray-200 hover:border-violet-300'
                            )}>
                            <div className="flex items-center gap-3">
                              <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                                selected ? 'bg-violet-600 border-violet-600' : isDark ? 'border-zinc-600' : 'border-gray-300'
                              )}>
                                {selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>{item.name}</span>
                            </div>
                            <span className={cn('text-sm font-bold', selected ? 'text-violet-500' : isDark ? 'text-zinc-300' : 'text-gray-600')}>
                              +{item.price} CAD
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div className={cn('mt-8 pt-6 border-t', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                <label className={cn('flex items-center gap-1.5 text-sm font-medium mb-2', isDark ? 'text-zinc-400' : 'text-gray-600')}>
                  <Tag className="w-4 h-4" /> Code promo
                </label>
                <div className="flex gap-2">
                  <input
                    value={form.promo_code}
                    onChange={e => setForm(f => ({ ...f, promo_code: e.target.value.toUpperCase() }))}
                    className={cn('flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-violet-500 uppercase font-medium transition-colors', isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900')}
                    placeholder="CODE PROMO"
                  />
                  <button onClick={checkPromo} className={cn('px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors', isDark ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200')}>
                    Appliquer
                  </button>
                </div>
                {promoError && <p className="text-red-400 text-xs mt-1.5">{promoError}</p>}
                {promoResult && <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1"><Check className="w-3 h-3" /> Code appliqué : -{promoResult.type === 'percentage' ? `${promoResult.value}%` : `${promoResult.value} CAD`}</p>}
              </div>

            </div>
          )}

          {/* Step 6 — Confirmation */}
          {step === 6 && (
            <div>
              {/* Grand récapitulatif */}
              <div className={cn('rounded-2xl border mb-6 overflow-hidden', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200')}>

                {/* Studio image pleine largeur */}
                {studio && (
                  <div className="relative h-52 w-full">
                    <img src={studio.img} alt={studio.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <div className="text-white font-black text-2xl leading-tight">{studio.name}</div>
                      <div className="text-white/70 text-sm mt-0.5">{studio.address} · {studio.city}</div>
                      {service && <span className="inline-block mt-2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">{service?.name}</span>}
                    </div>
                  </div>
                )}

                <div className="p-6">
                <h3 className={cn('font-black text-lg mb-5', isDark ? 'text-white' : 'text-gray-900')}>Récapitulatif de votre réservation</h3>

                {/* Détails */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
                  {[
                    ['Date', form.date ? new Date(form.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''],
                    ['Horaire', form.start_time ? `${form.start_time} – ${endTime()}` : ''],
                    ['Durée', `${form.duration}h`],
                    ['Personnes', `${form.persons} face caméra${form.persons > 1 ? 's' : ''}`],
                    form.additional_services.length > 0 ? ['Options', `${form.additional_services.length} service(s)`] : null,
                    promoResult ? ['Réduction', promoResult.type === 'percentage' ? `-${promoResult.value}%` : `-${promoResult.value} CAD`] : null,
                  ].filter(Boolean).map(([k, v]) => v && (
                    <div key={k}>
                      <div className={cn('text-xs mb-0.5', isDark ? 'text-zinc-500' : 'text-gray-400')}>{k}</div>
                      <div className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className={cn('border-t pt-4 space-y-1.5', isDark ? 'border-zinc-800' : 'border-gray-100')}>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>Sous-total</span>
                    <span className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>TPS (5%)</span>
                    <span className={isDark ? 'text-zinc-300' : 'text-gray-600'}>{formatPrice(tps)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>TVQ (9,975%)</span>
                    <span className={isDark ? 'text-zinc-300' : 'text-gray-600'}>{formatPrice(tvq)}</span>
                  </div>
                  <div className={cn('flex justify-between font-black text-xl pt-2 border-t', isDark ? 'border-zinc-800 text-white' : 'border-gray-200 text-gray-900')}>
                    <span>Total</span>
                    <span>{formatPrice(totalTTC)}</span>
                  </div>
                </div>
                </div>{/* /p-6 */}
              </div>

              {/* Auth section */}
              {user ? (
                <div className={cn('rounded-2xl border p-5 flex items-center gap-4', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200')}>
                  <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{user.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <div className={cn('font-semibold text-sm', isDark ? 'text-white' : 'text-gray-900')}>{user.name}</div>
                    <div className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-gray-500')}>{user.email}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs text-green-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Connecté</span>
                  </div>
                </div>
              ) : (
                <div className={cn('rounded-2xl border p-6 text-center', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200')}>
                  <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(0,188,212,0.15)', border: '1px solid rgba(0,188,212,0.3)' }}>
                    <Users className="w-5 h-5" style={{ color: '#00BCD4' }} />
                  </div>
                  <h4 className={cn('font-black text-base mb-1', isDark ? 'text-white' : 'text-gray-900')}>Connectez-vous pour confirmer</h4>
                  <p className={cn('text-xs mb-5', isDark ? 'text-zinc-400' : 'text-gray-500')}>Un compte est nécessaire pour finaliser votre réservation.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setQuickLoginOpen(true); setQuickLoginError('') }}
                      className={cn('py-3 rounded-xl border-2 font-semibold text-sm transition-all', isDark ? 'border-zinc-700 text-white hover:border-blue-600/50' : 'border-gray-200 text-gray-800 hover:border-blue-400')}>
                      Se connecter
                    </button>
                    <button onClick={() => { setQuickRegisterOpen(true); setQuickRegisterError('') }}
                      className="py-3 rounded-xl font-bold text-sm text-white transition-all"
                      style={{ background: '#00BCD4', boxShadow: '0 4px 16px rgba(0,188,212,0.4)' }}>
                      Créer mon compte
                    </button>
                  </div>
                </div>
              )}

              {/* Validation button — visible when logged in */}
              {user && (
                <button
                  onClick={handleSubmit}
                  className="w-full mt-4 py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#e8175d,#ff4d8d)', boxShadow: '0 8px 30px rgba(232,23,93,0.4)' }}
                >
                  <CheckCircle className="w-5 h-5" />
                  Valider ma réservation
                </button>
              )}
            </div>
          )}

          {/* Mobile nav (retour uniquement) */}
          {step > 1 && (
            <div className="mt-6 lg:hidden">
              <button onClick={() => setStep(s => s - 1)}
                className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors',
                  isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                )}>
                <ArrowLeft className="w-3.5 h-3.5" /> Retour
              </button>
            </div>
          )}
        </div>

        {/* Right: summary card + nav (desktop only) */}
        <div className={cn('w-72 flex-shrink-0 sticky top-8', step === 6 ? 'hidden' : 'hidden lg:block')}>
          {/* Nav CTA desktop */}
          <div className="mb-3 flex gap-2">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className={cn('w-1/3 flex items-center justify-center gap-1 py-2.5 rounded-xl font-medium text-xs border transition-colors',
                  isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                )}>
                <ArrowLeft className="w-3 h-3" /> Retour
              </button>
            )}
            {step !== 1 && step !== 3 && step !== 4 && (
              step < 6 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                  className={cn('flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md shadow-violet-900/20 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white', step === 1 ? 'w-full' : '')}>
                  Go →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!canNext()}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md shadow-violet-900/20 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg,#e8175d,#ff4d8d)' }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Valider
                </button>
              )
            )}
          </div>

          <SummaryCard />
        </div>
      </div>

      {/* ── Modale Créer son compte ── */}
      {quickRegisterOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="flex items-center justify-center min-h-full p-4">
          <div className={cn('w-full max-w-md rounded-2xl border p-8 relative shadow-2xl my-4', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200')}>
            <button onClick={() => setQuickRegisterOpen(false)} className={cn('absolute top-4 right-4 p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}>
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <img src="/logo.png" alt="Level Studios" className="w-20 h-20 object-contain mb-3" style={{ filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
              <h2 className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>Créez votre compte</h2>
              <p className={cn('text-sm mt-1', isDark ? 'text-zinc-400' : 'text-gray-500')}>Entrez vos informations pour commencer.</p>
            </div>

            <div className="space-y-4">
              {/* Bouton Google */}
              {GOOGLE_CLIENT_ID ? (
                <div ref={googleBtnRef} className="w-full overflow-hidden rounded-xl" />
              ) : (
                <button disabled className="w-full flex items-center justify-center gap-3 rounded-xl py-3 border text-sm font-medium opacity-50 cursor-not-allowed"
                  style={{ borderColor: isDark ? '#3f3f46' : '#e5e7eb', background: isDark ? '#27272a' : '#fff', color: isDark ? '#a1a1aa' : '#374151' }}
                  title="Ajoutez VITE_GOOGLE_CLIENT_ID dans votre .env pour activer">
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
                  Continuer avec Google
                </button>
              )}

              {/* Séparateur */}
              <div className="flex items-center gap-3">
                <div className={cn('flex-1 h-px', isDark ? 'bg-zinc-700' : 'bg-gray-200')} />
                <span className={cn('text-xs font-medium', isDark ? 'text-zinc-500' : 'text-gray-400')}>ou</span>
                <div className={cn('flex-1 h-px', isDark ? 'bg-zinc-700' : 'bg-gray-200')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'firstName', label: 'Prénom *' },
                  { key: 'lastName',  label: 'Nom *' },
                ].map(f => (
                  <div key={f.key}>
                    <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-zinc-400' : 'text-gray-600')}>{f.label}</label>
                    <input type="text" value={quickRegisterForm[f.key]}
                      onChange={e => setQuickRegisterForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className={cn('w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors', isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-200 text-gray-900')} />
                  </div>
                ))}
              </div>

              {[
                { key: 'email',           label: 'Adresse email *',         type: 'email' },
                { key: 'password',        label: 'Mot de passe *',          type: 'password' },
                { key: 'confirmPassword', label: 'Confirmer le mot de passe *', type: 'password' },
                { key: 'company',         label: 'Nom de l\'entreprise',    type: 'text',     opt: true },
              ].map(f => (
                <div key={f.key}>
                  <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-zinc-400' : 'text-gray-600')}>
                    {f.label}{f.opt && <span className={cn('ml-1 text-xs font-normal', isDark ? 'text-zinc-600' : 'text-gray-400')}>(optionnel)</span>}
                  </label>
                  <input type={f.type} value={quickRegisterForm[f.key]}
                    onChange={e => setQuickRegisterForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={cn('w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors', isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-200 text-gray-900')} />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'tps', label: 'Numéro TPS' },
                  { key: 'tvq', label: 'Numéro TVQ' },
                ].map(f => (
                  <div key={f.key}>
                    <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-zinc-400' : 'text-gray-600')}>
                      {f.label} <span className={cn('text-xs font-normal', isDark ? 'text-zinc-600' : 'text-gray-400')}>(optionnel)</span>
                    </label>
                    <input type="text" value={quickRegisterForm[f.key]}
                      onChange={e => setQuickRegisterForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className={cn('w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors', isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-200 text-gray-900')} />
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={quickRegisterForm.cgu}
                  onChange={e => setQuickRegisterForm(p => ({ ...p, cgu: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-violet-600 flex-shrink-0" />
                <span className={cn('text-xs leading-relaxed', isDark ? 'text-zinc-400' : 'text-gray-500')}>
                  J'accepte les <span className="underline text-violet-500 cursor-pointer">Conditions Générales</span> et la <span className="underline text-violet-500 cursor-pointer">Politique de Confidentialité</span>
                </span>
              </label>

              {quickRegisterError && <p className="text-red-400 text-xs font-medium">{quickRegisterError}</p>}

              <button onClick={() => {
                  const { firstName, lastName, email, password, confirmPassword, cgu, tps, tvq, company } = quickRegisterForm
                  if (!firstName || !lastName || !email || !password) { setQuickRegisterError('Veuillez remplir tous les champs obligatoires.'); return }
                  if (password.length < 6) { setQuickRegisterError('Le mot de passe doit faire au moins 6 caractères.'); return }
                  if (password !== confirmPassword) { setQuickRegisterError('Les mots de passe ne correspondent pas.'); return }
                  if (!cgu) { setQuickRegisterError('Veuillez accepter les conditions générales.'); return }
                  const clientType = (tps || tvq) ? 'pro' : 'particulier'
                  const result = register({ firstName, lastName, email, password, company, tps, tvq, clientType })
                  if (result.success) {
                    setQuickRegisterOpen(false)
                    setQuickRegisterForm({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', company: '', tps: '', tvq: '', cgu: false })
                    sendWelcomeEmail({ firstName, lastName, email, clientType })
                  } else setQuickRegisterError(result.error || 'Erreur lors de la création du compte.')
                }}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20">
                Créer un compte
              </button>

              <p className={cn('text-center text-xs', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                Déjà un compte ?{' '}
                <button onClick={() => { setQuickRegisterOpen(false); setQuickLoginOpen(true) }} className="font-semibold text-violet-500 underline">
                  Se connecter
                </button>
              </p>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── Modale Se connecter ── */}
      {quickLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className={cn('w-full max-w-md rounded-2xl border p-8 relative shadow-2xl', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200')}>
            <button onClick={() => setQuickLoginOpen(false)} className={cn('absolute top-4 right-4 p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}>
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <img src="/logo.png" alt="Level Studios" className="w-20 h-20 object-contain mb-3" style={{ filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
              <h2 className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>Bienvenue</h2>
              <p className={cn('text-sm mt-1', isDark ? 'text-zinc-400' : 'text-gray-500')}>Connectez-vous à votre compte Level Studios.</p>
            </div>

            <div className="space-y-4">
              {/* Bouton Google */}
              {GOOGLE_CLIENT_ID ? (
                <div ref={googleBtnRef} className="w-full overflow-hidden rounded-xl" />
              ) : (
                <button disabled className="w-full flex items-center justify-center gap-3 rounded-xl py-3 border text-sm font-medium opacity-50 cursor-not-allowed"
                  style={{ borderColor: isDark ? '#3f3f46' : '#e5e7eb', background: isDark ? '#27272a' : '#fff', color: isDark ? '#a1a1aa' : '#374151' }}
                  title="Ajoutez VITE_GOOGLE_CLIENT_ID dans votre .env pour activer">
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
                  Continuer avec Google
                </button>
              )}

              <div className="flex items-center gap-3">
                <div className={cn('flex-1 h-px', isDark ? 'bg-zinc-700' : 'bg-gray-200')} />
                <span className={cn('text-xs font-medium', isDark ? 'text-zinc-500' : 'text-gray-400')}>ou</span>
                <div className={cn('flex-1 h-px', isDark ? 'bg-zinc-700' : 'bg-gray-200')} />
              </div>

              {[
                { key: 'email',    label: 'Adresse email', type: 'email' },
                { key: 'password', label: 'Mot de passe',  type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-zinc-400' : 'text-gray-600')}>{f.label}</label>
                  <input type={f.type} value={quickLoginForm[f.key]}
                    onChange={e => setQuickLoginForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={cn('w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors', isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-gray-200 text-gray-900')} />
                </div>
              ))}

              {quickLoginError && <p className="text-red-400 text-xs font-medium">{quickLoginError}</p>}

              <button onClick={async () => {
                  const res = await login(quickLoginForm.email, quickLoginForm.password)
                  if (res.success) { setQuickLoginOpen(false); setForm(f => ({ ...f, name: res.user.name, email: res.user.email })); setQuickLoginForm({ email: '', password: '' }) }
                  else setQuickLoginError(res.error)
                }}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20">
                Se connecter
              </button>

              <p className={cn('text-center text-xs', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                Pas encore de compte ?{' '}
                <button onClick={() => { setQuickLoginOpen(false); setQuickRegisterOpen(true) }} className="font-semibold text-violet-500 underline">
                  Créer son compte
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
