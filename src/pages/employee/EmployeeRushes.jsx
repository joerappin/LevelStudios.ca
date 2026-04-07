import React from 'react'
import { EMPLOYEE_NAV } from './EmployeeDashboard'
import RushesPanel from '../../components/RushesPanel'
import { useAuth } from '../../contexts/AuthContext'

export default function EmployeeRushes() {
  const { user } = useAuth()
  return <RushesPanel navItems={EMPLOYEE_NAV} title="Rushes" userEmail={user?.email} />
}
