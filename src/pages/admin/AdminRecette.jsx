import React, { useState, useEffect, useMemo } from 'react'
import { useReservations } from '../../hooks/useReservations'
import {
  Receipt, TrendingUp, ChevronLeft, ChevronRight,
  RotateCcw, Tag, BarChart2, Building2, CalendarDays,
  CheckCircle2, CreditCard, FileText, Plus, X, Check,
  Pencil, Trash2, ArrowRight, Save, Download, Eye,
} from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { formatPrice } from '../../utils'

const PAID = ['validee', 'livree', 'tournee', 'post-prod']
const SKIP = ['annulee']
const STUDIOS = ['Studio A', 'Studio B', 'Studio C']
const STUDIO_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500']
const STUDIO_TEXT   = ['text-violet-400', 'text-blue-400', 'text-emerald-400']
const STUDIO_BG     = ['bg-violet-500/10', 'bg-blue-500/10', 'bg-emerald-500/10']
const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const DAYS_FR   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const TPS_RATE  = 0.05
const TVQ_RATE  = 0.09975
const round2    = v => Math.round(v * 100) / 100

const FORMULES = [
  { key: 'BRONZE', label: 'BRONZE', hourlyRate: 149 },
  { key: 'ARGENT', label: 'ARGENT', hourlyRate: 199 },
  { key: 'OR',     label: 'OR',     hourlyRate: 499 },
]
const OPTIONS_LIST = [
  { key: 'photo',    label: 'Photo',             price: 44 },
  { key: 'short',    label: 'Short vidéo',        price: 44 },
  { key: 'miniature',label: 'Miniature',          price: 44 },
  { key: 'live',     label: 'Live stream',        price: 662 },
  { key: 'briefing', label: 'Briefing live',      price: 118 },
  { key: 'replay',   label: 'Replay',             price: 74 },
  { key: 'cm',       label: 'Community manager',  price: 147 },
  { key: 'coaching', label: 'Coaching',           price: 588 },
]

