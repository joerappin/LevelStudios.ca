import React, { useState } from 'react'
import { CheckCircle, CreditCard, User, Calendar, Settings } from 'lucide-react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'

const STUDIOS = ['Studio A', 'Studio B', 'Studio C']
const SERVICES = [
  { key: 'ARGENT', label: 'ARGENT — 221 CAD/h', rate: 221 },
  { key: 'GOLD', label: 'GOLD — 587 CAD/h', rate: 587 },
]
const OPTIONS_LIST = [
  { key: 'Photo', label: 'Photo', price: 44 },
  { key: 'Short', label: 'Short vidéo', price: 44 },
  { key: 'Miniature', label: 'Miniature', price: 44 },
  { key: 'Live', label: 'Live stream', price: 662 },
  { key: 'Replay', label: 'Replay', price: 74 },
  { key: 'CM', label: 'Community manager', price: 147 },
  { key: 'Coaching', label: 'Coaching', price: 588 },
]

const DURATIONS = [1, 2, 3, 4, 5, 6, 8, 10]
const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', company: '',
  studio: 'Studio A', date: '', startTime: '10:00', duration: 2,
  service: 'ARGENT', options: [],
  cardNumber: '', cardExpiry: '', cardCvv: '', cardHolder: '',
  sendEmail: true,
}

