import React, { useState } from 'react'
import { X, Check } from 'lucide-react'
import { Store } from '../data/store'
import { cn } from '../utils'
import { useApp } from '../contexts/AppContext'
import DatePicker from './DatePicker'

const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
const DURATIONS = [1,2,3,4,5,6,8,10]

function calcEndTime(start, dur) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + dur * 60
  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`
}

function buildServices() {
  const p = Store.getPrices()
  const pOf = (id, fb) => p.services.find(s => s.id === id)?.price ?? fb
  return [
    { key: 'ARGENT', label: `ARGENT — ${pOf('ARGENT', 221)} CAD/h`, rate: pOf('ARGENT', 221) },
    { key: 'GOLD',   label: `GOLD — ${pOf('GOLD', 587)} CAD/h`,     rate: pOf('GOLD', 587) },
  ]
}

function buildOptions() {
  const p = Store.getPrices()
  const pOf = (id, fb) => p.options.find(o => o.id === id)?.price ?? fb
  return [
    { key: 'Photo',     label: 'Photo',            price: pOf('Photo', 44) },
    { key: 'Short',     label: 'Short vidéo',       price: pOf('Short', 44) },
    { key: 'Miniature', label: 'Miniature',         price: pOf('Miniature', 44) },
    { key: 'Live',      label: 'Live stream',       price: pOf('Live', 662) },
    { key: 'Replay',    label: 'Replay',            price: pOf('Replay', 74) },
    { key: 'CM',        label: 'Community manager', price: pOf('CommunityManager', 147) },
    { key: 'Coaching',  label: 'Coaching',          price: pOf('Coaching', 588) },
  ]
}

/**
 * Modal d'édition d'une réservation.
 * Props :
 *   reservation  – objet réservation à éditer
 *   modifiedBy   – email de l'utilisateur qui modifie
 *   onSave(id, patch) – callback après sauvegarde
 *   onClose()    – fermeture
 */
export default function ReservationEditModal({ reservation, modifiedBy, onSave, onClose }) {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const SERVICES = buildServices()
  const OPTIONS  = buildOptions()

  const [form, setForm] = useState({
    date:      reservation.date       || '',
    startTime: reservation.start_time || '10:00',
    duration:  reservation.duration   || 2,
    service:   reservation.service    || 'ARGENT',
    persons:   reservation.persons    || 1,
    options:   reservation.additional_services || [],
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleOpt = key => set('options', form.options.includes(key)
    ? form.options.filter(o => o !== key)
    : [...form.options, key]
  )

  const svc     = SERVICES.find(s => s.key === form.service) || SERVICES[0]
  const optCost = form.options.reduce((s, k) => s + (OPTIONS.find(o => o.key === k)?.price || 0), 0)
  const total   = svc.rate * Number(form.duration) + optCost

  const handleSave = () => {
    const endTime = calcEndTime(form.startTime, Number(form.duration))
    const patch = {
      date:               form.date,
      start_time:         form.startTime,
      end_time:           endTime,
      duration:           Number(form.duration),
      service:            form.service,
      persons:            Number(form.persons),
      additional_services: form.options,
      price:              total,
      modified_by:        modifiedBy,
    }
    onSave(reservation.id, patch)
    onClose()
  }

  const modalBg  = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-xl'
  const inputCls = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-500'
  const tp = isDark ? 'text-white' : 'text-gray-900'
  const ts = isDark ? 'text-zinc-400' : 'text-gray-500'
  const labelCls = cn('block text-xs font-semibold mb-1', tp)
  const fieldCls = cn('w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors', inputCls)
  const divider  = isDark ? 'border-zinc-800' : 'border-gray-100'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className={cn('w-full max-w-lg border rounded-2xl overflow-hidden', modalBg)}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('flex items-center justify-between px-6 py-4 border-b', divider)}>
          <div>
            <h3 className={cn('font-bold', tp)}>Modifier la réservation</h3>
            <p className={cn('text-xs mt-0.5', ts)}>#{reservation.id} · {reservation.client_name}</p>
          </div>
          <button onClick={onClose} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Date */}
          <div>
            <label className={labelCls}>Date</label>
            <div className="flex gap-2">
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={fieldCls} style={{ colorScheme: isDark ? 'dark' : 'light' }} />
              <DatePicker value={form.date} onChange={v => set('date', v)} isDark={isDark} />
            </div>
          </div>

          {/* Heure + Durée */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Heure de début</label>
              <select value={form.startTime} onChange={e => set('startTime', e.target.value)} className={fieldCls}>
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Durée</label>
              <select value={form.duration} onChange={e => set('duration', Number(e.target.value))} className={fieldCls}>
                {DURATIONS.map(d => <option key={d} value={d}>{d}h</option>)}
              </select>
            </div>
          </div>

          {/* Heure de fin calculée */}
          <p className={cn('text-xs', ts)}>
            Fin prévue : <span className={cn('font-semibold', tp)}>{calcEndTime(form.startTime, Number(form.duration))}</span>
          </p>

          {/* Personnes */}
          <div>
            <label className={labelCls}>Personnes face caméra</label>
            <input type="number" min={1} max={20} value={form.persons} onChange={e => set('persons', Number(e.target.value))} className={fieldCls} />
          </div>

          {/* Formule */}
          <div>
            <label className={labelCls}>Formule</label>
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map(s => (
                <button key={s.key} type="button" onClick={() => set('service', s.key)}
                  className={cn('py-2.5 text-sm font-bold rounded-xl border transition-all',
                    form.service === s.key
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : isDark ? 'border-zinc-700 text-zinc-300 hover:border-violet-500' : 'border-gray-300 text-gray-700 hover:border-violet-400'
                  )}>
                  {s.key}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className={labelCls}>Options</label>
            <div className="space-y-2">
              {OPTIONS.map(opt => (
                <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.options.includes(opt.key)} onChange={() => toggleOpt(opt.key)}
                    className="w-4 h-4 accent-violet-600" />
                  <span className={cn('text-sm flex-1', tp)}>{opt.label}</span>
                  <span className={cn('text-xs', ts)}>+{opt.price} CAD</span>
                </label>
              ))}
            </div>
          </div>

          {/* Récap prix */}
          <div className={cn('rounded-xl p-3 border', isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-200')}>
            <div className="flex justify-between text-sm">
              <span className={ts}>Base ({svc.key} · {form.duration}h)</span>
              <span className={tp}>{svc.rate * Number(form.duration)} CAD</span>
            </div>
            {optCost > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className={ts}>Options</span>
                <span className={tp}>+{optCost} CAD</span>
              </div>
            )}
            <div className={cn('flex justify-between font-bold text-base mt-2 pt-2 border-t', divider)}>
              <span className={tp}>Total</span>
              <span className="text-violet-400">{total} CAD</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn('flex gap-3 px-6 py-4 border-t', divider)}>
          <button onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            <Check size={15} /> Enregistrer
          </button>
          <button onClick={onClose}
            className={cn('flex-1 border rounded-xl py-2.5 text-sm font-medium transition-colors',
              isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
