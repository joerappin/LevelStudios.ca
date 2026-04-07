import React, { useState } from 'react'
import { Trash2, RefreshCw, Download, Database, AlertTriangle } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { useApp } from '../../contexts/AppContext'

export default function AdminTool() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [confirm, setConfirm] = useState(null)
  const [msg, setMsg] = useState('')

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const modalBg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200 shadow-xl'
  const btnSecondary = isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
  const itemBg = isDark ? 'bg-zinc-800' : 'bg-gray-50'
  const exportBtn = isDark ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'

  const clearKey = (key, label) => {
    localStorage.removeItem(key)
    setMsg(`✓ ${label} effacé avec succès.`)
    setTimeout(() => setMsg(''), 3000)
    setConfirm(null)
  }

  const clearAll = () => {
    const keys = ['ls_reservations', 'ls_projects', 'ls_messages', 'ls_internal_messages', 'ls_employees', 'ls_leave_requests', 'ls_hour_packs', 'ls_promo_codes', 'ls_popup_messages', 'ls_check_ins']
    keys.forEach(k => localStorage.removeItem(k))
    setMsg('✓ Toutes les données ont été réinitialisées. Rechargez la page.')
    setConfirm(null)
  }

  const exportData = () => {
    const keys = ['ls_reservations', 'ls_projects', 'ls_messages', 'ls_promo_codes', 'ls_employees']
    const data = {}
    keys.forEach(k => { try { data[k] = JSON.parse(localStorage.getItem(k) || '[]') } catch {} })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `level-studio-export-${new Date().toISOString().split('T')[0]}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const tools = [
    { label: 'Réservations', key: 'ls_reservations', desc: 'Efface toutes les réservations' },
    { label: 'Projets', key: 'ls_projects', desc: 'Efface tous les projets' },
    { label: 'Messages SAV', key: 'ls_messages', desc: 'Efface tous les messages clients' },
    { label: 'Messages internes', key: 'ls_internal_messages', desc: 'Efface la messagerie interne' },
    { label: 'Codes promo', key: 'ls_promo_codes', desc: 'Efface les codes promotionnels' },
    { label: 'Check-ins', key: 'ls_check_ins', desc: "Efface l'historique des pointages" },
    { label: 'Congés', key: 'ls_leave_requests', desc: 'Efface les demandes de congés' },
    { label: 'Popups', key: 'ls_popup_messages', desc: 'Efface les messages popup' },
  ]

  return (
    <Layout navItems={ADMIN_NAV} title="Outils admin">
      <div className="max-w-2xl space-y-6">
        {msg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">{msg}</div>
        )}

        <div className={`border rounded-2xl p-6 ${card}`}>
          <h3 className={`font-bold mb-1 flex items-center gap-2 ${textPrimary}`}><Database className="w-4 h-4" /> Export des données</h3>
          <p className={`text-sm mb-4 ${textSecondary}`}>Téléchargez une sauvegarde JSON de toutes les données.</p>
          <button onClick={exportData} className={`flex items-center gap-2 border font-medium px-4 py-2.5 rounded-xl text-sm transition-colors ${exportBtn}`}>
            <Download className="w-4 h-4" /> Exporter (JSON)
          </button>
        </div>

        <div className={`border rounded-2xl p-6 ${card}`}>
          <h3 className={`font-bold mb-1 flex items-center gap-2 ${textPrimary}`}><Trash2 className="w-4 h-4 text-red-400" /> Réinitialisation partielle</h3>
          <p className={`text-sm mb-4 ${textSecondary}`}>Effacez des catégories de données spécifiques.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {tools.map(t => (
              <div key={t.key} className={`flex items-center justify-between rounded-xl px-4 py-3 ${itemBg}`}>
                <div>
                  <div className={`text-sm font-medium ${textPrimary}`}>{t.label}</div>
                  <div className={`text-xs ${textSecondary}`}>{t.desc}</div>
                </div>
                <button onClick={() => setConfirm({ key: t.key, label: t.label })} className="ml-3 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <h3 className={`font-bold mb-1 flex items-center gap-2 ${textPrimary}`}><AlertTriangle className="w-4 h-4 text-red-400" /> Zone dangereuse</h3>
          <p className={`text-sm mb-4 ${textSecondary}`}>Réinitialisation complète de toutes les données de l'application.</p>
          <button onClick={() => setConfirm({ key: '__all__', label: 'TOUTES LES DONNÉES' })} className="flex items-center gap-2 bg-red-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-red-400 transition-colors">
            <RefreshCw className="w-4 h-4" /> Tout réinitialiser
          </button>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-sm p-6 text-center ${modalBg}`}>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className={`font-bold mb-2 ${textPrimary}`}>Confirmer la suppression</h3>
            <p className={`text-sm mb-6 ${textSecondary}`}>Êtes-vous sûr de vouloir effacer <strong className={textPrimary}>{confirm.label}</strong> ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className={`flex-1 border rounded-xl py-2.5 text-sm transition-colors ${btnSecondary}`}>Annuler</button>
              <button onClick={() => confirm.key === '__all__' ? clearAll() : clearKey(confirm.key, confirm.label)} className="flex-1 bg-red-500 text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-red-400 transition-colors">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
