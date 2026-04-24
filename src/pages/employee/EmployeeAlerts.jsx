import React, { useState, useEffect } from 'react'
import { Bell, Check, Clock, Film, FolderOpen, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { EMPLOYEE_NAV } from './EmployeeDashboard'
import { Store } from '../../data/store'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'

const ALERT_TYPES = [
  { key: 'Urgent',           cls: 'bg-red-500/20 text-red-400 border-red-500/30',       icon: Bell },
  { key: 'Retard',           cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Bell },
  { key: 'Retour',           cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    icon: Bell },
  { key: 'retour_livraison', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: FolderOpen },
  { key: 'assignation',      cls: 'bg-violet-500/20 text-violet-400 border-violet-500/30', icon: FolderOpen },
]

export default function EmployeeAlerts() {
  const { user } = useAuth()
  const { theme } = useApp()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const [alerts, setAlerts] = useState([])

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'

  function reload() {
    setAlerts(Store.getAlerts().filter(a => a.to_email === user?.email)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
  }

  useEffect(() => { reload() }, [user])

  function markRead(id) {
    Store.updateAlert(id, { status: 'read' })
    reload()
  }

  function markAllRead() {
    alerts.forEach(a => {
      if (a.status !== 'read' && a.status !== 'lu') Store.updateAlert(a.id, { status: 'read' })
    })
    reload()
  }

  function markTaskDone(alert) {
    Store.updateAlert(alert.id, { status: 'done' })
    // Notify all admins and chefs de projet
    const admins = Store.getAccounts().filter(
      a => a.type === 'admin' || ['admin', 'chef_projet'].includes(a.roleKey)
    )
    admins.forEach(admin => {
      Store.addAlert({
        to_email: admin.email,
        to_name: admin.name,
        from_name: user?.name || user?.email,
        from_email: user?.email,
        type: 'tache_accomplie',
        message: `${user?.name || user?.email} a accompli la tâche demandée pour le projet "${alert.project_title || 'inconnu'}".`,
        project_id: alert.project_id,
        project_title: alert.project_title,
      })
    })
    reload()
  }

  const unreadCount = alerts.filter(a => a.status !== 'read' && a.status !== 'lu').length

  return (
    <Layout navItems={EMPLOYEE_NAV} title="Alertes">
      <div className="space-y-6 max-w-2xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total reçues', value: alerts.length, color: 'text-violet-400' },
            { label: 'Non lues', value: unreadCount, color: 'text-red-400' },
            { label: 'Lues', value: alerts.length - unreadCount, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className={cn('border rounded-2xl p-5', card)}>
              <div className={cn('text-xs font-semibold mb-2', textSecondary)}>{s.label}</div>
              <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* List */}
        <div className={cn('border rounded-2xl overflow-hidden', card)}>
          <div className={cn('px-5 py-4 border-b flex items-center justify-between', isDark ? 'border-zinc-800' : 'border-gray-100')}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-400" />
              <h3 className={cn('font-semibold text-sm', textPrimary)}>Mes alertes</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className={cn('text-xs font-medium transition-colors', isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-700')}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className={cn('px-5 py-12 text-center', textSecondary)}>
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune alerte reçue</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: isDark ? '#27272a' : '#f3f4f6' }}>
              {alerts.map(alert => {
                const typeInfo = ALERT_TYPES.find(t => t.key === alert.type)
                const cls = typeInfo?.cls || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                const IconComp = typeInfo?.icon || Bell
                const isUnread = alert.status !== 'read' && alert.status !== 'lu'
                const isProjectAlert = alert.type === 'retour_livraison' || alert.type === 'assignation'
                const typeLabel = {
                  retour_livraison: 'Retour livraison',
                  assignation: 'Assignation',
                }[alert.type] || alert.type
                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      markRead(alert.id)
                      if (alert.type === 'Retour' && alert.reservation_id && alert.file_name) {
                        Store.setRetourPhase(alert.reservation_id, alert.file_name, 'seen')
                        navigate('/employee/rushes', { state: { openResId: alert.reservation_id, openFile: alert.file_name } })
                      } else if (isProjectAlert) {
                        navigate('/employee/projects')
                      }
                    }}
                    className={cn(
                      'px-5 py-4 flex items-start gap-4 cursor-pointer transition-colors',
                      isUnread ? (isDark ? 'bg-zinc-800/30' : 'bg-amber-50') : '',
                      isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cls.split(' ')[0])}>
                      <IconComp size={15} className={cls.split(' ')[1]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('text-xs font-bold', textPrimary)}>{alert.from_name || alert.from_email || 'Admin'}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', cls)}>{typeLabel}</span>
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                      </div>
                      <p className={cn('text-sm leading-relaxed', textPrimary)}>{alert.message}</p>
                      {alert.project_title && (
                        <div className={cn('flex items-center gap-1.5 mt-1.5 text-xs font-medium', textSecondary)}>
                          <FolderOpen size={11} />
                          <span className="truncate">{alert.project_title}</span>
                        </div>
                      )}
                      {alert.reservation_label && (
                        <div className={cn('flex items-center gap-1.5 mt-1.5 text-xs', textSecondary)}>
                          <Film size={11} />
                          <span className="truncate">{alert.reservation_label}</span>
                        </div>
                      )}
                      {isProjectAlert && (
                        <div className={cn('mt-2 text-xs font-semibold flex items-center gap-1', cls.split(' ')[1])}>
                          <FolderOpen size={11} /> Voir la carte dans To Do →
                        </div>
                      )}
                      {/* Tâche accomplie button */}
                      {isProjectAlert && alert.status !== 'done' && (
                        <button
                          onClick={e => { e.stopPropagation(); markTaskDone(alert) }}
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 text-xs font-semibold transition-colors"
                        >
                          <CheckCircle2 size={13} /> Marquer la tâche comme accomplie
                        </button>
                      )}
                      {isProjectAlert && alert.status === 'done' && (
                        <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-semibold w-fit">
                          <Check size={13} /> Tâche accomplie — retour envoyé
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={cn('text-xs', textSecondary)}>
                          {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={cn('flex items-center gap-1 text-xs', isUnread ? textSecondary : 'text-green-400')}>
                          {isUnread ? <><Clock size={10} /> Non lu</> : <><Check size={10} /> Lu</>}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
