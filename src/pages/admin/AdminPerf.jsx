import React, { useState, useEffect } from 'react'
import { Medal, TrendingUp, Clock, FolderCheck } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'

function getGrade(count) {
  if (count >= 10) return { label: 'Gold',   color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '🥇' }
  if (count >= 4)  return { label: 'Argent', color: 'text-zinc-300',   bg: 'bg-zinc-500/10',   border: 'border-zinc-500/30',   icon: '🥈' }
  return                  { label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: '🥉' }
}

function filterByPeriod(items, period, dateKey = 'created_at') {
  const now = new Date()
  return items.filter(i => {
    const d = new Date(i[dateKey])
    if (period === 'week') {
      const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0,0,0,0)
      return d >= monday
    }
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return d.getFullYear() === now.getFullYear()
  })
}

export default function AdminPerf() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [period, setPeriod] = useState('month')
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [checkIns, setCheckIns] = useState([])

  useEffect(() => {
    setEmployees(Store.getEmployees().filter(e => !e.deleted && e.active))
    setProjects(Store.getProjects())
    setCheckIns(Store.getCheckIns())
  }, [])

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const periodBtn = (p) => period === p ? 'bg-violet-600 text-white' : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'

  const stats = employees.map(emp => {
    const empProjects = filterByPeriod(
      projects.filter(p => p.assigned_to === emp.email && (p.status === 'Livré' || p.status === 'Archivé')),
      period
    )
    const empCheckIns = filterByPeriod(checkIns.filter(c => c.employee_email === emp.email), period, 'date')
    const hoursWorked = empCheckIns.reduce((sum, c) => {
      if (!c.check_in || !c.check_out) return sum
      const [ih, im] = c.check_in.split(':').map(Number)
      const [oh, om] = c.check_out.split(':').map(Number)
      return sum + Math.max(0, (oh * 60 + om - (ih * 60 + im)) / 60)
    }, 0)
    const grade = getGrade(empProjects.length)
    return { ...emp, completed: empProjects.length, hours: Math.round(hoursWorked), grade }
  }).sort((a, b) => b.completed - a.completed)

  const gradeCounts = {
    Gold:   stats.filter(s => s.grade.label === 'Gold').length,
    Argent: stats.filter(s => s.grade.label === 'Argent').length,
    Bronze: stats.filter(s => s.grade.label === 'Bronze').length,
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Performance">
      <div className="space-y-6">

        {/* Header + period toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${textPrimary}`}>Suivi des performances</h2>
            <p className={`text-sm ${textSecondary}`}>Classement des employés par projets livrés</p>
          </div>
          <div className={`flex items-center rounded-xl border overflow-hidden text-sm font-semibold ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
            {[['week','Semaine'],['month','Mois'],['year','Année']].map(([p, label]) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 transition-colors ${periodBtn(p)}`}>{label}</button>
            ))}
          </div>
        </div>

        {/* Grade summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Gold',   count: gradeCounts.Gold,   icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: isDark ? 'border-yellow-500/20' : 'border-yellow-200' },
            { label: 'Argent', count: gradeCounts.Argent, icon: '🥈', color: 'text-zinc-300',   bg: 'bg-zinc-500/10',   border: isDark ? 'border-zinc-600' : 'border-gray-200' },
            { label: 'Bronze', count: gradeCounts.Bronze, icon: '🥉', color: 'text-orange-400', bg: 'bg-orange-500/10', border: isDark ? 'border-orange-500/20' : 'border-orange-200' },
          ].map(g => (
            <div key={g.label} className={`border rounded-2xl p-5 ${card}`}>
              <div className="text-2xl mb-2">{g.icon}</div>
              <div className={`text-3xl font-black ${g.color}`}>{g.count}</div>
              <div className={`text-sm font-medium mt-1 ${textSecondary}`}>Employé{g.count !== 1 ? 's' : ''} {g.label}</div>
            </div>
          ))}
        </div>

        {/* Classement */}
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className={`px-5 py-4 border-b flex items-center gap-2 ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
            <Medal className="w-4 h-4 text-violet-400" />
            <span className={`text-sm font-semibold ${textPrimary}`}>Classement</span>
          </div>
          {stats.length === 0 ? (
            <div className={`px-5 py-8 text-center text-sm ${textSecondary}`}>Aucun employé actif.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className={`text-xs font-semibold border-b ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-100'}`}>
                  <th className="text-left px-5 py-3">#</th>
                  <th className="text-left px-5 py-3">Employé</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Rôle</th>
                  <th className="text-center px-5 py-3">Grade</th>
                  <th className="text-center px-5 py-3">Projets livrés</th>
                  <th className="text-center px-5 py-3 hidden md:table-cell">Heures</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((emp, i) => (
                  <tr key={emp.id} className={`border-b ${isDark ? 'border-zinc-800/60' : 'border-gray-100'}`}>
                    <td className={`px-5 py-4 text-sm font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-orange-400' : textSecondary}`}>
                      {i + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                          {emp.name.charAt(0)}
                        </div>
                        <div className={`text-sm font-medium ${textPrimary}`}>{emp.name}</div>
                      </div>
                    </td>
                    <td className={`px-5 py-4 hidden sm:table-cell text-sm ${textSecondary}`}>{emp.role}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md border ${emp.grade.bg} ${emp.grade.color} ${emp.grade.border}`}>
                        {emp.grade.icon} {emp.grade.label}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-center text-sm font-bold ${textPrimary}`}>{emp.completed}</td>
                    <td className={`px-5 py-4 text-center hidden md:table-cell text-sm ${textSecondary}`}>{emp.hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Légende grades */}
        <div className={`border rounded-2xl p-5 ${card}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${textSecondary}`}>Barème des grades</p>
          <div className="flex flex-wrap gap-4">
            {[
              { icon: '🥇', label: 'Gold', desc: '10 projets livrés ou plus', color: 'text-yellow-400' },
              { icon: '🥈', label: 'Argent', desc: '4 à 9 projets livrés', color: 'text-zinc-300' },
              { icon: '🥉', label: 'Bronze', desc: '1 à 3 projets livrés', color: 'text-orange-400' },
            ].map(g => (
              <div key={g.label} className="flex items-center gap-2">
                <span className="text-lg">{g.icon}</span>
                <span className={`text-sm font-semibold ${g.color}`}>{g.label}</span>
                <span className={`text-xs ${textSecondary}`}>— {g.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  )
}
