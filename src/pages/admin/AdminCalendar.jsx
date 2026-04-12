import React from 'react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import StudioCalendar from '../../components/StudioCalendar'
import { useReservations } from '../../hooks/useReservations'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminCalendar() {
  const { user } = useAuth()
  const { reservations, reload } = useReservations()

  const handleDelete = (id) => {
    Store.updateReservation(id, { trashed: true })
    reload()
  }

  const handleUpdate = (id, patch) => {
    Store.updateReservation(id, { ...patch, modified_by: user?.email || 'admin' })
    reload()
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Calendrier">
      <StudioCalendar
        reservations={reservations}
        showClientDetails={true}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </Layout>
  )
}
