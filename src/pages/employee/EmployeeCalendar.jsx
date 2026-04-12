import React from 'react'
import Layout from '../../components/Layout'
import { EMPLOYEE_NAV } from './EmployeeDashboard'
import StudioCalendar from '../../components/StudioCalendar'
import { useReservations } from '../../hooks/useReservations'

export default function EmployeeCalendar() {
  const { reservations } = useReservations()
  return (
    <Layout navItems={EMPLOYEE_NAV} title="Calendrier">
      <StudioCalendar reservations={reservations} showClientDetails={false} />
    </Layout>
  )
}
