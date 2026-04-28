import React, { useState, useEffect } from 'react'
import { Search, Check, X, Eye, Plus, CheckCircle, CreditCard, User, Calendar, Settings, Star, Trash2, UserX, RotateCcw, Pencil, Filter, ChevronDown, ChevronUp, History } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { formatPrice, cn, STATUS_CONFIG, getTierConfig } from '../../utils'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { useReservations } from '../../hooks/useReservations'
import ReservationEditModal from '../../components/ReservationEditModal'
import DatePicker from '../../components/DatePicker'
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar'
import { isGoogleImport } from '../../services/googleCalendarService'

const STATUS_OPTIONS = ['Tous', 'en_attente', 'a_payer', 'validee', 'tournee', 'post-prod', 'livree', 'annulee', 'rembourse', 'absent']
const STATUS_MAP = STATUS_CONFIG

const STUDIOS = ['Studio A', 'Studio B', 'Studio C']

function buildServices() {
  const p = Store.getPrices()
  const priceOf = (id, fb) => p.services.find(s => s.id === id)?.price ?? fb
  const a = priceOf('ARGENT', 221), g = priceOf('GOLD', 587)
  return [
    { key: 'ARGENT', label: `ARGENT — ${a} CAD/h`, rate: a },
    { key: 'GOLD',   label: `GOLD — ${g} CAD/h`,   rate: g },
  ]
}
function buildOptionsList() {
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
const DURATIONS = [1, 2, 3, 4, 5, 6, 8, 10]
const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', company: '',
  studio: 'Studio A', date: '', startTime: '10:00', duration: 2,
  service: 'ARGENT', options: [], format: 'horizontal',
  cardNumber: '', cardExpiry: '', cardCvv: '', cardHolder: '',
  sendEmail: true,
}

const StarDisplay = ({ value, isDark }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(n => (
      <Star key={n} size={11} className={n <= value ? 'text-amber-400 fill-amber-400' : isDark ? 'text-zinc-700 fill-zinc-700' : 'text-gray-200 fill-gray-200'} />
    ))}
  </div>
)

const SectionHeader = ({ icon, title, textPrimary }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">{icon}</div>
    <h3 className={cn('font-semibold', textPrimary)}>{title}</h3>
  </div>
)

const Field = ({ label, error, children, textPrimary }) => (
  <div>
    <label className={cn('block text-xs font-medium mb-1.5', textPrimary)}>{label}</label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
)

const FormInput = ({ inputCls, ...props }) => (
  <input className={cn('w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors', inputCls)} {...props} />
)

const FormSelect = ({ value, onChange, options, inputCls }) => (
  <select value={value} onChange={onChange} className={cn('w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors', inputCls)}>
    {options.map(opt => <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>)}
  </select>
)

