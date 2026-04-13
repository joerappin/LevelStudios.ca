import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, MessageSquare, Clock, Calendar, Umbrella, UserCircle, Bell, Film, HardDrive, Medal } from 'lucide-react'
import Layout from '../../components/Layout'
import { Store } from '../../data/store'
import { createPageUrl } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'

const NAV = [
  { labelKey: 'nav_dashboard',    path: createPageUrl('EmployeeDashboard'), icon: <LayoutDashboard className="w-4 h-4" /> },
  { separator: true },
  { label: 'To do',               path: createPageUrl('EmployeeProjects'),  icon: <FolderOpen className="w-4 h-4" /> },
  { labelKey: 'nav_messaging',    path: createPageUrl('EmployeeMessaging'), icon: <MessageSquare className="w-4 h-4" /> },
  { labelKey: 'nav_check',        path: createPageUrl('EmployeeCheck'),     icon: <Clock className="w-4 h-4" /> },
  { labelKey: 'nav_calendar',     path: createPageUrl('EmployeeCalendar'),  icon: <Calendar className="w-4 h-4" /> },
  { label: 'Rushes',              path: '/employee/rushes',                 icon: <HardDrive className="w-4 h-4" /> },
  { labelKey: 'nav_leave',        path: createPageUrl('EmployeeLeave'),     icon: <Umbrella className="w-4 h-4" /> },
  { label: 'Alertes',             path: '/employee/alerts',                 icon: <Bell className="w-4 h-4" /> },
  { separator: true },
  { labelKey: 'nav_profile',      path: '/employee/account',                icon: <UserCircle className="w-4 h-4" /> },
]