export default function ChefManual() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(null)

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-500'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function toggleOption(key) {
    setForm(f => ({
      ...f,
      options: f.options.includes(key) ? f.options.filter(o => o !== key) : [...f.options, key]
    }))
  }

  const serviceRate = SERVICES.find(s => s.key === form.service)?.rate || 221
  const basePrice = serviceRate * Number(form.duration)
  const optionsPrice = form.options.reduce((sum, key) => {
    const opt = OPTIONS_LIST.find(o => o.key === key)
    return sum + (opt?.price || 0)
  }, 0)
  const total = basePrice + optionsPrice

  function calcEndTime(start, dur) {
    const [h, m] = start.split(':').map(Number)
    const totalMin = h * 60 + m + dur * 60
    return `${String(Math.floor(totalMin / 60) % 24).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
  }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Requis'
    if (!form.lastName.trim()) e.lastName = 'Requis'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide'
    if (!form.date) e.date = 'Requis'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    const endTime = calcEndTime(form.startTime, form.duration)
    const res = Store.addReservation({
      client_name: `${form.firstName} ${form.lastName}`,
      client_email: form.email,
      client_phone: form.phone,
      company: form.company,
      studio: form.studio,
      service: form.service,
      date: form.date,
      start_time: form.startTime,
      end_time: endTime,
      duration: Number(form.duration),
      price: total,
      status: 'validee',
      additional_services: form.options,
      promo_code: null,
      manual: true,
    })
    setSuccess(res)
    setForm(emptyForm)
  }

  const SectionHeader = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
        {icon}
      </div>
      <h3 className={cn('font-semibold', textPrimary)}>{title}</h3>
    </div>
  )

  const Field = ({ label, error, children }) => (
    <div>
      <label className={cn('block text-xs font-medium mb-1.5', textPrimary)}>{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )

  const Input = ({ ...props }) => (
    <input
      className={cn('w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors', inputClass)}
      {...props}
    />
  )

  const Select = ({ value, onChange, options, ...props }) => (
    <select
      value={value}
      onChange={onChange}
      className={cn('w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors', inputClass)}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
      ))}
    </select>
  )

  if (success) {
    return (
      <Layout navItems={CHEF_NAV} title="Réservation manuelle">
        <div className="max-w-lg mx-auto">
          <div className={cn('border rounded-2xl p-8 text-center space-y-4', card)}>
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className={cn('font-bold text-xl mb-1', textPrimary)}>Réservation créée !</h3>
              <p className={cn('text-sm', textSecondary)}>La réservation a été enregistrée avec succès.</p>
            </div>
            <div className={cn('text-sm font-mono p-3 rounded-xl', isDark ? 'bg-zinc-800' : 'bg-gray-100', textSecondary)}>
              ID : <span className={cn('font-bold', textPrimary)}>{success.id}</span>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Nouvelle réservation
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout navItems={CHEF_NAV} title="Réservation manuelle">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: form sections */}
          <div className="flex-1 space-y-5">
            {/* Section 1: Client info */}
            <div className={cn('border rounded-2xl p-6', card)}>
              <SectionHeader icon={<User size={16} />} title="Informations client" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prénom *" error={errors.firstName}>
                  <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jean" />
                </Field>
                <Field label="Nom *" error={errors.lastName}>
                  <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Dupont" />
                </Field>
                <Field label="Email *" error={errors.email}>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@exemple.fr" />
                </Field>
                <Field label="Téléphone">
                  <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0612345678" />
                </Field>
                <div className="col-span-2">
                  <Field label="Société (optionnel)">
                    <Input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Nom de la société" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Section 2: Réservation */}
            <div className={cn('border rounded-2xl p-6', card)}>
              <SectionHeader icon={<Calendar size={16} />} title="Réservation" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Studio">
                  <Select value={form.studio} onChange={e => set('studio', e.target.value)} options={STUDIOS} />
                </Field>
                <Field label="Date *" error={errors.date}>
                  <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </Field>
                <Field label="Heure de début">
                  <Select value={form.startTime} onChange={e => set('startTime', e.target.value)} options={TIMES} />
                </Field>
                <Field label="Durée (heures)">
                  <Select value={form.duration} onChange={e => set('duration', Number(e.target.value))} options={DURATIONS.map(d => ({ value: d, label: `${d}h` }))} />
                </Field>
                <div className="col-span-2">
                  <Field label="Service">
                    <div className="grid grid-cols-2 gap-2">
                      {SERVICES.map(s => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => set('service', s.key)}
                          className={cn('px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                            form.service === s.key
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : isDark ? 'border-zinc-700 text-zinc-300 hover:border-violet-500' : 'border-gray-300 text-gray-700 hover:border-violet-500'
                          )}
                        >
                          {s.label}
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
                        <input
                          type="checkbox"
                          checked={form.options.includes(opt.key)}
                          onChange={() => toggleOption(opt.key)}
                          className="w-4 h-4 rounded accent-violet-600"
                        />
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
              <SectionHeader icon={<CreditCard size={16} />} title="Paiement" />
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Numéro de carte">
                    <Input value={form.cardNumber} onChange={e => set('cardNumber', e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} />
                  </Field>
                </div>
                <Field label="Expiration">
                  <Input value={form.cardExpiry} onChange={e => set('cardExpiry', e.target.value)} placeholder="MM/AA" maxLength={5} />
                </Field>
                <Field label="CVV">
                  <Input value={form.cardCvv} onChange={e => set('cardCvv', e.target.value)} placeholder="123" maxLength={4} />
                </Field>
                <div className="col-span-2">
                  <Field label="Titulaire">
                    <Input value={form.cardHolder} onChange={e => set('cardHolder', e.target.value)} placeholder="Prénom Nom" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Section 4: Email */}
            <div className={cn('border rounded-2xl p-6', card)}>
              <SectionHeader icon={<Settings size={16} />} title="Confirmation" />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendEmail}
                  onChange={e => set('sendEmail', e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600"
                />
                <span className={cn('text-sm', textPrimary)}>Envoyer un ticket de confirmation par email</span>
              </label>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:w-80 space-y-5">
            <div className={cn('border rounded-2xl p-6 sticky top-20', card)}>
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
                <div className={cn('border-t pt-2 mt-2 flex justify-between font-bold', isDark ? 'border-zinc-700' : 'border-gray-200')}>
                  <span className={textPrimary}>Total</span>
                  <span className="text-violet-400 text-lg">{total} CAD</span>
                </div>
              </div>
              {form.date && (
                <div className={cn('mt-4 p-3 rounded-xl text-sm', isDark ? 'bg-zinc-800' : 'bg-gray-50')}>
                  <div className={cn('font-medium', textPrimary)}>{form.studio}</div>
                  <div className={textSecondary}>{form.date} · {form.startTime} – {calcEndTime(form.startTime, form.duration)}</div>
                </div>
              )}
              <button
                type="submit"
                className="w-full mt-5 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Valider la réservation
              </button>
            </div>
          </div>
        </div>
      </form>
    </Layout>
  )
}
