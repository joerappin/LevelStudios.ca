import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, ClipboardList, FolderOpen,
  Bell, HardDrive, MessageSquare, UserCircle, Clock, TrendingUp,
  Users, CheckCircle, AlertCircle, PlusCircle, Headphones, Medal
} from 'lucide-react'
import Layout from '../../components/Layout'
import { Store } from '../../data/store'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'

export const CHEF_NAV = [
  { label: 'Accueil',      path: '/chef/dashboard',    icon: <LayoutDashboard className="w-4 h-4" /> },
  { separator: true },
  { label: 'Calendrier',   path: '/chef/calendar',     icon: <Calendar className="w-4 h-4" /> },
  { label: 'Réservations', path: '/chef/reservations', icon: <ClipboardList className="w-4 h-4" /> },
  { label: 'Projets',      path: '/chef/projects',     icon: <FolderOpen className="w-4 h-4" /> },
  { label: 'Alertes',      path: '/chef/alerts',       icon: <Bell className="w-4 h-4" /> },
  { label: 'Rushes',       path: '/chef/rushes',       icon: <HardDrive className="w-4 h-4" /> },
  { label: 'Messagerie',   path: '/chef/messaging',    icon: <MessageSquare className="w-4 h-4" /> },
  { label: 'Performance',  path: '/chef/perf',         icon: <Medal className="w-4 h-4" /> },
  { label: 'SAV',          path: '/chef/sav',          icon: <Headphones className="w-4 h-4" /> },
  { separator: true },
  { label: 'Profil',       path: '/chef/account',      icon: <UserCircle className="w-4 h-4" /> },
]

const STUDIOS = ['Studio A', 'Studio B', 'Studio C']

