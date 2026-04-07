import React, { useState, useEffect } from 'react'
import { Plus, Umbrella } from 'lucide-react'
import Layout from '../../components/Layout'
import { Store } from '../../data/store'
import { formatDate } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { Modal } from '../../components/ui/modal'
import { EMPLOYEE_NAV } from './EmployeeDashboard'

const STATUS_COLORS = {
  pending:  'bg-yellow-900/30 text-yellow-300 border border-yellow-800',
  approved: 'bg-green-900/30 text-green-300 border border-green-800',
  rejected: 'bg-red-900/30 text-red-300 border border-red-800',
}
const STATUS_COLORS_LIGHT = {
  pending:  'bg-yellow-50 text-yellow-700 border border-yellow-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
}
const STATUS_LABELS = { pending: 'En attente', approved: 'Approuvé', rejected: 'Refusé' }

export default function EmployeeLeave() {
  const { user } = useAuth()
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [requests, setRequests] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'conge', start_date: '', end_date: '', reason: '' })

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const inputCls = isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const labelCls = isDark ? 'text-zinc-300' : 'text-gray-700'
  const btnCancel = isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'

  useEffect(() => { load() }, [user])

  const load = () => {
    setRequests(Store.getLeaveRequests().filter(r => r.employee_email === user?.email))
  }

  const submit = (e) => {
    e.preventDefault()
    Store.addLeaveRequest({
      employee_email: user.email,
      employee_name: user.name,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason,
      status: 'pending',
    })
    setShowModal(false)
    setForm({ type: 'conge', start_date: '', end_date: '', reason: '' })
    load()
  }

  const statusCls = (status) => isDark ? STATUS_COLORS[status] : STATUS_COLORS_LIGHT[status]

  return (
    <Layout navItems={EMPLOYEE_NAV} title="Congés & absences">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${textPrimary}`}>Mes demandes</h2>
          <button onClick={() => setShowModal(true)} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle demande
          </button>
        </div>

        {requests.length === 0 ? (
          <div className={`border rounded-2xl p-12 text-center ${card}`}>
            <Umbrella className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-zinc-600' : 'text-gray-300'}`} />
            <p className={textSecondary}>Aucune demande de congé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className={`border rounded-2xl p-5 flex items-start justify-between gap-4 ${card}`}>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusCls(r.status) || ''}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <span className={`text-sm capitalize ${textSecondary}`}>{r.type}</span>
                  </div>
                  <p className={`text-sm font-medium ${textPrimary}`}>
                    {formatDate(r.start_date)} → {formatDate(r.end_date)}
                  </p>
                  {r.reason && <p className={`text-xs mt-1 ${textSecondary}`}>{r.reason}</p>}
                </div>
                <p className={`text-xs whitespace-nowrap ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>{formatDate(r.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvelle demande de congé">
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${labelCls}`}>Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`}>
              <option value="conge">Congé payé</option>
              <option value="maladie">Arrêt maladie</option>
              <option value="rtt">RTT</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm mb-1 ${labelCls}`}>Date de début</label>
              <input type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${labelCls}`}>Date de fin</label>
              <input type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${inputCls}`} />
            </div>
          </div>
          <div>
            <label className={`block text-sm mb-1 ${labelCls}`}>Motif (optionnel)</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none ${inputCls}`}
              placeholder="Précisez le motif si nécessaire..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowModal(false)} className={`flex-1 rounded-xl py-2.5 font-medium transition-colors ${btnCancel}`}>
              Annuler
            </button>
            <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 font-medium transition-colors">
              Envoyer la demande
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
