import React from 'react'
import Layout from '../../components/Layout'
import { EMPLOYEE_NAV } from './EmployeeDashboard'
import { Store } from '../../data/store'
import StudioCalendar from '../../components/StudioCalendar'

export default function EmployeeCalendar() {
  const reservations = Store.getReservations()
  return (
    <Layout navItems={EMPLOYEE_NAV} title="Calendrier">
      <StudioCalendar reservations={reservations} showClientDetails={false} />
    </Layout>
  )
}
