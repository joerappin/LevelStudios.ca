import React, { useState, useEffect } from 'react'
import { Medal, TrendingUp, Clock, FolderCheck, Users } from 'lucide-react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
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
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      monday.setHours(0, 0, 0, 0)
      return d >= monday
    }
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return d.getFullYear() === now.getFullYear()
  })
}

export default function ChefPerf() {
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
  const tableHead = isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'
  const tableRow = isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-gray-100 hover:bg-gray-50'

  const PERIODS = [{ key: 'week', label: 'Semaine' }, { key: 'month', label: 'Mois' }, { key: 'year', label: 'Année' }]

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

  const totalCompleted = stats.reduce((s, e) => s + e.completed, 0)
  const totalHours = stats.reduce((s, e) => s + e.hours, 0)

  return (
    <Layout navItems={CHEF_NAV} title="Performance">
      <div className="space-y-6">
        {/* Header + period */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-violet-400" />
            <h2 className={`text-xl font-bold ${textPrimary}`}>Performance équipe</h2>
          </div>
          <div className="flex gap-1.5">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === key ? 'bg-violet-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`border rounded-2xl p-5 ${card}`}>
            <div className={`flex items-center gap-2 mb-2 text-xs font-semibold ${textSecondary}`}>
              <Users className="w-3.5 h-3.5" /> Techniciens actifs
            </div>
            <div className={`text-3xl font-black ${textPrimary}`}>{employees.length}</div>
          </div>
          <div className={`border rounded-2xl p-5 ${card}`}>
            <div className={`flex items-center gap-2 mb-2 text-xs font-semibold ${textSecondary}`}>
              <FolderCheck className="w-3.5 h-3.5 text-green-400" /> Projets livrés
            </div>
            <div className="text-3xl font-black text-green-400">{totalCompleted}</div>
          </div>
          <div className={`border rounded-2xl p-5 ${card}`}>
            <div className={`flex items-center gap-2 mb-2 text-xs font-semibold ${textSecondary}`}>
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Heures travaillées
            </div>
            <div className="text-3xl font-black text-blue-400">{totalHours}h</div>
          </div>
        </div>

        {/* Ranking table */}
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b text-xs font-semibold ${tableHead}`}>
                <th className="text-left px-5 py-3">#</th>
                <th className="text-left px-5 py-3">Employé</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Rôle</th>
                <th className="text-center px-5 py-3">Projets</th>
                <th className="text-center px-5 py-3 hidden md:table-cell">Heures</th>
                <th className="text-center px-5 py-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 && (
                <tr><td colSpan={6} className={`px-5 py-8 text-center text-sm ${textSecondary}`}>Aucun employé actif.</td></tr>
              )}
              {stats.map((emp, idx) => (
                <tr key={emp.id} className={`border-b transition-colors ${tableRow}`}>
                  <td className={`px-5 py-3.5 text-sm font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-400' : idx === 2 ? 'text-orange-400' : textSecondary}`}>
                    {idx + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                        {emp.name.charAt(0)}
                      </div>
                      <span className={`text-sm font-medium ${textPrimary}`}>{emp.name}</span>
                    </div>
                  </td>
                  <td className={`px-5 py-3.5 hidden sm:table-cell text-xs ${textSecondary}`}>{emp.role}</td>
                  <td className={`px-5 py-3.5 text-center text-sm font-bold ${textPrimary}`}>{emp.completed}</td>
                  <td className={`px-5 py-3.5 hidden md:table-cell text-center text-sm ${textSecondary}`}>{emp.hours}h</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md border ${emp.grade.bg} ${emp.grade.color} ${emp.grade.border}`}>
                      {emp.grade.icon} {emp.grade.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
