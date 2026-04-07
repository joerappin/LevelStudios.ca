import React, { useState } from 'react'
import { LogIn, LogOut, Users } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'

export default function AdminCheck() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [checkIns] = useState(Store.getCheckIns())
  const today = new Date().toISOString().split('T')[0]
  const todayCheckIns = checkIns.filter(c => c.date === today)

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const tableRow = isDark ? 'border-zinc-800/50' : 'border-gray-100'
  const tableHead = isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'

  const totalMinutes = (checkin) => {
    if (!checkin.check_in || !checkin.check_out) return null
    const [h1, m1] = checkin.check_in.split(':').map(Number)
    const [h2, m2] = checkin.check_out.split(':').map(Number)
    return (h2 * 60 + m2) - (h1 * 60 + m1)
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Check-in employés">
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: <Users className="w-3.5 h-3.5" />, label: "Présents aujourd'hui", value: todayCheckIns.filter(c => c.check_in && !c.check_out).length },
            { icon: <LogIn className="w-3.5 h-3.5" />, label: "Arrivées aujourd'hui", value: todayCheckIns.filter(c => c.check_in).length },
            { icon: <LogOut className="w-3.5 h-3.5" />, label: 'Partis', value: todayCheckIns.filter(c => c.check_out).length },
          ].map((s, i) => (
            <div key={i} className={`border rounded-2xl p-5 ${card}`}>
              <div className={`text-xs mb-2 flex items-center gap-1.5 ${textSecondary}`}>{s.icon} {s.label}</div>
              <div className={`text-3xl font-black ${textPrimary}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className={`px-5 py-4 border-b ${divider}`}>
            <h3 className={`font-semibold ${textPrimary}`}>Aujourd'hui — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${tableHead}`}>
                <th className="text-left text-xs font-semibold px-5 py-3">Employé</th>
                <th className="text-left text-xs font-semibold px-5 py-3">Arrivée</th>
                <th className="text-left text-xs font-semibold px-5 py-3">Départ</th>
                <th className="text-left text-xs font-semibold px-5 py-3 hidden sm:table-cell">Durée</th>
                <th className="text-left text-xs font-semibold px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {todayCheckIns.length === 0 ? (
                <tr><td colSpan={5} className={`px-5 py-10 text-center text-sm ${textSecondary}`}>Aucun check-in aujourd'hui</td></tr>
              ) : todayCheckIns.map(c => {
                const mins = totalMinutes(c)
                return (
                  <tr key={c.id} className={`border-b ${tableRow}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-blue-400">{c.employee_name?.charAt(0)}</div>
                        <div className={`text-sm font-medium ${textPrimary}`}>{c.employee_name}</div>
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{c.check_in || '—'}</td>
                    <td className={`px-5 py-3.5 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{c.check_out || '—'}</td>
                    <td className={`px-5 py-3.5 hidden sm:table-cell text-sm ${textSecondary}`}>
                      {mins ? `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${c.check_in && !c.check_out ? 'bg-green-500/10 text-green-400' : c.check_out ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500') : 'bg-red-500/10 text-red-400'}`}>
                        {c.check_in && !c.check_out ? 'En poste' : c.check_out ? 'Parti' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className={`px-5 py-4 border-b ${divider}`}>
            <h3 className={`font-semibold ${textPrimary}`}>Historique récent</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${tableHead}`}>
                <th className="text-left text-xs font-semibold px-5 py-3">Employé</th>
                <th className="text-left text-xs font-semibold px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold px-5 py-3">Arrivée</th>
                <th className="text-left text-xs font-semibold px-5 py-3">Départ</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.filter(c => c.date !== today).slice(0, 10).map(c => (
                <tr key={c.id} className={`border-b ${tableRow}`}>
                  <td className={`px-5 py-3 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{c.employee_name}</td>
                  <td className={`px-5 py-3 text-sm ${textSecondary}`}>{c.date}</td>
                  <td className={`px-5 py-3 text-sm ${textSecondary}`}>{c.check_in || '—'}</td>
                  <td className={`px-5 py-3 text-sm ${textSecondary}`}>{c.check_out || '—'}</td>
                </tr>
              ))}
              {checkIns.filter(c => c.date !== today).length === 0 && (
                <tr><td colSpan={4} className={`px-5 py-8 text-center text-sm ${textSecondary}`}>Aucun historique</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
