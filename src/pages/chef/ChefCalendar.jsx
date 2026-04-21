import React from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import { Store } from '../../data/store'
import StudioCalendar from '../../components/StudioCalendar'
import { useReservations } from '../../hooks/useReservations'
import { useAuth } from '../../contexts/AuthContext'
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar'

export default function ChefCalendar() {
  const { user } = useAuth()
  const { reservations, reload } = useReservations()
  const navigate = useNavigate()
  const { syncUpdate, syncDelete } = useGoogleCalendar()

  const handleDelete = (id) => {
    const res = Store.getAllReservations().find(r => r.id === id)
    Store.updateReservation(id, { trashed: true })
    reload()
    if (res) syncDelete(res)
  }

  const handleUpdate = (id, patch) => {
    Store.updateReservation(id, { ...patch, modified_by: user?.email || 'chef' })
    reload()
    const res = Store.getAllReservations().find(r => r.id === id)
    if (res) syncUpdate({ ...res, ...patch })
  }

  return (
    <Layout navItems={CHEF_NAV} title="Calendrier">
      <StudioCalendar
        reservations={reservations}
        showClientDetails={true}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onDayDoubleClick={(date) => navigate('/chef/reservations', { state: { openCreate: true, date } })}
      />
    </Layout>
  )
}