function getWeekDays() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function ChefDashboard() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [period, setPeriod] = useState('mois')
  const [reservations, setReservations] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [alertCount, setAlertCount] = useState(0)

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'

  useEffect(() => {
    setReservations(Store.getReservations())
    setCheckIns(Store.getCheckIns())
    const unread = Store.getAlerts().filter(a => a.status === 'sent').length
    setAlertCount(unread)
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayCheck = checkIns.find(c => c.employee_email === user?.email && c.date === today)

  // Filter by period
  const now = new Date()
  const filtered = reservations.filter(r => {
    const d = new Date(r.date)
    if (period === 'jour') return r.date === today
    if (period === 'mois') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (period === 'annee') return d.getFullYear() === now.getFullYear()
    return true
  })

  const totalHours = filtered.reduce((s, r) => s + (r.duration || 0), 0)
  const totalRevenue = filtered.reduce((s, r) => s + (r.price || 0), 0)
  const paid = filtered.filter(r => r.status === 'validee' || r.status === 'livree').length
  const pending = filtered.filter(r => r.status === 'en_attente' || r.status === 'pending').length

  const studioStats = STUDIOS.map(studio => {
    const studioRes = filtered.filter(r => r.studio === studio)
    const hours = studioRes.reduce((s, r) => s + (r.duration || 0), 0)
    const totalPossible = period === 'jour' ? 12 : period === 'mois' ? 12 * 30 : 12 * 365
    const rate = totalPossible > 0 ? Math.min(100, Math.round((hours / totalPossible) * 100)) : 0
    return { studio, hours, rate, count: studioRes.length }
  })

  const uniqueClients = new Set(filtered.map(r => r.client_email)).size

  // Week calendar
  const weekDays = getWeekDays()
  const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <Layout navItems={CHEF_NAV} title="Accueil">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className={cn('text-2xl font-bold mb-1', textPrimary)}>Bonjour, {user?.name?.split(' ')[0]}</h2>
            <p className={cn('text-sm', textSecondary)}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Alert badge */}
            <button
              onClick={() => navigate('/chef/alerts')}
              className={cn('relative p-2 rounded-xl transition-colors', isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200')}
            >
              <Bell className={cn('w-4 h-4', alertCount > 0 ? 'text-red-400' : textSecondary)} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {alertCount}
                </span>
              )}
            </button>
            {/* Period selector */}
            <div className="flex gap-1.5">
              {['jour', 'mois', 'annee'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                    period === p
                      ? 'bg-violet-600 text-white'
                      : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                  )}
                >
                  {p === 'annee' ? 'Année' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Check-in strip */}
        <div className={cn('rounded-2xl p-5 border', todayCheck?.check_in && !todayCheck?.check_out ? 'bg-green-500/5 border-green-500/20' : `${card} border`)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', todayCheck?.check_in ? 'bg-green-500/20' : isDark ? 'bg-zinc-800' : 'bg-gray-100')}>
                <Clock className={cn('w-5 h-5', todayCheck?.check_in ? 'text-green-400' : textSecondary)} />
              </div>
              <div>
                <div className={cn('font-semibold text-sm', textPrimary)}>
                  {todayCheck?.check_in && !todayCheck?.check_out ? 'Vous êtes en poste' :
                    todayCheck?.check_out ? 'Session terminée' : 'Pas encore pointé'}
                </div>
                <div className={cn('text-xs', textSecondary)}>
                  {todayCheck?.check_in ? `Arrivée : ${todayCheck.check_in}` : 'Check-in requis'}
                  {todayCheck?.check_out && ` · Départ : ${todayCheck.check_out}`}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/employee/check')}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {todayCheck?.check_in && !todayCheck?.check_out ? 'Pointer départ' : 'Check-in'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {studioStats.map(s => (
            <div key={s.studio} className={cn('border rounded-2xl p-5', card)}>
              <div className={cn('text-xs font-semibold mb-3', textSecondary)}>{s.studio}</div>
              <div className={cn('text-2xl font-black mb-1', textPrimary)}>{s.hours}h</div>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('flex-1 h-1.5 rounded-full', isDark ? 'bg-zinc-800' : 'bg-gray-200')}>
                  <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${s.rate}%` }} />
                </div>
                <span className={cn('text-xs font-medium', textSecondary)}>{s.rate}%</span>
              </div>
              <div className={cn('text-xs', textSecondary)}>{s.count} session{s.count !== 1 ? 's' : ''}</div>
            </div>
          ))}
          <div className={cn('border rounded-2xl p-5', card)}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <span className={cn('text-xs font-semibold', textSecondary)}>Clients actifs</span>
            </div>
            <div className={cn('text-2xl font-black', textPrimary)}>{uniqueClients}</div>
          </div>
          <div className={cn('border rounded-2xl p-5', card)}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className={cn('text-xs font-semibold', textSecondary)}>Sessions payées</span>
            </div>
            <div className={cn('text-2xl font-black', textPrimary)}>{paid}</div>
          </div>
          <div className={cn('border rounded-2xl p-5', card)}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className={cn('text-xs font-semibold', textSecondary)}>En attente paiement</span>
            </div>
            <div className={cn('text-2xl font-black', textPrimary)}>{pending}</div>
          </div>
        </div>

        {/* Total hours */}
        <div className={cn('border rounded-2xl p-5 flex items-center gap-4', card)}>
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className={cn('text-xs font-semibold', textSecondary)}>Heures réservées — total période</div>
            <div className={cn('text-2xl font-black', textPrimary)}>{totalHours}h</div>
          </div>
        </div>

        {/* Weekly mini calendar */}
        <div className={cn('border rounded-2xl p-5', card)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('font-semibold text-sm', textPrimary)}>Semaine en cours</h3>
            <button
              onClick={() => navigate('/chef/calendar')}
              className={cn('text-xs transition-colors', isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-700')}
            >
              Calendrier complet
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const dateStr = day.toISOString().split('T')[0]
              const dayRes = reservations.filter(r => r.date === dateStr)
              const isToday = dateStr === today
              return (
                <div key={i} className={cn('rounded-xl p-2 text-center', isToday ? 'bg-violet-600' : isDark ? 'bg-zinc-800' : 'bg-gray-100')}>
                  <div className={cn('text-[10px] font-medium mb-1', isToday ? 'text-white/70' : textSecondary)}>{DAY_LABELS[i]}</div>
                  <div className={cn('text-sm font-bold', isToday ? 'text-white' : textPrimary)}>{day.getDate()}</div>
                  {dayRes.length > 0 && (
                    <div className={cn('mt-1 text-[10px] font-bold px-1 rounded-full', isToday ? 'bg-white/20 text-white' : 'bg-violet-500/20 text-violet-400')}>
                      {dayRes.length}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick access */}
        <div className={cn('border rounded-2xl p-5', card)}>
          <h3 className={cn('font-semibold text-sm mb-4', textPrimary)}>Accès rapide</h3>
          <button
            onClick={() => navigate('/reservation')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Nouvelle réservation
          </button>
        </div>
      </div>
    </Layout>
  )
}
