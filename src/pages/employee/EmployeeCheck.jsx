import React, { useState, useEffect } from 'react'
import { Clock, LogIn, LogOut } from 'lucide-react'
import Layout from '../../components/Layout'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { EMPLOYEE_NAV } from './EmployeeDashboard'

export default function EmployeeCheck() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [todayCheck, setTodayCheck] = useState(null)
  const [history, setHistory] = useState([])
  const [time, setTime] = useState(new Date())

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const tableRow = isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-gray-100 hover:bg-gray-50'
  const tableHead = isDark ? 'text-zinc-400 border-zinc-800' : 'text-gray-500 border-gray-200'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'
  const doneBg = isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { load() }, [user])

  const load = () => {
    const all = Store.getCheckIns().filter(c => c.employee_email === user?.email)
    const today = new Date().toISOString().split('T')[0]
    setTodayCheck(all.find(c => c.date === today) || null)
    setHistory(all.filter(c => c.date !== today).slice(0, 10))
  }

  const handleCheckIn = () => {
    const today = new Date().toISOString().split('T')[0]
    const now = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const check = Store.addCheckIn({
      employee_email: user.email,
      employee_name: user.name,
      date: today,
      check_in: now,
      check_out: null,
    })
    setTodayCheck(check)
  }

  const handleCheckOut = () => {
    if (!todayCheck) return
    const now = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    Store.updateCheckIn(todayCheck.id, { check_out: now })
    load()
  }

  const calcDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-'
    const [h1, m1] = checkIn.split(':').map(Number)
    const [h2, m2] = checkOut.split(':').map(Number)
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (mins < 0) return '-'
    return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}`
  }

  const isCheckedIn = todayCheck?.check_in && !todayCheck?.check_out
  const isCheckedOut = todayCheck?.check_in && todayCheck?.check_out

  return (
    <Layout navItems={EMPLOYEE_NAV} title="Check-in / Check-out">
      <div className="space-y-6 max-w-2xl">
        <div className={`border rounded-2xl p-6 text-center ${card}`}>
          <p className={`text-sm mb-2 ${textSecondary}`}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className={`text-5xl font-bold tabular-nums ${textPrimary}`}>{time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
        </div>

        <div className={`rounded-2xl p-6 border-2 ${isCheckedIn ? 'bg-green-500/5 border-green-500/30' : isCheckedOut ? 'bg-blue-500/5 border-blue-500/30' : (isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200')}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isCheckedIn ? 'bg-green-500/20' : isCheckedOut ? 'bg-blue-500/20' : (isDark ? 'bg-zinc-800' : 'bg-gray-100')}`}>
              <Clock className={`w-7 h-7 ${isCheckedIn ? 'text-green-400' : isCheckedOut ? 'text-blue-400' : textSecondary}`} />
            </div>
            <div>
              <p className={`font-bold text-lg ${textPrimary}`}>
                {isCheckedOut ? 'Session terminée' : isCheckedIn ? 'En service' : 'Non pointé'}
              </p>
              {todayCheck?.check_in && (
                <p className={`text-sm ${textSecondary}`}>Arrivée : {todayCheck.check_in}{todayCheck.check_out ? ` · Départ : ${todayCheck.check_out}` : ''}</p>
              )}
              {isCheckedOut && (
                <p className={`text-sm ${textSecondary}`}>Durée : {calcDuration(todayCheck.check_in, todayCheck.check_out)}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {!todayCheck && (
              <button onClick={handleCheckIn} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors">
                <LogIn className="w-5 h-5" /> Pointer l'arrivée
              </button>
            )}
            {isCheckedIn && (
              <button onClick={handleCheckOut} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors">
                <LogOut className="w-5 h-5" /> Pointer le départ
              </button>
            )}
            {isCheckedOut && (
              <div className={`flex-1 rounded-xl py-3 text-center text-sm ${doneBg}`}>
                Journée terminée ✓
              </div>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <div className={`p-4 border-b ${divider}`}>
              <h3 className={`font-semibold ${textPrimary}`}>Historique récent</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs border-b ${tableHead}`}>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Arrivée</th>
                  <th className="text-left px-4 py-2">Départ</th>
                  <th className="text-left px-4 py-2">Durée</th>
                </tr>
              </thead>
              <tbody>
                {history.map(c => (
                  <tr key={c.id} className={`border-b transition-colors ${tableRow}`}>
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{formatDate(c.date)}</td>
                    <td className="px-4 py-3 text-green-400">{c.check_in || '-'}</td>
                    <td className="px-4 py-3 text-red-400">{c.check_out || '-'}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{calcDuration(c.check_in, c.check_out)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
