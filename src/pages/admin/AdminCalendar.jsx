import React from 'react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import StudioCalendar from '../../components/StudioCalendar'
import { useReservations } from '../../hooks/useReservations'

export default function AdminCalendar() {
  const { reservations, reload } = useReservations()

  const handleDelete = (id) => {
    Store.updateReservation(id, { trashed: true })
    reload()
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Calendrier">
      <StudioCalendar reservations={reservations} showClientDetails={true} onDelete={handleDelete} />
    </Layout>
  )
}
