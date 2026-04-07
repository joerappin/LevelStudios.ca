import React from 'react'
import { CHEF_NAV } from './ChefDashboard'
import RushesPanel from '../../components/RushesPanel'

export default function ChefRushes() {
  return <RushesPanel navItems={CHEF_NAV} title="Rushes" />
}
