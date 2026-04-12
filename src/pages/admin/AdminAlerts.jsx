import React, { useState, useEffect } from 'react'
import { Bell, Send, Check, Clock, Film, AlertTriangle, AlertCircle, RotateCcw } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'
import { useReservations } from '../../hooks/useReservations'

const ALERT_TYPES = [
  { key: 'Retard',  label: 'Retard',  icon: Clock,          cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { key: 'Retour',  label: 'Retour',  icon: RotateCcw,      cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'Urgent',  label: 'Urgent',  icon: AlertTriangle,  cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
]

function reservationLabel(r) {
  return `${r.date} · ${r.start_time}–${r.end_time} · ${r.client_name} · ${r.studio}`
}

export default function AdminAlerts() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const { reservations } = useReservations({ interval: 60000 })
  const [employees, setEmployees] = useState([])
  const [alerts, setAlerts] = useState([])
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [alertType, setAlertType] = useState('Urgent')
  const [message, setMessage] = useState('')
  const [linkedReservation, setLinkedReservation] = useState('')
  const [sent, setSent] = useState(false)

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const inputClass = isDark
    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-500'

  useEffect(() => {
    setEmployees(Store.getEmployees())
    setAlerts(Store.getAlerts())
  }, [])

  function toggleRecipient(email) {
    setSelectedRecipients(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    )
  }

  function handleSend(e) {
    e.preventDefault()
    if (!selectedRecipients.length || !message.trim()) return
    const res = linkedReservation ? reservations.find(r => r.id === linkedReservation) : null
    selectedRecipients.forEach(email => {
      Store.addAlert({
        from_email: user?.email,
        from_name: user?.name,
        to_email: email,
        to_name: employees.find(emp => emp.email === email)?.name || email,
        type: alertType,
        message,
        reservation_id: res?.id || null,
        reservation_label: res ? reservationLabel(res) : null,
      })
    })
    setAlerts(Store.getAlerts())
    setSent(true)
    setMessage('')
    setSelectedRecipients([])
    setLinkedReservation('')
    setTimeout(() => setSent(false), 3000)
  }

  const totalAlerts = alerts.length
  const readAlerts = alerts.filter(a => a.status === 'read' || a.status === 'lu').length
  const unreadAlerts = totalAlerts - readAlerts
  const readRate = totalAlerts > 0 ? Math.round((readAlerts / totalAlerts) * 100) : 0

  return (
    <Layout navItems={ADMIN_NAV} title="Alertes">
      <div className="space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total envoyées', value: totalAlerts,  color: 'text-violet-400' },
            { label: 'Non lues',       value: unreadAlerts, color: unreadAlerts > 0 ? 'text-red-400' : 'text-zinc-400' },
            { label: 'Lues',           value: readAlerts,   color: 'text-green-400' },
            { label: 'Taux de lecture',value: `${readRate}%`, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className={cn('border rounded-2xl p-4', card)}>
              <div className={cn('text-xs font-medium mb-1.5', textSecondary)}>{s.label}</div>
              <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Main 2-col layout */}
        <div className="grid lg:grid-cols-[400px_1fr] gap-5 items-start">

          {/* Left — Send form */}
          <div className={cn('border rounded-2xl p-6', card)}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-violet-400" />
              </div>
              <h3 className={cn('font-semibold', textPrimary)}>Envoyer une alerte</h3>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              {/* Recipients */}
              <div>
                <label className={cn('block text-xs font-medium mb-2', textSecondary)}>Destinataires</label>
                <div className="flex flex-wrap gap-2">
                  {employees.length === 0 && (
                    <span className={cn('text-xs', textSecondary)}>Aucun employé</span>
                  )}
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleRecipient(emp.email)}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                        selectedRecipients.includes(emp.email)
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : isDark ? 'border-zinc-700 text-zinc-400 hover:border-violet-500' : 'border-gray-300 text-gray-600 hover:border-violet-400'
                      )}
                    >
                      {emp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className={cn('block text-xs font-medium mb-2', textSecondary)}>Type d'alerte</label>
                <div className="flex gap-2">
                  {ALERT_TYPES.map(t => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setAlertType(t.key)}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                          alertType === t.key ? t.cls : isDark ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500' : 'border-gray-300 text-gray-500 hover:border-gray-400'
                        )}
                      >
                        <Icon size={11} />
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tournage lié */}
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                  <Film size={11} className="inline mr-1" />
                  Tournage concerné <span className={textSecondary}>(facultatif)</span>
                </label>
                <select
                  value={linkedReservation}
                  onChange={e => setLinkedReservation(e.target.value)}
                  className={cn('w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors', inputClass)}
                >
                  <option value="">— Aucun tournage spécifique</option>
                  {[...reservations].sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => (
                    <option key={r.id} value={r.id}>{reservationLabel(r)}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Décrivez l'alerte..."
                  className={cn('w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-colors resize-none', inputClass)}
                />
              </div>

              <button
                type="submit"
                disabled={!selectedRecipients.length || !message.trim()}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                {sent ? <Check size={14} /> : <Send size={14} />}
                {sent ? 'Envoyée !' : "Envoyer l'alerte"}
              </button>
            </form>
          </div>

          {/* Right — History */}
          <div className={cn('border rounded-2xl overflow-hidden', card)}>
            <div className={cn('px-5 py-4 border-b flex items-center justify-between', isDark ? 'border-zinc-800' : 'border-gray-100')}>
              <h3 className={cn('font-semibold text-sm', textPrimary)}>Historique des alertes</h3>
              {unreadAlerts > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {unreadAlerts} non lue{unreadAlerts > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {alerts.length === 0 ? (
              <div className={cn('flex flex-col items-center justify-center py-16 gap-2', textSecondary)}>
                <Bell className="w-8 h-8 opacity-20" />
                <p className="text-sm">Aucune alerte envoyée</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: isDark ? '#27272a' : '#f3f4f6' }}>
                {alerts.map(alert => {
                  const typeInfo = ALERT_TYPES.find(t => t.key === alert.type)
                  const Icon = typeInfo?.icon || AlertCircle
                  const isRead = alert.status === 'read' || alert.status === 'lu'
                  return (
                    <div
                      key={alert.id}
                      className={cn('px-5 py-4 flex items-start gap-4 transition-colors', !isRead && (isDark ? 'bg-zinc-800/30' : 'bg-violet-50/40'), isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50', 'cursor-pointer')}
                      onClick={() => { Store.updateAlert(alert.id, { status: 'read' }); setAlerts(Store.getAlerts()) }}
                    >
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', typeInfo?.cls || 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30')}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-sm font-semibold truncate', textPrimary)}>{alert.to_name || alert.to_email}</span>
                          <span className={cn('flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border font-semibold', typeInfo?.cls || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30')}>
                            {alert.type}
                          </span>
                          {!isRead && <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-violet-500" />}
                        </div>
                        <p className={cn('text-sm leading-snug', textPrimary)}>{alert.message}</p>
                        {alert.reservation_label && (
                          <div className={cn('flex items-center gap-1 mt-1.5 text-xs', textSecondary)}>
                            <Film size={10} className="flex-shrink-0" />
                            <span className="truncate">{alert.reservation_label}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={cn('text-xs', textSecondary)}>
                            {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={cn('flex items-center gap-1 text-xs', isRead ? 'text-green-400' : textSecondary)}>
                            {isRead ? <><Check size={10} /> Lu</> : <><Clock size={10} /> Non lu</>}
                          </span>
                          {alert.from_name && (
                            <span className={cn('text-xs', textSecondary)}>· de {alert.from_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  )
}
