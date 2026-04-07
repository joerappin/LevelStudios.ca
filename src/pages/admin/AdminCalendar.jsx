import React from 'react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import StudioCalendar from '../../components/StudioCalendar'

export default function AdminCalendar() {
  const reservations = Store.getReservations()
  return (
    <Layout navItems={ADMIN_NAV} title="Calendrier">
      <StudioCalendar reservations={reservations} showClientDetails={true} />
    </Layout>
  )
}
