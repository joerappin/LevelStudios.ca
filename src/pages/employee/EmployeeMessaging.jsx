import React from 'react'
import { EMPLOYEE_NAV } from './EmployeeDashboard'
import MessagingPanel from '../../components/MessagingPanel'

export default function EmployeeMessaging() {
  return <MessagingPanel navItems={EMPLOYEE_NAV} title="Messagerie" />
}
