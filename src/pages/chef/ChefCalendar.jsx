import React from 'react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import { Store } from '../../data/store'
import StudioCalendar from '../../components/StudioCalendar'
import { useReservations } from '../../hooks/useReservations'
import { useAuth } from '../../contexts/AuthContext'

export default function ChefCalendar() {
  const { user } = useAuth()
  const { reservations, reload } = useReservations()

  const handleDelete = (id) => {
    Store.updateReservation(id, { trashed: true })
    reload()
  }

  const handleUpdate = (id, patch) => {
    Store.updateReservation(id, { ...patch, modified_by: user?.email || 'chef' })
    reload()
  }

  return (
    <Layout navItems={CHEF_NAV} title="Calendrier">
      <StudioCalendar
        reservations={reservations}
        showClientDetails={true}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </Layout>
  )
}
