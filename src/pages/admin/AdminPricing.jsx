import React, { useState } from 'react'
import { DollarSign, Edit2, Check, X, RotateCcw, Save } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'

/* ─── Editable price row ─────────────────────────────────────── */
function PriceRow({ item, isDark, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(item.price))

  const card   = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
  const text   = isDark ? 'text-white' : 'text-gray-900'
  const sub    = isDark ? 'text-zinc-400' : 'text-gray-500'
  const input  = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-cyan-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500'

  const handleValidate = () => {
    const v = parseFloat(draft)
    if (isNaN(v) || v < 0) return
    onSave(v)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(String(item.price))
    setEditing(false)
  }

  return (
    <div className={cn('flex items-center justify-between px-5 py-4 border-b last:border-0', isDark ? 'border-zinc-800' : 'border-gray-100')}>
      <span className={cn('text-sm font-medium', text)}>{item.label}</span>
      <div className="flex items-center gap-3">
        {editing ? (
          <>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="1"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className={cn('w-24 px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors', input)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleValidate(); if (e.key === 'Escape') handleCancel() }}
              />
              <span className={cn('text-sm', sub)}>CAD</span>
            </div>
            <button onClick={handleValidate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: '#00BCD4' }}>
              <Check size={13} /> Valider
            </button>
            <button onClick={handleCancel}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors', isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
              <X size={13} /> Annuler
            </button>
          </>
        ) : (
          <>
            <span className={cn('text-sm font-bold tabular-nums', text)}>
              {item.price.toLocaleString('fr-CA')} CAD
            </span>
            <button onClick={() => { setDraft(String(item.price)); setEditing(true) }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors', isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
              <Edit2 size={12} /> Modifier
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Section card ───────────────────────────────────────────── */
function PriceSection({ title, items, isDark, onSave }) {
  const card  = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
  const label = isDark ? 'text-zinc-400' : 'text-gray-500'

  return (
    <div className={cn('border rounded-2xl overflow-hidden', card)}>
      <div className={cn('px-5 py-3.5 border-b text-xs font-bold uppercase tracking-widest', isDark ? 'border-zinc-800 text-zinc-500' : 'border-gray-100 text-gray-400')}>
        {title}
      </div>
      {items.map(item => (
        <PriceRow
          key={item.id}
          item={item}
          isDark={isDark}
          onSave={price => onSave(item.id, price)}
        />
      ))}
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function AdminPricing() {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const [prices, setPricesState] = useState(() => Store.getPrices())
  const [saved, setSaved] = useState(false)

  const text    = isDark ? 'text-white' : 'text-gray-900'
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500'
  const card    = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'

  const updateService = (id, price) => {
    const next = {
      ...prices,
      services: prices.services.map(s => s.id === id ? { ...s, price } : s),
    }
    setPricesState(next)
    Store.setPrices(next)
    flash()
  }

  const updateOption = (id, price) => {
    const next = {
      ...prices,
      options: prices.options.map(o => o.id === id ? { ...o, price } : o),
    }
    setPricesState(next)
    Store.setPrices(next)
    flash()
  }

  const reset = () => {
    const def = Store.getDefaultPrices()
    setPricesState(def)
    Store.resetPrices()
    flash()
  }

  const flash = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const groups = ['Base', 'Live', 'Accompagnement']

  return (
    <Layout navItems={ADMIN_NAV} title="Tarifs">
      <div className="max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className={cn('text-2xl font-bold', text)}>Gestion des tarifs</h2>
            <p className={cn('text-sm mt-1', subtext)}>
              Les modifications sont enregistrées immédiatement et persistent entre les déploiements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#00BCD4' }}>
                <Check size={14} /> Enregistré
              </span>
            )}
            <button onClick={reset}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors', isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
              <RotateCcw size={14} /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Services */}
        <PriceSection
          title="Services (tarif horaire)"
          items={prices.services}
          isDark={isDark}
          onSave={updateService}
        />

        {/* Options by group */}
        {groups.map(group => (
          <PriceSection
            key={group}
            title={`Options — ${group}`}
            items={prices.options.filter(o => o.group === group)}
            isDark={isDark}
            onSave={updateOption}
          />
        ))}

        {/* Info box */}
        <div className={cn('border rounded-2xl p-5', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-blue-50 border-blue-100')}>
          <p className={cn('text-xs leading-relaxed', isDark ? 'text-zinc-500' : 'text-blue-600')}>
            <strong>Note :</strong> Les prix sont sauvegardés dans le navigateur (localStorage) indépendamment des mises à jour du code.
            Pour ancrer définitivement de nouveaux tarifs, mettez également à jour le fichier <code className="font-mono bg-black/10 px-1 rounded">$/prices.json</code> dans le projet.
          </p>
        </div>

      </div>
    </Layout>
  )
}
