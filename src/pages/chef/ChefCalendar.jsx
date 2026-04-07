import React from 'react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import { Store } from '../../data/store'
import StudioCalendar from '../../components/StudioCalendar'

export default function ChefCalendar() {
  const reservations = Store.getReservations()
  return (
    <Layout navItems={CHEF_NAV} title="Calendrier">
      <StudioCalendar reservations={reservations} showClientDetails={true} />
    </Layout>
  )
}