function calcEndTime(start, dur) {
  const [h, m] = start.split(':').map(Number)
  const totalMin = h * 60 + m + dur * 60
  return `${String(Math.floor(totalMin / 60) % 24).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
}

export default function AdminReservations() {
  const { theme } = useApp()
  const { user } = useAuth()
  const location = useLocation()
  const isDark = theme === 'dark'
  const { reservations, reload } = useReservations({ includeTrash: true })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [view, setView] = useState('list') // 'list' | 'corbeille'
  const [selected, setSelected] = useState(null)
  const [editingRes, setEditingRes] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(null)
  const { syncCreate, syncUpdate, syncDelete } = useGoogleCalendar()
  const [clients, setClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [emailQuery, setEmailQuery] = useState('')
  const [showEmailDrop, setShowEmailDrop] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [periodFilter, setPeriodFilter] = useState('all')
  const [formulaFilter, setFormulaFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [showProjectHistory, setShowProjectHistory] = useState(false)

  useEffect(() => {
    setClients(Store.getAccounts().filter(a => a.type === 'client' && !a.trashed))
  }, [])

  // Auto-open create modal when navigated with state { openCreate: true }
  useEffect(() => {
    if (location.state?.openCreate) {
      if (location.state.date) setForm(f => ({ ...f, date: location.state.date }))
      setShowCreate(true)
    }
  }, [location.state])

  useEffect(() => {
    const handler = () => {
      if (selected) setSelected(null)
      else if (showCreate) setShowCreate(false)
    }
    window.addEventListener('app:escape', handler)
    return () => window.removeEventListener('app:escape', handler)
  }, [selected, showCreate])

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const inputCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-violet-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-500'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const tableRow = isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-gray-100 hover:bg-gray-50'
  const tableHead = isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'
  const modalBg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200 shadow-xl'
  const btnSecondary = isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'

  const SERVICES = buildServices()
  const OPTIONS_LIST = buildOptionsList()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleOption = key => setForm(f => ({
    ...f, options: f.options.includes(key) ? f.options.filter(o => o !== key) : [...f.options, key]
  }))

  const TPS_RATE = 0.05
  const TVQ_RATE = 0.09975
  const round2 = v => Math.round(v * 100) / 100

  const serviceRate = SERVICES.find(s => s.key === form.service)?.rate || SERVICES[0]?.rate || 221
  const basePrice = serviceRate * Number(form.duration)
  const optionsPrice = form.options.reduce((sum, key) => sum + (OPTIONS_LIST.find(o => o.key === key)?.price || 0), 0)
  const total = basePrice + optionsPrice
  const formTPS = round2(total * TPS_RATE)
  const formTVQ = round2(total * TVQ_RATE)
  const totalTTC = round2(total + formTPS + formTVQ)

  const filteredClients = clientSearch.trim()
    ? clients.filter(c =>
        (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(clientSearch.toLowerCase())
      )
    : []

  const pickClient = (client) => {
    const parts = (client.name || '').trim().split(' ')
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''
    const clientRes = reservations
      .filter(r => r.client_email === client.email && r.status !== 'annulee' && !r.trashed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    const prefStudio = clientRes[0]?.studio || 'Studio A'
    const prefService = clientRes[0]?.service || 'ARGENT'
    setForm(f => ({ ...f, firstName, lastName, email: client.email || '', phone: client.phone || '', company: client.company || '', studio: prefStudio, service: prefService }))
    setClientSearch('')
  }

  const refresh = reload

  const trashedReservations = reservations.filter(r => r.trashed)
  const activeReservations  = reservations.filter(r => !r.trashed)

  const todayStr = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const filtered = (view === 'corbeille' ? trashedReservations : activeReservations).filter(r => {
    const q = search.toLowerCase()
    const matchSearch = (r.client_name || '').toLowerCase().includes(q) ||
      (r.studio || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q)
    const matchStatus = view === 'corbeille' || statusFilter === 'Tous' || r.status === statusFilter
    const matchFormula = !formulaFilter || r.service === formulaFilter
    const matchRating = !ratingFilter || String(r.rating) === ratingFilter
    const matchFormat = !formatFilter || (r.format || 'horizontal') === formatFilter
    let matchPeriod = true
    if (periodFilter !== 'all' && r.date) {
      const d = new Date(r.date + 'T12:00:00')
      if (periodFilter === 'today') matchPeriod = r.date === todayStr
      else if (periodFilter === 'week') {
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0,0,0,0)
        const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6)
        matchPeriod = d >= startOfWeek && d <= endOfWeek
      } else if (periodFilter === 'month') {
        matchPeriod = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      } else if (periodFilter === 'year') {
        matchPeriod = d.getFullYear() === now.getFullYear()
      }
    }
    return matchSearch && matchStatus && matchFormula && matchRating && matchFormat && matchPeriod
  })

  const updateStatus = (id, status) => {
    Store.updateReservation(id, { status, modified_by: user?.email || 'admin' })
    refresh()
    if (selected?.id === id) setSelected({ ...selected, status })
    const res = Store.getAllReservations().find(r => r.id === id)
    if (res) syncUpdate({ ...res, status })
  }

  // Soft-delete → corbeille
  const handleDelete = (id) => {
    const res = Store.getAllReservations().find(r => r.id === id)
    Store.updateReservation(id, { trashed: true })
    refresh()
    if (selected?.id === id) setSelected(null)
    if (res) syncDelete(res)
  }

  // Restore from trash
  const handleRestore = (id) => {
    Store.updateReservation(id, { trashed: false })
    refresh()
  }

  // Permanent delete (from corbeille)
  const handlePermanentDelete = (id) => {
    if (!confirm('Supprimer définitivement cette réservation ? Cette action est irréversible.')) return
    Store.deleteReservation(id)
    refresh()
    if (selected?.id === id) setSelected(null)
  }

  // Empty trash
  const handleEmptyTrash = () => {
    const n = trashedReservations.length
    if (n === 0) return
    if (!confirm(`Vider la corbeille (${n} réservation${n > 1 ? 's' : ''}) ? Cette action est irréversible.`)) return
    trashedReservations.forEach(r => Store.deleteReservation(r.id))
    refresh()
  }

  const handleEditSave = (id, patch) => {
    Store.updateReservation(id, { ...patch, modified_by: user?.email || 'admin' })
    refresh()
    if (selected?.id === id) setSelected(s => ({ ...s, ...patch }))
    const res = Store.getAllReservations().find(r => r.id === id)
    if (res) syncUpdate({ ...res, ...patch })
  }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Requis'
    if (!form.lastName.trim()) e.lastName = 'Requis'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide'
    if (!form.date) e.date = 'Requis'
    return e
  }

  function handleCreate(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    const res = Store.addReservation({
      client_name: `${form.firstName} ${form.lastName}`,
      client_email: form.email,
      client_phone: form.phone,
      company: form.company,
      studio: form.studio,
      service: form.service,
      date: form.date,
      start_time: form.startTime,
      end_time: calcEndTime(form.startTime, form.duration),
      duration: Number(form.duration),
      price: totalTTC,
      price_ht: total,
      status: 'validee',
      additional_services: form.options,
      format: form.format || 'horizontal',
      promo_code: null,
      manual: true,
    })
    refresh()
    setSuccess(res)
    setForm(emptyForm)
    syncCreate(res)
  }

  function closeCreate() {
    setShowCreate(false)
    setSuccess(null)
    setErrors({})
    setForm(emptyForm)
  }


  return (
    <Layout navItems={ADMIN_NAV} title="Réservations">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
            <input value={search} onChange={e => setSearch(e.target.value)} className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${inputCls}`} placeholder="Rechercher..." />
          </div>

          {view === 'list' ? (
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s === 'Tous' ? 'Tous' : STATUS_MAP[s]?.label_fr || s}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setView('list')} className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>← Retour</button>
              {trashedReservations.length > 0 && (
                <button onClick={handleEmptyTrash} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors whitespace-nowrap">
                  <Trash2 size={12} /> Vider la corbeille
                </button>
              )}
            </div>
          )}

          {view === 'list' && (
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${showFilters ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Filter size={13} />
              Filtres
              {(periodFilter !== 'all' || formulaFilter || ratingFilter || formatFilter) && (
                <span className="w-1.5 h-1.5 rounded-full bg-violet-300" />
              )}
              {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setView(v => v === 'corbeille' ? 'list' : 'corbeille')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${view === 'corbeille' ? 'bg-red-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Trash2 size={13} />
              Corbeille
              {trashedReservations.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${view === 'corbeille' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400'}`}>{trashedReservations.length}</span>
              )}
            </button>
            {view === 'list' && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                <Plus size={14} />
                Créer une réservation
              </button>
            )}
          </div>
        </div>

        {/* Expanded filters panel */}
        {showFilters && view === 'list' && (
          <div className={`border rounded-2xl p-4 ${card}`}>
            <div className="flex flex-wrap gap-4">
              {/* Period */}
              <div>
                <p className={`text-xs font-medium mb-2 ${textSecondary}`}>Période</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[['all','Tout'],['today','Aujourd\'hui'],['week','Semaine'],['month','Mois'],['year','Année']].map(([v, l]) => (
                    <button key={v} onClick={() => setPeriodFilter(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${periodFilter === v ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Formula */}
              <div>
                <p className={`text-xs font-medium mb-2 ${textSecondary}`}>Formule</p>
                <div className="flex gap-1.5">
                  {[['','Toutes'],['BRONZE','BRONZE'],['ARGENT','ARGENT'],['GOLD','OR']].map(([v, l]) => (
                    <button key={v} onClick={() => setFormulaFilter(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${formulaFilter === v ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Format */}
              <div>
                <p className={`text-xs font-medium mb-2 ${textSecondary}`}>Format</p>
                <div className="flex gap-1.5">
                  {[['','Tous'],['horizontal','Horizontal'],['vertical','Vertical']].map(([v, l]) => (
                    <button key={v} onClick={() => setFormatFilter(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${formatFilter === v ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Note */}
              <div>
                <p className={`text-xs font-medium mb-2 ${textSecondary}`}>Note</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setRatingFilter('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ratingFilter === '' ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Toutes
                  </button>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRatingFilter(String(n))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ratingFilter === String(n) ? 'bg-amber-500 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {'★'.repeat(n)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {(periodFilter !== 'all' || formulaFilter || ratingFilter || formatFilter) && (
              <button onClick={() => { setPeriodFilter('all'); setFormulaFilter(''); setRatingFilter(''); setFormatFilter('') }}
                className="mt-3 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                <X size={12} /> Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Result count + total */}
        {view === 'list' && (
          <div className="flex items-center gap-4 text-xs">
            <span className={textSecondary}>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
            <span className={`font-semibold ${textPrimary}`}>
              Total : {formatPrice(filtered.reduce((sum, r) => sum + (r.price || 0), 0))}
            </span>
          </div>
        )}

        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${tableHead}`}>
                  <th className="text-left text-xs font-semibold px-5 py-3">Client</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden sm:table-cell">Studio</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden md:table-cell">Date</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden lg:table-cell">Montant</th>
                  <th className="text-left text-xs font-semibold px-5 py-3">Statut</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden md:table-cell">Source</th>
                  <th className="text-left text-xs font-semibold px-5 py-3 hidden sm:table-cell">Note</th>
                  <th className="text-left text-xs font-semibold px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className={`border-b transition-colors ${tableRow}`}>
                    <td className="px-5 py-3.5">
                      <div className={`text-sm font-medium ${textPrimary}`}>{r.client_name}</div>
                      <div className={`text-xs font-mono flex items-center gap-1.5 ${textSecondary}`}>
                        {r.id}
                        {isGoogleImport(r) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20">Google</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{r.studio}</span>
                        {r.service && <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${getTierConfig(r.service).cls}`}>{getTierConfig(r.service).label}</span>}
                      </td>
                    <td className={`px-5 py-3.5 hidden md:table-cell text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{r.date} {r.start_time}–{r.end_time}</td>
                    <td className={`px-5 py-3.5 hidden lg:table-cell text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{formatPrice(r.price)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${STATUS_MAP[r.status]?.cls || (isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-100 text-gray-600')}`}>
                        {STATUS_MAP[r.status]?.label_fr || r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {r.manual
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">Équipe</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Client</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {r.rating ? (
                        <div className="flex flex-col gap-0.5">
                          <StarDisplay value={r.rating} isDark={isDark} />
                          {r.rating_comment && (
                            <p className={`text-[10px] max-w-[120px] truncate ${textSecondary}`} title={r.rating_comment}>
                              "{r.rating_comment}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className={`text-xs ${textSecondary}`}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {view === 'corbeille' ? (
                          <>
                            <button onClick={() => handleRestore(r.id)} title="Restaurer" className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handlePermanentDelete(r.id)} title="Supprimer définitivement" className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setSelected(r)} title="Voir le détail" className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingRes(r)} title="Modifier" className="p-1.5 bg-violet-500/20 hover:bg-violet-500/30 rounded-lg text-violet-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            {r.status === 'en_attente' && (
                              <button onClick={() => updateStatus(r.id, 'validee')} title="Valider" className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                            )}
                            {r.status === 'absent' && (
                              <button onClick={() => updateStatus(r.id, 'en_attente')} title="Remettre en attente" className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                            )}
                            {r.status !== 'absent' && r.status !== 'annulee' && r.status !== 'rembourse' && (
                              <button onClick={() => updateStatus(r.id, 'absent')} title="Marquer absent" className="p-1.5 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-orange-400 transition-colors"><UserX className="w-3.5 h-3.5" /></button>
                            )}
                            {r.status !== 'annulee' && r.status !== 'livree' && r.status !== 'absent' && (
                              <button onClick={() => updateStatus(r.id, 'annulee')} title="Annuler" className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                            )}
                            <button onClick={() => handleDelete(r.id)} title="Mettre à la corbeille" className="p-1.5 bg-zinc-500/10 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className={`text-center py-12 text-sm ${textSecondary}`}>Aucune réservation trouvée</div>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setShowProjectHistory(false) }}>
          <div className={`border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-bold ${textPrimary}`}>Détail réservation</h3>
              <button onClick={() => setSelected(null)} className={textSecondary}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {/* ID row with Google badge */}
              <div className={`flex justify-between border-b pb-2 ${divider}`}>
                <span className={textSecondary}>ID</span>
                <span className={`font-medium font-mono flex items-center gap-1.5 ${textPrimary}`}>
                  {selected.id}
                  {isGoogleImport(selected) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20">Google</span>
                  )}
                </span>
              </div>
              {[
                ['Client', selected.client_name],
              ].map(([k, v]) => v != null && (
                <div key={k} className={`flex justify-between border-b pb-2 ${divider}`}>
                  <span className={textSecondary}>{k}</span>
                  <span className={`font-medium ${textPrimary}`}>{v}</span>
                </div>
              ))}

              {/* Email : combobox pour réservations Google, texte statique sinon */}
              {isGoogleImport(selected) ? (
                <div className={`border-b pb-3 ${divider}`}>
                  <div className={`text-xs font-medium mb-1.5 ${textSecondary}`}>Email client</div>
                  <div className="relative">
                    <input
                      type="text"
                      value={emailQuery !== '' ? emailQuery : (selected.client_email || '')}
                      onChange={e => { setEmailQuery(e.target.value); setShowEmailDrop(true) }}
                      onFocus={() => setShowEmailDrop(true)}
                      onBlur={() => setTimeout(() => setShowEmailDrop(false), 150)}
                      placeholder="Saisir ou sélectionner un email..."
                      className={cn('w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2', inputCls)}
                    />
                    {showEmailDrop && (
                      <div className={`absolute z-20 w-full mt-1 rounded-xl border shadow-xl max-h-48 overflow-y-auto ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                        {clients
                          .filter(c => !emailQuery || (c.email || '').toLowerCase().includes(emailQuery.toLowerCase()) || (c.name || '').toLowerCase().includes(emailQuery.toLowerCase()))
                          .slice(0, 15)
                          .map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={() => {
                                Store.updateReservation(selected.id, { client_email: c.email, client_name: c.name || selected.client_name, modified_by: user?.email || 'admin' })
                                setSelected(s => ({ ...s, client_email: c.email, client_name: c.name || s.client_name }))
                                setEmailQuery('')
                                setShowEmailDrop(false)
                                reload()
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${isDark ? 'hover:bg-violet-500/10' : 'hover:bg-violet-50'}`}
                            >
                              <div className={`font-medium ${textPrimary}`}>{c.email}</div>
                              {c.name && <div className={`text-xs ${textSecondary}`}>{c.name}</div>}
                            </button>
                          ))
                        }
                        {clients.filter(c => !emailQuery || (c.email || '').toLowerCase().includes(emailQuery.toLowerCase()) || (c.name || '').toLowerCase().includes(emailQuery.toLowerCase())).length === 0 && (
                          <div className={`px-3 py-3 text-xs ${textSecondary}`}>Aucun client trouvé</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`flex justify-between border-b pb-2 ${divider}`}>
                  <span className={textSecondary}>Email</span>
                  <span className={`font-medium ${textPrimary}`}>{selected.client_email}</span>
                </div>
              )}

              {[
                ['Studio', selected.studio],
                ['Formule', selected.service],
                ['Date', selected.date],
                ['Horaire', `${selected.start_time} – ${selected.end_time}`],
                ['Durée', `${selected.duration}h`],
                ['Personnes', selected.persons],
                ['Prix TTC', formatPrice(selected.price)],
                ...(selected.price_ht ? [
                  ['  ↳ HT', formatPrice(selected.price_ht)],
                  ['  ↳ TPS 5%', formatPrice(Math.round(selected.price_ht * 0.05 * 100) / 100)],
                  ['  ↳ TVQ 9.975%', formatPrice(Math.round(selected.price_ht * 0.09975 * 100) / 100)],
                ] : []),
                ['Statut', STATUS_MAP[selected.status]?.label_fr || selected.status],
              ].map(([k, v]) => v != null && (
                <div key={k} className={`flex justify-between border-b pb-2 ${divider}`}>
                  <span className={textSecondary}>{k}</span>
                  <span className={`font-medium ${textPrimary}`}>{v}</span>
                </div>
              ))}
              {/* Format */}
              <div className={`flex justify-between border-b pb-2 ${divider}`}>
                <span className={textSecondary}>Format</span>
                <span className={`font-medium ${textPrimary}`}>
                  {selected.format === 'vertical' ? '↕ Vertical (9:16)' : '↔ Horizontal (16:9)'}
                </span>
              </div>
              {selected.additional_services?.length > 0 && (
                <div className={`flex justify-between border-b pb-2 ${divider}`}>
                  <span className={textSecondary}>Options</span>
                  <span className={textPrimary}>{selected.additional_services.join(', ')}</span>
                </div>
              )}
              {/* Project status */}
              {(() => {
                const project = Store.getProjects().find(p => p.reservation_id === selected.id)
                if (!project) return null
                return (
                  <div className={`border-t pt-3 mt-1 space-y-2 ${divider}`}>
                    <p className={`text-xs font-semibold ${textSecondary}`}>Projet Kanban</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-50 text-violet-700'}`}>
                        {project.status}
                      </span>
                      <button
                        onClick={() => setShowProjectHistory(h => !h)}
                        className={`flex items-center gap-1 text-xs ${textSecondary} hover:text-violet-400 transition-colors`}
                      >
                        <History size={12} /> Historique
                        {showProjectHistory ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>
                    {showProjectHistory && (project.history || []).length > 0 && (
                      <div className={`rounded-xl p-3 space-y-2 text-xs ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                        {[...(project.history || [])].reverse().map((h, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`mt-0.5 w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0`} />
                            <div>
                              <span className={textPrimary}>{h.from} → {h.to}</span>
                              {h.by && <span className={`ml-1 ${textSecondary}`}>· {h.by}</span>}
                              {h.at && <div className={textSecondary}>{new Date(h.at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>}
                            </div>
                          </div>
                        ))}
                        {(project.history || []).length === 0 && (
                          <p className={textSecondary}>Aucun mouvement enregistré</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
              {selected.rating && (
                <div className={`border-t pt-3 mt-1 ${divider}`}>
                  <p className={`text-xs font-semibold mb-2 ${textSecondary}`}>Évaluation client</p>
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={16} className={n <= selected.rating ? 'text-amber-400 fill-amber-400' : isDark ? 'text-zinc-700 fill-zinc-700' : 'text-gray-200 fill-gray-200'} />
                    ))}
                    <span className={`ml-2 text-sm font-bold ${textPrimary}`}>{selected.rating}/5</span>
                  </div>
                  {selected.rating_comment && (
                    <p className={`text-sm italic mt-1 ${textSecondary}`}>"{selected.rating_comment}"</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6 flex-wrap">
              {selected.status === 'en_attente' && (
                <button onClick={() => { updateStatus(selected.id, 'validee'); setSelected({ ...selected, status: 'validee' }) }} className="flex-1 bg-green-500 text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-green-400 transition-colors">Valider</button>
              )}
              {selected.status === 'validee' && (
                <button onClick={() => { updateStatus(selected.id, 'livree'); setSelected({ ...selected, status: 'livree' }) }} className="flex-1 bg-blue-500 text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-blue-400 transition-colors">Marquer livré</button>
              )}
              <button onClick={() => handleDelete(selected.id)} className="p-2.5 rounded-xl bg-zinc-500/10 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors" title="Mettre à la corbeille"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className={`flex-1 border rounded-xl py-2.5 text-sm transition-colors ${btnSecondary}`}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit reservation modal */}
      {editingRes && (
        <ReservationEditModal
          reservation={editingRes}
          modifiedBy={user?.email || 'admin'}
          onSave={handleEditSave}
          onClose={() => setEditingRes(null)}
        />
      )}

      {/* Create reservation modal — same form as ChefManual */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeCreate}>
          <div
            className={`border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto ${modalBg}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
              <h3 className={`font-bold text-lg ${textPrimary}`}>Réservation manuelle</h3>
              <button onClick={closeCreate} className={textSecondary}><X size={20} /></button>
            </div>

            {success ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h4 className={`font-bold text-xl mb-1 ${textPrimary}`}>Réservation créée !</h4>
                  <p className={`text-sm ${textSecondary}`}>La réservation a été enregistrée avec succès.</p>
                </div>
                <div className={`text-sm font-mono p-3 rounded-xl inline-block ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} ${textSecondary}`}>
                  ID : <span className={`font-bold ${textPrimary}`}>{success.id}</span>
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <button onClick={() => setSuccess(null)} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                    Nouvelle réservation
                  </button>
                  <button onClick={closeCreate} className={`border rounded-xl px-6 py-2.5 text-sm transition-colors ${btnSecondary}`}>
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: form sections */}
                  <div className="flex-1 space-y-5">
                    {/* Section 1: Client info */}
                    <div className={cn('border rounded-2xl p-6', card)}>
                      <SectionHeader icon={<User size={16} />} title="Informations client" textPrimary={textPrimary} />
                      {/* Client picker */}
                      <div className="mb-4 relative">
                        <label className={cn('block text-xs font-medium mb-1.5', textPrimary)}>Client existant</label>
                        <div className="relative">
                          <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
                          <input
                            value={clientSearch}
                            onChange={e => setClientSearch(e.target.value)}
                            placeholder="Rechercher un client..."
                            className={cn('w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors', inputCls)}
                          />
                        </div>
                        {filteredClients.length > 0 && (
                          <div className={cn('absolute z-10 mt-1 w-full rounded-xl border overflow-hidden max-h-44 overflow-y-auto shadow-lg', isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200')}>
                            {filteredClients.map(c => (
                              <button key={c.id} type="button" onClick={() => pickClient(c)}
                                className={cn('w-full text-left px-3 py-2.5 text-sm transition-colors border-b last:border-0', isDark ? 'hover:bg-zinc-700 border-zinc-700' : 'hover:bg-gray-50 border-gray-100')}>
                                <div className={cn('font-medium', textPrimary)}>{c.name}</div>
                                <div className={cn('text-xs', textSecondary)}>{c.email}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Prénom *" error={errors.firstName} textPrimary={textPrimary}>
                          <FormInput inputCls={inputCls} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jean" />
                        </Field>
                        <Field label="Nom *" error={errors.lastName} textPrimary={textPrimary}>
                          <FormInput inputCls={inputCls} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Dupont" />
                        </Field>
                        <Field label="Email *" error={errors.email} textPrimary={textPrimary}>
                          <FormInput inputCls={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@exemple.fr" />
                        </Field>
                        <Field label="Téléphone" textPrimary={textPrimary}>
                          <FormInput inputCls={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0612345678" />
                        </Field>
                        <div className="col-span-2">
                          <Field label="Société (optionnel)" textPrimary={textPrimary}>
                            <FormInput inputCls={inputCls} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Nom de la société" />
                          </Field>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Réservation */}
                    <div className={cn('border rounded-2xl p-6', card)}>
                      <SectionHeader icon={<Calendar size={16} />} title="Réservation" textPrimary={textPrimary} />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Studio" textPrimary={textPrimary}>
                          <FormSelect inputCls={inputCls} value={form.studio} onChange={e => set('studio', e.target.value)} options={STUDIOS} />
                        </Field>
                        <Field label="Date *" error={errors.date} textPrimary={textPrimary}>
                          <div className="flex gap-2">
                            <FormInput inputCls={inputCls} type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ colorScheme: isDark ? 'dark' : 'light' }} />
                            <DatePicker value={form.date} onChange={v => set('date', v)} isDark={isDark} />
                          </div>
                        </Field>
                        <Field label="Heure de début" textPrimary={textPrimary}>
                          <FormSelect inputCls={inputCls} value={form.startTime} onChange={e => set('startTime', e.target.value)} options={TIMES} />
                        </Field>
                        <Field label="Durée (heures)" textPrimary={textPrimary}>
                          <FormSelect inputCls={inputCls} value={form.duration} onChange={e => set('duration', Number(e.target.value))} options={DURATIONS.map(d => ({ value: d, label: `${d}h` }))} />
                        </Field>
                        <div className="col-span-2">
                          <Field label="Service" textPrimary={textPrimary}>
                            <div className="grid grid-cols-2 gap-2">
                              {SERVICES.map(s => (
                                <button key={s.key} type="button" onClick={() => set('service', s.key)}
                                  className={cn('px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                                    form.service === s.key
                                      ? 'bg-violet-600 border-violet-600 text-white'
                                      : isDark ? 'border-zinc-700 text-zinc-300 hover:border-violet-500' : 'border-gray-300 text-gray-700 hover:border-violet-500'
                                  )}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </Field>
                        </div>
                        <div className="col-span-2">
                          <Field label="Format de tournage" textPrimary={textPrimary}>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { value: 'horizontal', label: '↔ Horizontal (16:9)', sub: 'YouTube · Podcasts' },
                                { value: 'vertical', label: '↕ Vertical (9:16)', sub: 'Instagram · TikTok' },
                              ].map(opt => (
                                <button key={opt.value} type="button" onClick={() => set('format', opt.value)}
                                  className={cn('px-3 py-2.5 rounded-xl text-left text-sm border transition-all',
                                    form.format === opt.value
                                      ? 'bg-violet-600 border-violet-600 text-white'
                                      : isDark ? 'border-zinc-700 text-zinc-300 hover:border-violet-500' : 'border-gray-300 text-gray-700 hover:border-violet-500'
                                  )}>
                                  <div className="font-semibold">{opt.label}</div>
                                  <div className={cn('text-xs mt-0.5', form.format === opt.value ? 'text-violet-200' : textSecondary)}>{opt.sub}</div>
                                </button>
                              ))}
                            </div>
                          </Field>
                        </div>
                        <div className="col-span-2">
                          <label className={cn('block text-xs font-medium mb-2', textPrimary)}>Options</label>
                          <div className="grid grid-cols-2 gap-2">
                            {OPTIONS_LIST.map(opt => (
                              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.options.includes(opt.key)} onChange={() => toggleOption(opt.key)} className="w-4 h-4 rounded accent-violet-600" />
                                <span className={cn('text-sm', textPrimary)}>{opt.label}</span>
                                <span className={cn('text-xs ml-auto', textSecondary)}>+{opt.price} CAD</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Paiement */}
                    <div className={cn('border rounded-2xl p-6', card)}>
                      <SectionHeader icon={<CreditCard size={16} />} title="Paiement" textPrimary={textPrimary} />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Field label="Numéro de carte" textPrimary={textPrimary}>
                            <FormInput inputCls={inputCls} value={form.cardNumber} onChange={e => set('cardNumber', e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} />
                          </Field>
                        </div>
                        <Field label="Expiration" textPrimary={textPrimary}>
                          <FormInput inputCls={inputCls} value={form.cardExpiry} onChange={e => set('cardExpiry', e.target.value)} placeholder="MM/AA" maxLength={5} />
                        </Field>
                        <Field label="CVV" textPrimary={textPrimary}>
                          <FormInput inputCls={inputCls} value={form.cardCvv} onChange={e => set('cardCvv', e.target.value)} placeholder="123" maxLength={4} />
                        </Field>
                        <div className="col-span-2">
                          <Field label="Titulaire" textPrimary={textPrimary}>
                            <FormInput inputCls={inputCls} value={form.cardHolder} onChange={e => set('cardHolder', e.target.value)} placeholder="Prénom Nom" />
                          </Field>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Confirmation email */}
                    <div className={cn('border rounded-2xl p-6', card)}>
                      <SectionHeader icon={<Settings size={16} />} title="Confirmation" textPrimary={textPrimary} />
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={form.sendEmail} onChange={e => set('sendEmail', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
                        <span className={cn('text-sm', textPrimary)}>Envoyer un ticket de confirmation par email</span>
                      </label>
                    </div>
                  </div>

                  {/* Right: Summary */}
                  <div className="lg:w-80 space-y-5">
                    <div className={cn('border rounded-2xl p-6', card)}>
                      <h3 className={cn('font-semibold mb-4', textPrimary)}>Récapitulatif</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={textSecondary}>Service {form.service}</span>
                          <span className={textPrimary}>{serviceRate} CAD/h × {form.duration}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={textSecondary}>Base</span>
                          <span className={textPrimary}>{basePrice} CAD</span>
                        </div>
                        {form.options.map(key => {
                          const opt = OPTIONS_LIST.find(o => o.key === key)
                          return opt ? (
                            <div key={key} className="flex justify-between text-sm">
                              <span className={textSecondary}>{opt.label}</span>
                              <span className={textPrimary}>+{opt.price} CAD</span>
                            </div>
                          ) : null
                        })}
                        <div className={cn('border-t pt-2 mt-2 space-y-1', isDark ? 'border-zinc-700' : 'border-gray-200')}>
                          <div className="flex justify-between text-xs">
                            <span className={textSecondary}>Sous-total HT</span>
                            <span className={textPrimary}>{total} CAD</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={textSecondary}>TPS (5%)</span>
                            <span className={textPrimary}>{formTPS} CAD</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={textSecondary}>TVQ (9.975%)</span>
                            <span className={textPrimary}>{formTVQ} CAD</span>
                          </div>
                          <div className={cn('border-t pt-1 flex justify-between font-bold', isDark ? 'border-zinc-700' : 'border-gray-200')}>
                            <span className={textPrimary}>Total TTC</span>
                            <span className="text-violet-400 text-lg">{totalTTC} CAD</span>
                          </div>
                        </div>
                      </div>
                      {form.date && (
                        <div className={cn('mt-4 p-3 rounded-xl text-sm', isDark ? 'bg-zinc-800' : 'bg-gray-50')}>
                          <div className={cn('font-medium', textPrimary)}>{form.studio}</div>
                          <div className={textSecondary}>{form.date} · {form.startTime} – {calcEndTime(form.startTime, form.duration)}</div>
                        </div>
                      )}
                      <button type="submit" className="w-full mt-5 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                        Valider la réservation
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