const INV_STATUS = {
  paid:   { label: 'Payée',    cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
  unpaid: { label: 'À payer',  cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
}
const DEV_STATUS = {
  draft:    { label: 'Brouillon', cls: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/25' },
  sent:     { label: 'Envoyé',    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  accepted: { label: 'Accepté',   cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
  refused:  { label: 'Refusé',    cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
}

function getMonday(d) {
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return monday
}
function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data, isDark, textSecondary }) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-0.5 h-36 w-full">
      {data.map((d, i) => {
        const pct = Math.max(2, (d.value / maxVal) * 100)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            {d.value > 0 && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-zinc-800 text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-lg">
                {formatPrice(d.value)}
              </div>
            )}
            <div className={`w-full rounded-t transition-all ${d.value > 0 ? 'bg-violet-500/80 hover:bg-violet-500' : isDark ? 'bg-zinc-800' : 'bg-gray-100'}`} style={{ height: `${pct}%` }} />
            <span className={`text-[8px] truncate w-full text-center leading-tight ${textSecondary}`}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, icon, color, card, textPrimary, textSecondary }) {
  return (
    <div className={`border rounded-2xl p-5 ${card}`}>
      <div className={`flex items-center gap-2 mb-2 text-xs font-semibold ${textSecondary}`}><span className={color}>{icon}</span>{label}</div>
      <div className={`text-2xl font-black ${textPrimary}`}>{value}</div>
    </div>
  )
}

// ─── Invoice preview (module-level — safe) ───────────────────────────────────
function InvoicePreview({ invoice, template, isDark }) {
  const tp = isDark ? 'text-white' : 'text-gray-900'
  const ts = isDark ? 'text-zinc-400' : 'text-gray-500'
  const bg = isDark ? 'bg-zinc-800' : 'bg-white'
  const border = isDark ? 'border-zinc-700' : 'border-gray-200'
  const sectionBg = isDark ? 'bg-zinc-900' : 'bg-gray-50'
  const items = invoice?.items || [{ description: 'Session ARGENT 2h', qty: 1, unitPrice: 398 }]
  const totalHT = items.reduce((s, i) => s + (i.qty || 1) * (i.unitPrice || 0), 0)
  const tps = round2(totalHT * TPS_RATE)
  const tvq = round2(totalHT * TVQ_RATE)
  const ttc = round2(totalHT + tps + tvq)
  const hasPrestation = invoice?.formule || invoice?.nbPersonnes || invoice?.selectedOptions?.length > 0
  const optLabels = (invoice?.selectedOptions || []).map(k => OPTIONS_LIST.find(o => o.key === k)?.label).filter(Boolean)
  return (
    <div className={`border rounded-2xl p-6 text-sm ${bg} ${border}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="font-black text-xl text-violet-500 mb-1">{template?.company || 'Level Studios'}</div>
          <div className={`text-xs space-y-0.5 ${ts}`}>
            {template?.address && <div>{template.address}</div>}
            {template?.email && <div>{template.email}</div>}
            {template?.phone && <div>{template.phone}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black mb-1 ${tp}`}>{invoice?.type === 'quote' ? 'DEVIS' : 'FACTURE'}</div>
          <div className={`text-xs ${ts}`}>N° {invoice?.id || 'FAC-2024-001'}</div>
          <div className={`text-xs ${ts}`}>Date : {invoice?.date || new Date().toISOString().split('T')[0]}</div>
          {invoice?.dueDate && <div className={`text-xs ${ts}`}>Échéance : {invoice.dueDate}</div>}
          {invoice?.validUntil && <div className={`text-xs ${ts}`}>Valide jusqu'au : {invoice.validUntil}</div>}
        </div>
      </div>

      {/* Client */}
      <div className={`rounded-xl p-3 mb-4 ${sectionBg}`}>
        <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${ts}`}>Facturer à</div>
        <div className={`font-semibold ${tp}`}>{invoice?.clientName || 'Nom du client'}</div>
        {invoice?.clientCompany && <div className={`text-xs ${ts}`}>{invoice.clientCompany}</div>}
        {invoice?.clientEmail && <div className={`text-xs ${ts}`}>{invoice.clientEmail}</div>}
      </div>

      {/* Prestation details */}
      {hasPrestation && (
        <div className={`rounded-xl p-3 mb-4 border ${border}`}>
          <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${ts}`}>Détails de la prestation</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {invoice.formule && (
              <div>
                <div className={`${ts} mb-0.5`}>Formule</div>
                <div className={`font-bold text-violet-400`}>{invoice.formule}</div>
              </div>
            )}
            {invoice.heures && (
              <div>
                <div className={`${ts} mb-0.5`}>Durée</div>
                <div className={`font-semibold ${tp}`}>{invoice.heures}h</div>
              </div>
            )}
            {invoice.nbPersonnes && (
              <div>
                <div className={`${ts} mb-0.5`}>Personnes</div>
                <div className={`font-semibold ${tp}`}>{invoice.nbPersonnes}</div>
              </div>
            )}
          </div>
          {optLabels.length > 0 && (
            <div className={`mt-2 pt-2 border-t ${border} text-xs`}>
              <span className={ts}>Options incluses : </span>
              <span className={`font-semibold ${tp}`}>{optLabels.join(' · ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Line items */}
      <table className="w-full text-xs mb-4">
        <thead>
          <tr className={`border-b ${border}`}>
            <th className={`text-left py-2 ${ts}`}>Description</th>
            <th className={`text-right py-2 ${ts}`}>Qté</th>
            <th className={`text-right py-2 ${ts}`}>Prix unit.</th>
            <th className={`text-right py-2 ${ts}`}>Total HT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={`border-b ${border}`}>
              <td className={`py-2 ${tp}`}>{item.description}</td>
              <td className={`py-2 text-right ${tp}`}>{item.qty || 1}</td>
              <td className={`py-2 text-right ${tp}`}>{item.unitPrice} CAD</td>
              <td className={`py-2 text-right font-semibold ${tp}`}>{(item.qty || 1) * item.unitPrice} CAD</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-5">
        <div className="w-48 space-y-1 text-xs">
          <div className={`flex justify-between ${ts}`}><span>Sous-total HT</span><span>{totalHT} CAD</span></div>
          <div className={`flex justify-between ${ts}`}><span>TPS (5%)</span><span>{tps} CAD</span></div>
          <div className={`flex justify-between ${ts}`}><span>TVQ (9.975%)</span><span>{tvq} CAD</span></div>
          <div className={`flex justify-between font-bold border-t pt-1 ${border} ${tp}`}><span>Total TTC</span><span className="text-violet-500">{ttc} CAD</span></div>
        </div>
      </div>

      {/* Footer */}
      {(template?.paymentTerms || template?.bankInfo || template?.footer || invoice?.quoteDate) && (
        <div className={`border-t pt-4 text-xs space-y-1 ${border} ${ts}`}>
          {template?.paymentTerms && <div><span className="font-semibold">Conditions : </span>{template.paymentTerms}</div>}
          {template?.bankInfo && <div><span className="font-semibold">Banque : </span>{template.bankInfo}</div>}
          {template?.tps && <div>N° TPS : {template.tps}</div>}
          {template?.tvq && <div>N° TVQ : {template.tvq}</div>}
          {template?.footer && <div className="mt-2 italic">{template.footer}</div>}
          {invoice?.quoteDate && <div className="mt-2 text-zinc-500">Édition du devis : {invoice.quoteDate}</div>}
        </div>
      )}
    </div>
  )
}

// ─── Invoice table — module-level so React never remounts it ─────────────────
function InvTable({ list, isDark, textPrimary, textSecondary, tableHead, tableRow, onEdit, onMarkPaid, onDelete, onDownload, onPreview }) {
  if (list.length === 0) return <p className={`text-sm text-center py-10 ${textSecondary}`}>Aucune facture</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b text-xs font-semibold ${tableHead}`}>
            <th className="text-left px-4 py-3">N°</th>
            <th className="text-left px-4 py-3">Client</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">Date</th>
            <th className="text-right px-4 py-3">Montant TTC</th>
            <th className="text-left px-4 py-3">Statut</th>
            <th className="text-left px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(inv => {
            const st = INV_STATUS[inv.status] || INV_STATUS.unpaid
            return (
              <tr key={inv.id} className={`border-b transition-colors ${tableRow}`}>
                <td className={`px-4 py-3 font-mono text-xs ${textSecondary}`}>{inv.id}</td>
                <td className="px-4 py-3">
                  <div className={`font-medium ${textPrimary}`}>{inv.clientName}</div>
                  {inv.clientEmail && <div className={`text-xs ${textSecondary}`}>{inv.clientEmail}</div>}
                </td>
                <td className={`px-4 py-3 hidden sm:table-cell ${textSecondary} text-xs`}>{inv.date}</td>
                <td className={`px-4 py-3 text-right font-bold ${textPrimary}`}>{formatPrice(inv.totalTTC)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${st.cls}`}>{st.label}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => onPreview(inv)} title="Visualiser" className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-colors"><Eye size={12} /></button>
                    <button onClick={() => onDownload(inv)} title="Télécharger" className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"><Download size={12} /></button>
                    {!inv.source && (
                      <>
                        <button onClick={() => onEdit(inv)} title="Modifier" className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-colors"><Pencil size={12} /></button>
                        {inv.status === 'unpaid' && (
                          <button onClick={() => onMarkPaid(inv.id)} title="Marquer payée" className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"><Check size={12} /></button>
                        )}
                        <button onClick={() => onDelete(inv.id)} title="Supprimer" className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Invoice / Quote modal — module-level so inputs never lose focus ──────────
function InvoiceModal({
  type, onClose, onSave,
  form, onFieldChange, onItemChange, onAddItem, onRemoveItem,
  isEditing, template,
  isDark, textPrimary, textSecondary, inputCls, divider,
}) {
  const totalHT = form.items.reduce((s, i) => s + (Number(i.qty) || 1) * (Number(i.unitPrice) || 0), 0)
  const tps = round2(totalHT * TPS_RATE)
  const tvq = round2(totalHT * TVQ_RATE)
  const ttc = round2(totalHT + tps + tvq)
  const sectionBg = isDark ? 'bg-zinc-800/60' : 'bg-gray-50'

  const fields = [
    { label: 'Nom client',   key: 'clientName',   placeholder: 'Jean Dupont' },
    { label: 'Email client', key: 'clientEmail',   placeholder: 'jean@mail.com' },
    { label: 'Société',      key: 'clientCompany', placeholder: 'Nom société' },
    { label: 'Date',         key: 'date',          type: 'date' },
    type === 'quote'
      ? { label: "Valide jusqu'au", key: 'validUntil', type: 'date' }
      : { label: 'Échéance',        key: 'dueDate',    type: 'date' },
    type === 'invoice'
      ? { label: 'Statut', key: 'status', type: 'select', options: [{ value: 'unpaid', label: 'À payer' }, { value: 'paid', label: 'Payée' }] }
      : null,
  ].filter(Boolean)

  function importItems() {
    const f = FORMULES.find(f => f.key === form.formule)
    const newItems = []
    if (f && form.heures) newItems.push({ description: `Session ${f.label} — ${form.heures}h`, qty: 1, unitPrice: f.hourlyRate * Number(form.heures) })
    ;(form.selectedOptions || []).forEach(k => {
      const opt = OPTIONS_LIST.find(o => o.key === k)
      if (opt) newItems.push({ description: opt.label, qty: 1, unitPrice: opt.price })
    })
    if (newItems.length) onFieldChange('items', newItems)
  }

  function toggleOption(key) {
    const cur = form.selectedOptions || []
    onFieldChange('selectedOptions', cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key])
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200 shadow-xl'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
          <h3 className={`font-bold text-lg ${textPrimary}`}>
            {isEditing ? 'Modifier' : 'Nouveau'} {type === 'quote' ? 'devis' : 'facture'}
          </h3>
          <button onClick={onClose} className={textSecondary}><X size={20} /></button>
        </div>

        <div className="p-6 grid lg:grid-cols-2 gap-6">
          {/* ── Form ── */}
          <div className="space-y-4">

            {/* Client fields */}
            <div className="grid grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={form[f.key]} onChange={e => onFieldChange(f.key, e.target.value)} className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${inputCls}`}>
                      {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => onFieldChange(f.key, e.target.value)} placeholder={f.placeholder}
                      className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${inputCls}`} style={{ colorScheme: isDark ? 'dark' : 'light' }} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Prestation ── */}
            <div className={`rounded-xl p-4 space-y-3 ${sectionBg}`}>
              <div className={`text-xs font-bold uppercase tracking-wide ${textSecondary}`}>Prestation</div>

              {/* Formule */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>Formule</label>
                <div className="flex gap-2">
                  {FORMULES.map(f => (
                    <button key={f.key} type="button" onClick={() => onFieldChange('formule', form.formule === f.key ? '' : f.key)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.formule === f.key ? 'bg-violet-600 border-violet-600 text-white' : isDark ? 'border-zinc-700 text-zinc-400 hover:border-violet-500 hover:text-violet-400' : 'border-gray-300 text-gray-500 hover:border-violet-400 hover:text-violet-600'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heures + Nb personnes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Heures</label>
                  <input type="number" min={0.5} step={0.5} value={form.heures || ''} onChange={e => onFieldChange('heures', e.target.value)} placeholder="2"
                    className={`w-full px-3 py-1.5 text-sm rounded-xl border focus:outline-none focus:ring-2 ${inputCls}`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Nb de personnes</label>
                  <input type="number" min={1} value={form.nbPersonnes || ''} onChange={e => onFieldChange('nbPersonnes', e.target.value)} placeholder="1"
                    className={`w-full px-3 py-1.5 text-sm rounded-xl border focus:outline-none focus:ring-2 ${inputCls}`} />
                </div>
              </div>

              {/* Options */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>Options</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {OPTIONS_LIST.map(opt => {
                    const selected = (form.selectedOptions || []).includes(opt.key)
                    return (
                      <button key={opt.key} type="button" onClick={() => toggleOption(opt.key)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition-all text-left ${selected ? 'bg-violet-600/20 border-violet-500 text-violet-400' : isDark ? 'border-zinc-700 text-zinc-400 hover:border-zinc-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <span>{opt.label}</span>
                        <span className={selected ? 'text-violet-400' : textSecondary}>{opt.price} $</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Import button */}
              <button type="button" onClick={importItems}
                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${isDark ? 'border-violet-500/50 text-violet-400 hover:bg-violet-500/10' : 'border-violet-400 text-violet-600 hover:bg-violet-50'}`}>
                <ArrowRight size={12} /> Importer dans les lignes
              </button>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-bold uppercase tracking-wide ${textSecondary}`}>Lignes</label>
                <button onClick={onAddItem} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                  <Plus size={12} /> Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input value={item.description} onChange={e => onItemChange(i, 'description', e.target.value)} placeholder="Description"
                      className={`flex-1 px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none ${inputCls}`} />
                    <input type="number" value={item.qty} onChange={e => onItemChange(i, 'qty', e.target.value)}
                      className={`w-14 px-2 py-1.5 text-xs rounded-lg border focus:outline-none text-center ${inputCls}`} min={1} />
                    <input type="number" value={item.unitPrice} onChange={e => onItemChange(i, 'unitPrice', e.target.value)} placeholder="Prix"
                      className={`w-20 px-2 py-1.5 text-xs rounded-lg border focus:outline-none ${inputCls}`} />
                    {form.items.length > 1 && (
                      <button onClick={() => onRemoveItem(i)} className="text-red-400 hover:text-red-300 mt-1"><X size={12} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Notes</label>
              <textarea value={form.notes || ''} onChange={e => onFieldChange('notes', e.target.value)} rows={2}
                className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 resize-none ${inputCls}`}
                placeholder="Notes ou conditions particulières..." />
            </div>

            {/* Totals */}
            <div className={`rounded-xl p-4 space-y-1 text-sm ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
              <div className={`flex justify-between ${textSecondary}`}><span>Sous-total HT</span><span>{totalHT} CAD</span></div>
              <div className={`flex justify-between ${textSecondary}`}><span>TPS 5%</span><span>{tps} CAD</span></div>
              <div className={`flex justify-between ${textSecondary}`}><span>TVQ 9.975%</span><span>{tvq} CAD</span></div>
              <div className={`flex justify-between font-bold text-base border-t pt-2 ${divider} ${textPrimary}`}><span>Total TTC</span><span className="text-violet-400">{ttc} CAD</span></div>
            </div>

            <button onClick={() => onSave(totalHT, ttc)}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              <Save size={14} /> Enregistrer
            </button>
          </div>

          {/* ── Preview ── */}
          <div>
            <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${textSecondary}`}>Aperçu</p>
            <InvoicePreview
              invoice={{ ...form, type, id: isEditing?.id || (type === 'quote' ? 'DEV-2024-001' : 'FAC-2024-001') }}
              template={template}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Preview modal — module-level ─────────────────────────────────────────────
function PreviewModal({ doc, template, isDark, onClose, onDownload }) {
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const isQuote = doc.type === 'quote'
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200 shadow-xl'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-violet-400" />
            <h3 className={`font-bold ${textPrimary}`}>{isQuote ? 'Aperçu devis' : 'Aperçu facture'} — {doc.id}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(doc)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-colors"
            >
              <Download size={13} /> Télécharger
            </button>
            <button onClick={onClose} className={textSecondary}><X size={20} /></button>
          </div>
        </div>
        <div className="p-6">
          <InvoicePreview invoice={doc} template={template} isDark={isDark} />
        </div>
      </div>
    </div>
  )
}

// ─── Print / download (format lettre 8.5×11") ────────────────────────────────
function downloadDocument(doc, template) {
  const items = doc.items || []
  const totalHT = items.reduce((s, i) => s + (Number(i.qty) || 1) * (Number(i.unitPrice) || 0), 0)
  const tps = round2(totalHT * TPS_RATE)
  const tvq = round2(totalHT * TVQ_RATE)
  const ttc = round2(totalHT + tps + tvq)
  const isQuote = doc.type === 'quote'
  const optLabels = (doc.selectedOptions || []).map(k => OPTIONS_LIST.find(o => o.key === k)?.label).filter(Boolean)
  const hasPrestation = doc.formule || doc.nbPersonnes || optLabels.length > 0

  const prestationBlock = hasPrestation ? `
<div class="prestation">
  <div class="lbl">Détails de la prestation</div>
  <div class="prow">
    ${doc.formule ? `<div class="pcell"><div class="plbl">Formule</div><div class="pval" style="color:#7c3aed;font-weight:900">${doc.formule}</div></div>` : ''}
    ${doc.heures  ? `<div class="pcell"><div class="plbl">Durée</div><div class="pval">${doc.heures}h</div></div>` : ''}
    ${doc.nbPersonnes ? `<div class="pcell"><div class="plbl">Personnes</div><div class="pval">${doc.nbPersonnes}</div></div>` : ''}
  </div>
  ${optLabels.length ? `<div class="popts"><span style="color:#888">Options incluses : </span><strong>${optLabels.join(' · ')}</strong></div>` : ''}
</div>` : ''

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>${isQuote ? 'Devis' : 'Facture'} ${doc.id || ''}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:215.9mm;background:#fff}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#111;font-size:12px;padding:18mm 20mm}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:18px;border-bottom:3px solid #7c3aed}
.co{font-size:20px;font-weight:900;color:#7c3aed;margin-bottom:5px;letter-spacing:-.3px}
.meta{color:#555;font-size:11px;line-height:1.7}
.doc-title{font-size:26px;font-weight:900;text-align:right;color:#111;letter-spacing:-1px}
.doc-ref{text-align:right;color:#666;font-size:11px;margin-top:5px;line-height:1.8}
.client-box{background:#f7f7f7;border-radius:8px;padding:12px 16px;margin-bottom:16px}
.prestation{border:1px solid #e8e8e8;border-radius:8px;padding:12px 16px;margin-bottom:16px}
.lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#999;margin-bottom:6px}
.cn{font-size:13px;font-weight:700}.cs{font-size:11px;color:#666;margin-top:2px}
.prow{display:flex;gap:24px}
.pcell{min-width:80px}
.plbl{font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#aaa;margin-bottom:2px}
.pval{font-size:13px;font-weight:600}
.popts{margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:11px;color:#555}
table{width:100%;border-collapse:collapse;margin-bottom:18px}
thead th{background:#f7f7f7;padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#666}
thead th:not(:first-child){text-align:right}
tbody td{padding:9px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
tbody td:not(:first-child){text-align:right}
.totals{display:flex;justify-content:flex-end;margin-bottom:24px}
.ti{width:210px}
.tr{display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:#666}
.tr.tot{border-top:2px solid #222;margin-top:6px;padding-top:8px;font-weight:900;font-size:14px;color:#111}
.tr.tot span:last-child{color:#7c3aed}
.foot{border-top:1px solid #ddd;padding-top:14px;font-size:10px;color:#777;line-height:2}
.foot strong{font-weight:700;color:#555}
.watermark{position:fixed;bottom:18mm;right:20mm;font-size:9px;color:#ccc;font-style:italic}
@media print{
  html,body{width:215.9mm}
  @page{size:letter;margin:0}
  body{padding:18mm 20mm}
  .watermark{position:fixed}
}
</style></head><body>
<div class="header">
  <div>
    <div class="co">${template?.company || 'Level Studios'}</div>
    <div class="meta">${[template?.address, template?.email, template?.phone, template?.website].filter(Boolean).map(v => `<div>${v}</div>`).join('')}</div>
  </div>
  <div>
    <div class="doc-title">${isQuote ? 'DEVIS' : 'FACTURE'}</div>
    <div class="doc-ref">
      <div><strong>N°</strong> ${doc.id || ''}</div>
      <div>Date : ${doc.date || ''}</div>
      ${doc.dueDate   ? `<div>Échéance : ${doc.dueDate}</div>` : ''}
      ${doc.validUntil? `<div>Valide jusqu'au : ${doc.validUntil}</div>` : ''}
    </div>
  </div>
</div>
<div class="client-box">
  <div class="lbl">Facturer à</div>
  <div class="cn">${doc.clientName || ''}</div>
  ${doc.clientCompany ? `<div class="cs">${doc.clientCompany}</div>` : ''}
  ${doc.clientEmail   ? `<div class="cs">${doc.clientEmail}</div>` : ''}
</div>
${prestationBlock}
<table>
  <thead><tr><th style="width:55%">Description</th><th>Qté</th><th>Prix unit.</th><th>Total HT</th></tr></thead>
  <tbody>${items.map(it => `<tr><td>${it.description || ''}</td><td>${it.qty || 1}</td><td>${it.unitPrice} CAD</td><td><strong>${(it.qty || 1) * it.unitPrice} CAD</strong></td></tr>`).join('')}</tbody>
</table>
<div class="totals"><div class="ti">
  <div class="tr"><span>Sous-total HT</span><span>${totalHT} CAD</span></div>
  <div class="tr"><span>TPS (5%)</span><span>${tps} CAD</span></div>
  <div class="tr"><span>TVQ (9.975%)</span><span>${tvq} CAD</span></div>
  <div class="tr tot"><span>Total TTC</span><span>${ttc} CAD</span></div>
</div></div>
<div class="foot">
  ${template?.paymentTerms ? `<div><strong>Conditions :</strong> ${template.paymentTerms}</div>` : ''}
  ${template?.bankInfo     ? `<div><strong>Banque :</strong> ${template.bankInfo}</div>` : ''}
  ${template?.tps          ? `<div>N° TPS : ${template.tps}</div>` : ''}
  ${template?.tvq          ? `<div>N° TVQ : ${template.tvq}</div>` : ''}
  ${doc.quoteDate          ? `<div style="margin-top:8px;color:#aaa">Édition du devis : ${doc.quoteDate}</div>` : ''}
  ${doc.notes              ? `<div style="margin-top:6px"><em>${doc.notes}</em></div>` : ''}
  ${template?.footer       ? `<div style="margin-top:6px"><em>${template.footer}</em></div>` : ''}
</div>
<div class="watermark">${template?.company || 'Level Studios'} — ${doc.id || ''}</div>
</body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}

// ─── Default form shapes ──────────────────────────────────────────────────────
const emptyInvoiceForm = {
  clientName: '', clientEmail: '', clientCompany: '', clientAddress: '',
  date: new Date().toISOString().split('T')[0], dueDate: '',
  items: [{ description: '', qty: 1, unitPrice: 0 }],
  notes: '', status: 'unpaid', type: 'invoice',
  formule: '', heures: '', nbPersonnes: '', selectedOptions: [],
}
const emptyDevisForm = {
  clientName: '', clientEmail: '', clientCompany: '',
  date: new Date().toISOString().split('T')[0], validUntil: '',
  items: [{ description: '', qty: 1, unitPrice: 0 }],
  notes: '', status: 'draft', type: 'quote',
  formule: '', heures: '', nbPersonnes: '', selectedOptions: [],
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminRecette() {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const { reservations: allRes } = useReservations({ interval: 60000 })
  const [trashedEmails, setTrashedEmails] = useState(new Set())
  const [period, setPeriod] = useState('year')
  const [chartYear, setChartYear] = useState(new Date().getFullYear())
  const [chartMonth, setChartMonth] = useState(new Date().getMonth())

  const [mainTab, setMainTab] = useState('recette')

  // Factures state
  const [invoices, setInvoices] = useState([])
  const [invSubTab, setInvSubTab] = useState('unpaid')
  const [showInvModal, setShowInvModal] = useState(false)
  const [editingInv, setEditingInv] = useState(null)
  const [invForm, setInvForm] = useState(emptyInvoiceForm)
  const [template, setTemplate] = useState(() => Store.getInvoiceTemplate())
  const [templateForm, setTemplateForm] = useState(() => Store.getInvoiceTemplate())
  const [templateSaved, setTemplateSaved] = useState(false)

  // Devis state
  const [devisList, setDevisList] = useState([])
  const [showDevisModal, setShowDevisModal] = useState(false)
  const [editingDevis, setEditingDevis] = useState(null)
  const [devisForm, setDevisForm] = useState(emptyDevisForm)
  const [previewDoc, setPreviewDoc] = useState(null)

  useEffect(() => {
    fetch('/api/accounts.php?trash=1')
      .then(r => r.json())
      .then(trashed => setTrashedEmails(new Set(trashed.map(a => a.email))))
      .catch(() => {})
  }, [])

  const reloadInvoices = () => {
    const all = Store.getInvoices()
    setInvoices(all.filter(i => i.type === 'invoice'))
    setDevisList(all.filter(i => i.type === 'quote'))
  }
  useEffect(() => { reloadInvoices() }, [])

  const activeRes = useMemo(() => allRes.filter(r => !trashedEmails.has(r.client_email)), [allRes, trashedEmails])

  const resInvoicesPaid = useMemo(() =>
    activeRes.filter(r => PAID.includes(r.status)).map(r => ({
      id: `RES-${r.id}`, type: 'invoice', clientName: r.client_name, clientEmail: r.client_email,
      date: r.date, totalTTC: r.price || 0, totalHT: r.price_ht || 0, status: 'paid', source: 'reservation',
      items: [{ description: `Session ${r.service || 'ARGENT'} ${r.duration || 1}h — ${r.studio}`, qty: 1, unitPrice: r.price_ht || r.price || 0 }],
    })), [activeRes])

  const resInvoicesUnpaid = useMemo(() =>
    activeRes.filter(r => ['en_attente', 'a_payer'].includes(r.status)).map(r => ({
      id: `RES-${r.id}`, type: 'invoice', clientName: r.client_name, clientEmail: r.client_email,
      date: r.date, totalTTC: r.price || 0, totalHT: r.price_ht || 0, status: 'unpaid', source: 'reservation',
      items: [{ description: `Session ${r.service || 'ARGENT'} ${r.duration || 1}h — ${r.studio}`, qty: 1, unitPrice: r.price_ht || r.price || 0 }],
    })), [activeRes])

  const allPaidInvoices   = [...resInvoicesPaid,   ...invoices.filter(i => i.status === 'paid')]
  const allUnpaidInvoices = [...resInvoicesUnpaid, ...invoices.filter(i => i.status === 'unpaid')]

  // Theme shortcuts
  const card          = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary   = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const tableHead     = isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'
  const tableRow      = isDark ? 'border-zinc-800/50 hover:bg-zinc-800/20' : 'border-gray-100 hover:bg-gray-50'
  const inputCls      = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-violet-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-500'
  const divider       = isDark ? 'border-zinc-800' : 'border-gray-100'

  const now = new Date()
  const todayStr = toYMD(now)

  function inPeriod(r) {
    const d = new Date(r.date)
    if (period === 'day')   return r.date === todayStr
    if (period === 'week') {
      const mon = getMonday(now); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59)
      return d >= mon && d <= sun
    }
    if (period === 'month') return d.getMonth() === chartMonth && d.getFullYear() === chartYear
    if (period === 'year')  return d.getFullYear() === chartYear
    return true
  }

  const filtered  = activeRes.filter(r => inPeriod(r))
  const countable = filtered.filter(r => !SKIP.includes(r.status))
  const paid      = countable.filter(r => PAID.includes(r.status))
  const pending   = countable.filter(r => r.status === 'a_payer' || r.status === 'en_attente')
  const ca        = paid.reduce((s, r) => s + (r.price || 0), 0)
  const sessions  = countable.length
  const hours     = countable.reduce((s, r) => s + (r.duration || 0), 0)

  const studioStats = STUDIOS.map((s, si) => {
    const sRes = countable.filter(r => r.studio === s)
    const sPaid = sRes.filter(r => PAID.includes(r.status))
    return { name: s, ca: sPaid.reduce((acc, r) => acc + (r.price || 0), 0), sessions: sRes.length, hours: sRes.reduce((acc, r) => acc + (r.duration || 0), 0), colorBar: STUDIO_COLORS[si], colorText: STUDIO_TEXT[si], colorBg: STUDIO_BG[si] }
  })

  const chartData = useMemo(() => {
    const paidAll = activeRes.filter(r => PAID.includes(r.status))
    if (period === 'year' || period === 'all') return MONTHS_FR.map((label, mi) => ({ label, value: paidAll.filter(r => { const d = new Date(r.date); return d.getMonth() === mi && d.getFullYear() === chartYear }).reduce((s, r) => s + (r.price || 0), 0) }))
    if (period === 'month') { const days = new Date(chartYear, chartMonth + 1, 0).getDate(); return Array.from({ length: days }, (_, di) => { const dateStr = `${chartYear}-${String(chartMonth + 1).padStart(2, '0')}-${String(di + 1).padStart(2, '0')}`; return { label: String(di + 1), value: paidAll.filter(r => r.date === dateStr).reduce((s, r) => s + (r.price || 0), 0) } }) }
    if (period === 'week') { const mon = getMonday(now); return DAYS_FR.map((label, di) => { const d = new Date(mon); d.setDate(mon.getDate() + di); return { label, value: paidAll.filter(r => r.date === toYMD(d)).reduce((s, r) => s + (r.price || 0), 0) } }) }
    const SLOTS = ['09','10','11','12','13','14','15','16','17','18','19','20','21']
    return SLOTS.map(h => ({ label: `${h}h`, value: paidAll.filter(r => r.date === todayStr && r.start_time?.startsWith(h)).reduce((s, r) => s + (r.price || 0), 0) }))
  }, [activeRes, period, chartYear, chartMonth])

  const allPaid    = activeRes.filter(r => !SKIP.includes(r.status) && PAID.includes(r.status))
  const caTotal    = allPaid.reduce((s, r) => s + (r.price || 0), 0)
  const refunded   = activeRes.filter(r => r.status === 'rembourse')
  const refundedCA = refunded.reduce((s, r) => s + (r.price || 0), 0)
  const discounted    = activeRes.filter(r => r.promo_code)
  const discountedCA  = discounted.reduce((s, r) => s + (r.price || 0), 0)

  const canPrevYear  = chartYear > 2024
  const canNextYear  = chartYear < now.getFullYear() + 1
  const canPrevMonth = !(chartYear === 2024 && chartMonth === 0)
  const canNextMonth = !(chartYear === now.getFullYear() && chartMonth === now.getMonth())

  const PERIODS = [
    { key: 'day', label: 'Jour' }, { key: 'week', label: 'Semaine' },
    { key: 'month', label: 'Mois' }, { key: 'year', label: 'Année' }, { key: 'all', label: 'Total' },
  ]
  const periodLabel = (() => {
    if (period === 'day')   return now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    if (period === 'week') { const mon = getMonday(now); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); return `${mon.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` }
    if (period === 'month') return `${MONTHS_FR[chartMonth]} ${chartYear}`
    if (period === 'year')  return String(chartYear)
    return 'Depuis le début'
  })()

  // ─── Invoice handlers ──────────────────────────────────────────────────────
  const handleInvFieldChange  = (k, v) => setInvForm(f => ({ ...f, [k]: v }))
  const handleInvItemChange   = (i, k, v) => setInvForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items } })
  const handleInvAddItem      = () => setInvForm(f => ({ ...f, items: [...f.items, { description: '', qty: 1, unitPrice: 0 }] }))
  const handleInvRemoveItem   = (i) => setInvForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  function handleSaveInvoice(totalHT, totalTTC) {
    if (editingInv) Store.updateInvoice(editingInv.id, { ...invForm, totalHT, totalTTC })
    else Store.addInvoice({ ...invForm, totalHT, totalTTC })
    reloadInvoices(); setShowInvModal(false); setEditingInv(null); setInvForm(emptyInvoiceForm)
  }
  function openEditInv(inv) {
    setEditingInv(inv)
    setInvForm({ clientName: inv.clientName || '', clientEmail: inv.clientEmail || '', clientCompany: inv.clientCompany || '', clientAddress: inv.clientAddress || '', date: inv.date || '', dueDate: inv.dueDate || '', items: inv.items || [{ description: '', qty: 1, unitPrice: 0 }], notes: inv.notes || '', status: inv.status || 'unpaid', type: 'invoice', formule: inv.formule || '', heures: inv.heures || '', nbPersonnes: inv.nbPersonnes || '', selectedOptions: inv.selectedOptions || [] })
    setShowInvModal(true)
  }
  function handleMarkInvPaid(id) { Store.updateInvoice(id, { status: 'paid' }); reloadInvoices() }
  function handleDeleteInv(id) { if (!confirm('Supprimer cette facture ?')) return; Store.deleteInvoice(id); reloadInvoices() }

  function saveTemplate() {
    Store.saveInvoiceTemplate(templateForm)
    setTemplate(templateForm)
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2000)
  }

  // ─── Devis handlers ────────────────────────────────────────────────────────
  const handleDevFieldChange  = (k, v) => setDevisForm(f => ({ ...f, [k]: v }))
  const handleDevItemChange   = (i, k, v) => setDevisForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items } })
  const handleDevAddItem      = () => setDevisForm(f => ({ ...f, items: [...f.items, { description: '', qty: 1, unitPrice: 0 }] }))
  const handleDevRemoveItem   = (i) => setDevisForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  function handleSaveDevis(totalHT, totalTTC) {
    if (editingDevis) Store.updateInvoice(editingDevis.id, { ...devisForm, totalHT, totalTTC })
    else Store.addInvoice({ ...devisForm, totalHT, totalTTC })
    reloadInvoices(); setShowDevisModal(false); setEditingDevis(null); setDevisForm(emptyDevisForm)
  }
  function openEditDevis(d) {
    setEditingDevis(d)
    setDevisForm({ clientName: d.clientName || '', clientEmail: d.clientEmail || '', clientCompany: d.clientCompany || '', date: d.date || '', validUntil: d.validUntil || '', items: d.items || [{ description: '', qty: 1, unitPrice: 0 }], notes: d.notes || '', status: d.status || 'draft', type: 'quote', formule: d.formule || '', heures: d.heures || '', nbPersonnes: d.nbPersonnes || '', selectedOptions: d.selectedOptions || [] })
    setShowDevisModal(true)
  }
  function convertToInvoice(devis) {
    Store.updateInvoice(devis.id, { type: 'invoice', status: 'unpaid', quoteDate: devis.date })
    reloadInvoices()
  }
  function handleDeleteDevis(id) { if (!confirm('Supprimer ce devis ?')) return; Store.deleteInvoice(id); reloadInvoices() }

  const MAIN_TABS = [
    { key: 'recette',  label: 'Recette',  icon: <TrendingUp size={14} /> },
    { key: 'factures', label: 'Factures', icon: <Receipt size={14} /> },
    { key: 'devis',    label: 'Devis',    icon: <FileText size={14} /> },
  ]

  return (
    <Layout navItems={ADMIN_NAV} title="Recette">
      {/* ── Main tab selector ── */}
      <div className={`flex gap-1 mb-6 border-b pb-0 ${divider}`}>
        {MAIN_TABS.map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${mainTab === t.key ? 'border-violet-500 text-violet-400' : `border-transparent ${textSecondary} hover:text-violet-400`}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── RECETTE tab ── */}
      {mainTab === 'recette' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-violet-400" />
              <h2 className={`text-xl font-bold ${textPrimary}`}>Recette</h2>
              <span className={`text-sm ${textSecondary}`}>— {periodLabel}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(period === 'year' || period === 'month') && (
                <div className="flex items-center gap-1">
                  {period === 'month' && (
                    <>
                      <button onClick={() => { if (chartMonth === 0) { setChartMonth(11); setChartYear(y => y - 1) } else setChartMonth(m => m - 1) }} disabled={!canPrevMonth} className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft className="w-4 h-4" /></button>
                      <span className={`text-sm font-semibold min-w-[90px] text-center ${textPrimary}`}>{MONTHS_FR[chartMonth]} {chartYear}</span>
                      <button onClick={() => { if (chartMonth === 11) { setChartMonth(0); setChartYear(y => y + 1) } else setChartMonth(m => m + 1) }} disabled={!canNextMonth} className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronRight className="w-4 h-4" /></button>
                    </>
                  )}
                  {period === 'year' && (
                    <>
                      <button onClick={() => setChartYear(y => y - 1)} disabled={!canPrevYear} className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft className="w-4 h-4" /></button>
                      <span className={`text-sm font-semibold min-w-[48px] text-center ${textPrimary}`}>{chartYear}</span>
                      <button onClick={() => setChartYear(y => y + 1)} disabled={!canNextYear} className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronRight className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              )}
              <div className={`flex rounded-xl border overflow-hidden text-sm font-medium ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                {PERIODS.map(({ key, label }) => (
                  <button key={key} onClick={() => setPeriod(key)} className={`px-3 py-1.5 transition-colors ${period === key ? 'bg-violet-600 text-white' : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={`border rounded-2xl p-5 ${card}`}>
              <div className={`flex items-center gap-1.5 mb-2 text-xs font-semibold ${textSecondary}`}><TrendingUp className="w-3.5 h-3.5 text-green-400" /> CA période</div>
              <div className="text-2xl font-black text-green-400">{formatPrice(ca)}</div>
              {period !== 'all' && <div className={`text-xs mt-1 ${textSecondary}`}>Total : {formatPrice(caTotal)}</div>}
            </div>
            <div className={`border rounded-2xl p-5 ${card}`}>
              <div className={`flex items-center gap-1.5 mb-2 text-xs font-semibold ${textSecondary}`}><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Sessions payées</div>
              <div className="text-2xl font-black text-blue-400">{paid.length}</div>
              <div className={`text-xs mt-1 ${textSecondary}`}>{sessions > 0 ? ((paid.length / sessions) * 100).toFixed(0) : 0}% des sessions</div>
            </div>
            <div className={`border rounded-2xl p-5 ${card}`}>
              <div className={`flex items-center gap-1.5 mb-2 text-xs font-semibold ${textSecondary}`}><CreditCard className="w-3.5 h-3.5 text-amber-400" /> En attente paiement</div>
              <div className="text-2xl font-black text-amber-400">{pending.length}</div>
              <div className={`text-xs mt-1 ${textSecondary}`}>{pending.length > 0 ? formatPrice(pending.reduce((s, r) => s + (r.price || 0), 0)) : '—'} à encaisser</div>
            </div>
            <StatCard label="Total sessions" value={sessions} icon={<CalendarDays className="w-3.5 h-3.5" />} color="text-violet-400" card={card} textPrimary={textPrimary} textSecondary={textSecondary} />
            <StatCard label="Heures réservées" value={`${hours}h`} icon={<BarChart2 className="w-3.5 h-3.5" />} color="text-cyan-400" card={card} textPrimary={textPrimary} textSecondary={textSecondary} />
            <StatCard label="CA moyen/session" value={paid.length > 0 ? formatPrice(ca / paid.length) : '—'} icon={<Receipt className="w-3.5 h-3.5" />} color="text-emerald-400" card={card} textPrimary={textPrimary} textSecondary={textSecondary} />
          </div>

          <div className={`border rounded-2xl p-6 ${card}`}>
            <div className="flex items-center gap-2 mb-5"><Building2 className="w-4 h-4 text-violet-400" /><h3 className={`font-bold ${textPrimary}`}>CA par studio</h3></div>
            <div className="grid sm:grid-cols-3 gap-4">
              {studioStats.map(s => {
                const pct = ca > 0 ? Math.round((s.ca / ca) * 100) : 0
                return (
                  <div key={s.name} className={`rounded-xl p-4 ${s.colorBg} border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-bold ${s.colorText}`}>{s.name}</span>
                      <span className={`text-xs font-bold ${s.colorText}`}>{pct}%</span>
                    </div>
                    <div className={`text-2xl font-black mb-1 ${textPrimary}`}>{formatPrice(s.ca)}</div>
                    <div className={`h-1.5 rounded-full mb-2 ${isDark ? 'bg-black/20' : 'bg-white/60'}`}>
                      <div className={`h-1.5 rounded-full transition-all ${s.colorBar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={`text-xs ${textSecondary}`}>{s.sessions} session{s.sessions !== 1 ? 's' : ''} · {s.hours}h</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={`border rounded-2xl p-6 ${card}`}>
            <div className="flex items-center gap-2 mb-5"><BarChart2 className="w-4 h-4 text-violet-400" /><h3 className={`font-bold ${textPrimary}`}>{period === 'year' || period === 'all' ? `Évolution mensuelle ${chartYear}` : period === 'month' ? `CA journalier — ${MONTHS_FR[chartMonth]} ${chartYear}` : period === 'week' ? 'CA cette semaine' : "CA aujourd'hui"}</h3></div>
            <BarChart data={chartData} isDark={isDark} textSecondary={textSecondary} />
            <div className={`flex justify-between mt-3 text-[10px] ${textSecondary}`}><span>0</span><span>{formatPrice(Math.max(...chartData.map(d => d.value), 0))}</span></div>
          </div>

          <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <div className={`px-5 py-3 border-b ${isDark ? 'border-zinc-800' : 'border-gray-200'} flex items-center gap-2`}><Building2 className="w-4 h-4 text-violet-400" /><h3 className={`font-bold text-sm ${textPrimary}`}>Détail CA studio — {periodLabel}</h3></div>
            <table className="w-full">
              <thead><tr className={`border-b text-xs font-semibold ${tableHead}`}><th className="text-left px-5 py-3">Studio</th><th className="text-right px-5 py-3">Sessions</th><th className="text-right px-5 py-3 hidden sm:table-cell">Heures</th><th className="text-right px-5 py-3">CA TTC</th><th className="text-right px-5 py-3 hidden md:table-cell">Part %</th></tr></thead>
              <tbody>
                {studioStats.map(s => {
                  const pct = ca > 0 ? ((s.ca / ca) * 100).toFixed(1) : '0.0'
                  return (
                    <tr key={s.name} className={`border-b transition-colors ${tableRow}`}>
                      <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><div className={`w-2 h-2 rounded-full ${s.colorBar}`} /><span className={`text-sm font-medium ${textPrimary}`}>{s.name}</span></div></td>
                      <td className={`px-5 py-3.5 text-right text-sm ${textPrimary}`}>{s.sessions}</td>
                      <td className={`px-5 py-3.5 text-right text-sm hidden sm:table-cell ${textSecondary}`}>{s.hours}h</td>
                      <td className={`px-5 py-3.5 text-right text-sm font-bold ${s.colorText}`}>{formatPrice(s.ca)}</td>
                      <td className={`px-5 py-3.5 text-right text-sm hidden md:table-cell ${textSecondary}`}>{pct}%</td>
                    </tr>
                  )
                })}
                <tr className={isDark ? 'bg-zinc-800/40' : 'bg-gray-50'}><td className={`px-5 py-3.5 text-sm font-bold ${textPrimary}`}>Total</td><td className={`px-5 py-3.5 text-right text-sm font-bold ${textPrimary}`}>{sessions}</td><td className={`px-5 py-3.5 text-right text-sm font-bold hidden sm:table-cell ${textPrimary}`}>{hours}h</td><td className="px-5 py-3.5 text-right text-sm font-bold text-green-400">{formatPrice(ca)}</td><td className="px-5 py-3.5 text-right text-sm hidden md:table-cell"><span className={`text-xs font-bold ${textSecondary}`}>100%</span></td></tr>
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className={`border rounded-2xl p-6 ${card}`}>
              <div className="flex items-center gap-2 mb-5"><RotateCcw className="w-4 h-4 text-pink-400" /><h3 className={`font-bold ${textPrimary}`}>Remboursements</h3><span className={`text-xs ${textSecondary}`}>— tout historique</span></div>
              {refunded.length === 0 ? <p className={`text-sm ${textSecondary}`}>Aucun remboursement enregistré.</p> : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-xl p-3 ${isDark ? 'bg-pink-500/5 border border-pink-500/20' : 'bg-pink-50 border border-pink-200'}`}><div className="text-xs font-semibold mb-1 text-pink-400">Nombre</div><div className="text-2xl font-black text-pink-400">{refunded.length}</div></div>
                    <div className={`rounded-xl p-3 ${isDark ? 'bg-pink-500/5 border border-pink-500/20' : 'bg-pink-50 border border-pink-200'}`}><div className="text-xs font-semibold mb-1 text-pink-400">Montant total</div><div className="text-xl font-black text-pink-400">{formatPrice(refundedCA)}</div></div>
                  </div>
                  <div className="space-y-1.5">{[...refunded].sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0,5).map(r => (<div key={r.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}><div className={textSecondary}><span className={`font-medium ${textPrimary}`}>{r.client_name}</span>{' · '}{r.studio}{' · '}{r.date}</div><span className="text-pink-400 font-bold">{formatPrice(r.price)}</span></div>))}</div>
                </div>
              )}
            </div>
            <div className={`border rounded-2xl p-6 ${card}`}>
              <div className="flex items-center gap-2 mb-5"><Tag className="w-4 h-4 text-amber-400" /><h3 className={`font-bold ${textPrimary}`}>Tarifs réduits</h3><span className={`text-xs ${textSecondary}`}>— avec code promo</span></div>
              {discounted.length === 0 ? <p className={`text-sm ${textSecondary}`}>Aucune réservation avec code promo.</p> : (
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}><div className="text-xs font-semibold mb-1 text-amber-400">Nombre</div><div className="text-2xl font-black text-amber-400">{discounted.length}</div></div>
                  <div className={`rounded-xl p-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}><div className="text-xs font-semibold mb-1 text-amber-400">CA promos</div><div className="text-xl font-black text-amber-400">{formatPrice(discountedCA)}</div></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FACTURES tab ── */}
      {mainTab === 'factures' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className={`flex rounded-xl border overflow-hidden text-sm font-medium ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
              {[{ key: 'unpaid', label: `À payer (${allUnpaidInvoices.length})` }, { key: 'paid', label: `Payées (${allPaidInvoices.length})` }, { key: 'editor', label: 'Modèle' }].map(({ key, label }) => (
                <button key={key} onClick={() => setInvSubTab(key)} className={`px-4 py-2 transition-colors ${invSubTab === key ? 'bg-violet-600 text-white' : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>{label}</button>
              ))}
            </div>
            {invSubTab !== 'editor' && (
              <button onClick={() => { setEditingInv(null); setInvForm(emptyInvoiceForm); setShowInvModal(true) }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                <Plus size={14} /> Nouvelle facture
              </button>
            )}
          </div>

          {invSubTab === 'unpaid' && (
            <div className={`border rounded-2xl overflow-hidden ${card}`}>
              <div className={`px-5 py-3 border-b flex items-center gap-2 ${divider}`}>
                <CreditCard className="w-4 h-4 text-amber-400" />
                <h3 className={`font-semibold text-sm ${textPrimary}`}>Factures à payer</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold">{allUnpaidInvoices.length}</span>
              </div>
              <InvTable list={allUnpaidInvoices} isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} tableHead={tableHead} tableRow={tableRow} onEdit={openEditInv} onMarkPaid={handleMarkInvPaid} onDelete={handleDeleteInv} onDownload={inv => downloadDocument(inv, template)} onPreview={setPreviewDoc} />
            </div>
          )}

          {invSubTab === 'paid' && (
            <div className={`border rounded-2xl overflow-hidden ${card}`}>
              <div className={`px-5 py-3 border-b flex items-center gap-2 ${divider}`}>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <h3 className={`font-semibold text-sm ${textPrimary}`}>Factures payées</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold">{allPaidInvoices.length}</span>
              </div>
              <InvTable list={allPaidInvoices} isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} tableHead={tableHead} tableRow={tableRow} onEdit={openEditInv} onMarkPaid={handleMarkInvPaid} onDelete={handleDeleteInv} onDownload={inv => downloadDocument(inv, template)} onPreview={setPreviewDoc} />
            </div>
          )}

          {invSubTab === 'editor' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`border rounded-2xl p-6 space-y-4 ${card}`}>
                <div className="flex items-center gap-2 mb-2"><Pencil className="w-4 h-4 text-violet-400" /><h3 className={`font-bold ${textPrimary}`}>Modèle de facture</h3></div>
                {[
                  { label: 'Nom de la société',       key: 'company',      placeholder: 'Level Studios' },
                  { label: 'Adresse',                  key: 'address',      placeholder: 'Montréal, QC, Canada' },
                  { label: 'Email',                    key: 'email',        placeholder: 'contact@levelstudios.ca' },
                  { label: 'Téléphone',                key: 'phone',        placeholder: '+1 514 000 0000' },
                  { label: 'Site web',                 key: 'website',      placeholder: 'levelstudios.ca' },
                  { label: 'N° TPS',                   key: 'tps',          placeholder: '123456789 RT0001' },
                  { label: 'N° TVQ',                   key: 'tvq',          placeholder: '1234567890 TQ0001' },
                  { label: 'Conditions de paiement',   key: 'paymentTerms', placeholder: 'Pour réception fichiers audios et vidéos' },
                  { label: 'Informations bancaires',   key: 'bankInfo',     placeholder: 'Banque / IBAN / etc.' },
                ].map(f => (
                  <div key={f.key}>
                    <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>{f.label}</label>
                    <input value={templateForm[f.key] || ''} onChange={e => setTemplateForm(tf => ({ ...tf, [f.key]: e.target.value }))} placeholder={f.placeholder} className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${inputCls}`} />
                  </div>
                ))}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Pied de page</label>
                  <textarea value={templateForm.footer || ''} onChange={e => setTemplateForm(tf => ({ ...tf, footer: e.target.value }))} rows={2} className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 resize-none ${inputCls}`} placeholder="Merci pour votre confiance. — Level Studios" />
                </div>
                <button onClick={saveTemplate} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${templateSaved ? 'bg-green-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
                  {templateSaved ? <><Check size={14} /> Enregistré</> : <><Save size={14} /> Enregistrer le modèle</>}
                </button>
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${textSecondary}`}>Aperçu du modèle</p>
                <InvoicePreview invoice={null} template={templateForm} isDark={isDark} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DEVIS tab ── */}
      {mainTab === 'devis' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              <h2 className={`text-xl font-bold ${textPrimary}`}>Devis</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>{devisList.length}</span>
            </div>
            <button onClick={() => { setEditingDevis(null); setDevisForm(emptyDevisForm); setShowDevisModal(true) }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <Plus size={14} /> Nouveau devis
            </button>
          </div>

          <div className={`border rounded-2xl overflow-hidden ${card}`}>
            {devisList.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className={`w-12 h-12 mx-auto mb-3 opacity-30 ${textSecondary}`} />
                <p className={`text-sm font-semibold ${textPrimary}`}>Aucun devis</p>
                <p className={`text-xs mt-1 ${textSecondary}`}>Cliquez sur «Nouveau devis» pour en créer un.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className={`border-b text-xs font-semibold ${tableHead}`}>
                    <th className="text-left px-4 py-3">N°</th>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Valide jusqu'au</th>
                    <th className="text-right px-4 py-3">Montant TTC</th>
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {devisList.map(d => {
                      const st = DEV_STATUS[d.status] || DEV_STATUS.draft
                      return (
                        <tr key={d.id} className={`border-b transition-colors ${tableRow}`}>
                          <td className={`px-4 py-3 font-mono text-xs ${textSecondary}`}>{d.id}</td>
                          <td className="px-4 py-3">
                            <div className={`font-medium ${textPrimary}`}>{d.clientName}</div>
                            {d.clientEmail && <div className={`text-xs ${textSecondary}`}>{d.clientEmail}</div>}
                          </td>
                          <td className={`px-4 py-3 hidden sm:table-cell ${textSecondary} text-xs`}>{d.date}</td>
                          <td className={`px-4 py-3 hidden md:table-cell ${textSecondary} text-xs`}>{d.validUntil || '—'}</td>
                          <td className={`px-4 py-3 text-right font-bold ${textPrimary}`}>{formatPrice(d.totalTTC)}</td>
                          <td className="px-4 py-3">
                            <select value={d.status} onChange={e => { Store.updateInvoice(d.id, { status: e.target.value }); reloadInvoices() }}
                              className={`text-xs px-2 py-0.5 rounded-lg border bg-transparent cursor-pointer ${st.cls}`}>
                              {Object.entries(DEV_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              <button onClick={() => setPreviewDoc(d)} title="Visualiser" className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-colors"><Eye size={12} /></button>
                              <button onClick={() => downloadDocument(d, template)} title="Télécharger" className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"><Download size={12} /></button>
                              <button onClick={() => openEditDevis(d)} className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-colors" title="Modifier"><Pencil size={12} /></button>
                              <button onClick={() => convertToInvoice(d)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold transition-colors" title="Convertir en facture">
                                <ArrowRight size={11} /> FACT
                              </button>
                              <button onClick={() => handleDeleteDevis(d.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Supprimer"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Preview modal ── */}
      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          template={template}
          isDark={isDark}
          onClose={() => setPreviewDoc(null)}
          onDownload={doc => downloadDocument(doc, template)}
        />
      )}

      {/* ── Modals ── */}
      {showInvModal && (
        <InvoiceModal
          type="invoice"
          onClose={() => { setShowInvModal(false); setEditingInv(null) }}
          onSave={handleSaveInvoice}
          form={invForm}
          onFieldChange={handleInvFieldChange}
          onItemChange={handleInvItemChange}
          onAddItem={handleInvAddItem}
          onRemoveItem={handleInvRemoveItem}
          isEditing={editingInv}
          template={template}
          isDark={isDark}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          inputCls={inputCls}
          divider={divider}
        />
      )}
      {showDevisModal && (
        <InvoiceModal
          type="quote"
          onClose={() => { setShowDevisModal(false); setEditingDevis(null) }}
          onSave={handleSaveDevis}
          form={devisForm}
          onFieldChange={handleDevFieldChange}
          onItemChange={handleDevItemChange}
          onAddItem={handleDevAddItem}
          onRemoveItem={handleDevRemoveItem}
          isEditing={editingDevis}
          template={template}
          isDark={isDark}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          inputCls={inputCls}
          divider={divider}
        />
      )}
    </Layout>
  )
}
