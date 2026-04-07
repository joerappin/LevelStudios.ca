import React from 'react'
import { ADMIN_NAV } from './Dashboard'
import RushesPanel from '../../components/RushesPanel'

export default function AdminRushes() {
  return <RushesPanel navItems={ADMIN_NAV} title="Rushes" />
}