export { NAV as EMPLOYEE_NAV }

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [data, setData] = useState({ projects: [], checkIns: [], leaveRequests: [], messages: [] })

  function getGrade(count) {
    if (count >= 10) return { label: 'Gold',   icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' }
    if (count >= 4)  return { label: 'Argent', icon: '🥈', color: 'text-zinc-300',   bg: 'bg-zinc-500/10',   border: 'border-zinc-500/30' }
    return                  { label: 'Bronze', icon: '🥉', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' }
  }

  const timerRef = useRef(null)
  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'

  useEffect(() => {
    if (user?.roleKey === 'chef_projet' || user?.role === 'Chef de projet') {
      navigate('/chef/dashboard')
      return
    }

    const loadData = () => {
      const projects = Store.getProjects().filter(p => p.assigned_to === user?.email)
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const checkIns = Store.getCheckIns().filter(c => c.employee_email === user?.email)
      const todayCheck = checkIns.find(c => c.date === today)
      const leaveRequests = Store.getLeaveRequests().filter(l => l.employee_email === user?.email)
      const messages = Store.getInternalMessages().filter(m => m.to_email === user?.email && !m.read)
      const alerts = Store.getAlerts().filter(a => a.to_email === user?.email)
      // Performance du mois
      const monthProjects = projects.filter(p => {
        const d = new Date(p.created_at)
        return (p.status === 'Livré' || p.status === 'Archivé') && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      const argent = monthProjects.filter(p => p.formule === 'ARGENT' || p.service === 'ARGENT').length
      const gold   = monthProjects.filter(p => p.formule === 'GOLD'   || p.service === 'GOLD').length
      setData({ projects, checkIns, todayCheck, leaveRequests, messages, alerts, monthProjects, argent, gold })
    }

    loadData()
    timerRef.current = setInterval(loadData, 30000)
    return () => clearInterval(timerRef.current)
  }, [user, navigate])

  return (
    <Layout navItems={NAV} title="Mon espace">
      <div className="space-y-6">
        <div>
          <h2 className={`text-2xl font-bold mb-1 ${textPrimary}`}>Bonjour, {user?.name?.split(' ')[0]}</h2>
          <p className={`text-sm ${textSecondary}`}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Check-in status */}
        <div className={`rounded-2xl p-5 border ${data.todayCheck?.check_in && !data.todayCheck?.check_out ? 'bg-green-500/5 border-green-500/20' : (isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.todayCheck?.check_in ? 'bg-green-500/20' : (isDark ? 'bg-zinc-800' : 'bg-gray-100')}`}>
                <Clock className={`w-5 h-5 ${data.todayCheck?.check_in ? 'text-green-400' : textSecondary}`} />
              </div>
              <div>
                <div className={`font-semibold text-sm ${textPrimary}`}>
                  {data.todayCheck?.check_in && !data.todayCheck?.check_out ? 'Vous êtes en poste' :
                    data.todayCheck?.check_out ? 'Session terminée' : 'Pas encore pointé'}
                </div>
                <div className={`text-xs ${textSecondary}`}>
                  {data.todayCheck?.check_in ? `Arrivée : ${data.todayCheck.check_in}` : 'Check-in requis'}
                  {data.todayCheck?.check_out && ` · Départ : ${data.todayCheck.check_out}`}
                </div>
              </div>
            </div>
            <button onClick={() => navigate(createPageUrl('EmployeeCheck'))} className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
              {data.todayCheck?.check_in && !data.todayCheck?.check_out ? 'Pointer départ' : 'Check-in'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Projets assignés', value: data.projects?.length || 0, icon: <FolderOpen className="w-4 h-4" />, color: 'text-blue-400', nav: () => navigate(createPageUrl('EmployeeProjects')) },
            { label: 'Messages non lus', value: data.messages?.length || 0, icon: <MessageSquare className="w-4 h-4" />, color: 'text-purple-400', nav: () => navigate(createPageUrl('EmployeeMessaging')) },
            { label: 'Congés en attente', value: data.leaveRequests?.filter(l => l.status === 'pending').length || 0, icon: <Umbrella className="w-4 h-4" />, color: 'text-yellow-400', nav: () => navigate(createPageUrl('EmployeeLeave')) },
            { label: 'Alertes non lues', value: data.alerts?.filter(a => a.status !== 'read' && a.status !== 'lu').length || 0, icon: <Bell className="w-4 h-4" />, color: 'text-red-400', nav: () => navigate('/employee/alerts') },
          ].map((c, i) => (
            <button key={i} onClick={c.nav} className={`border rounded-2xl p-5 text-left transition-colors ${card} ${isDark ? 'hover:border-zinc-600' : 'hover:border-gray-300'}`}>
              <div className={`flex items-center gap-2 mb-2 ${c.color}`}>{c.icon}<span className={`text-xs ${textSecondary}`}>{c.label}</span></div>
              <div className={`text-2xl font-black ${textPrimary}`}>{c.value}</div>
            </button>
          ))}
        </div>

        {/* Alertes */}
        {data.alerts?.length > 0 && (
          <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <button onClick={() => navigate('/employee/alerts')} className={`w-full px-5 py-4 border-b flex items-center gap-2 text-left ${divider} ${isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'} transition-colors`}>
              <Bell className="w-4 h-4 text-red-400" />
              <h3 className={`font-semibold text-sm flex-1 ${textPrimary}`}>Alertes reçues</h3>
              {data.alerts.filter(a => a.status !== 'read' && a.status !== 'lu').length > 0 && (
                <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                  {data.alerts.filter(a => a.status !== 'read' && a.status !== 'lu').length}
                </span>
              )}
            </button>
            <div className="divide-y" style={{ borderColor: isDark ? '#27272a' : '#f3f4f6' }}>
              {data.alerts.slice(0, 5).map(alert => {
                const TYPE_CLS = {
                  Urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
                  Retard: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                  Retour: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                }
                const cls = TYPE_CLS[alert.type] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                const isUnread = alert.status !== 'read' && alert.status !== 'lu'
                return (
                  <div
                    key={alert.id}
                    onClick={() => navigate('/employee/alerts')}
                    className={`px-5 py-4 flex items-start gap-3 cursor-pointer transition-colors ${isUnread ? (isDark ? 'bg-zinc-800/30' : 'bg-yellow-50') : ''} ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cls.split(' ')[0]}`}>
                      <Bell size={14} className={cls.split(' ')[1]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold ${textPrimary}`}>{alert.from_name || alert.from_email}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cls}`}>{alert.type}</span>
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                      </div>
                      <p className={`text-sm ${textPrimary}`}>{alert.message}</p>
                      {alert.reservation_label && (
                        <div className={`flex items-center gap-1 mt-0.5 text-xs ${textSecondary}`}>
                          <Film size={10} />
                          <span className="truncate">{alert.reservation_label}</span>
                        </div>
                      )}
                      <p className={`text-xs mt-1 ${textSecondary}`}>
                        {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Performance du mois */}
        {(() => {
          const grade = getGrade(data.monthProjects?.length || 0)
          return (
            <div className={`border rounded-2xl p-5 ${card}`}>
              <div className="flex items-center gap-2 mb-4">
                <Medal className="w-4 h-4 text-violet-400" />
                <h3 className={`font-semibold text-sm ${textPrimary}`}>Performance du mois</h3>
                <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-md border ${grade.bg} ${grade.color} ${grade.border}`}>
                  {grade.icon} {grade.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-xl p-3 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                  <div className={`text-2xl font-black ${textPrimary}`}>{data.monthProjects?.length || 0}</div>
                  <div className={`text-xs ${textSecondary}`}>Projets livrés</div>
                </div>
                <div className={`rounded-xl p-3 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                  <div className="text-2xl font-black text-blue-400">{data.argent || 0}</div>
                  <div className={`text-xs ${textSecondary}`}>Offre Argent</div>
                </div>
                <div className={`rounded-xl p-3 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                  <div className="text-2xl font-black text-yellow-400">{data.gold || 0}</div>
                  <div className={`text-xs ${textSecondary}`}>Offre Gold</div>
                </div>
              </div>
            </div>
          )
        })()}

        <div className={`border rounded-2xl p-6 ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${textPrimary}`}>Mes projets en cours</h3>
            <button onClick={() => navigate(createPageUrl('EmployeeProjects'))} className={`text-xs transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>Voir tout</button>
          </div>
          {data.projects?.length === 0 ? (
            <p className={`text-sm ${textSecondary}`}>Aucun projet assigné.</p>
          ) : data.projects?.filter(p => p.status !== 'Archivé').slice(0, 4).map(p => (
            <div key={p.id} className={`flex items-center justify-between py-2.5 border-b last:border-0 ${divider}`}>
              <div>
                <div className={`text-sm font-medium ${textPrimary}`}>{p.title}</div>
                <div className={`text-xs ${textSecondary}`}>{p.client_name} · {p.studio}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${p.status === 'En cours' ? 'bg-blue-500/10 text-blue-400' : p.status === 'Livré' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
