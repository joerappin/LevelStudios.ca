import React from 'react'
import Layout from '../../components/Layout'
import { CHEF_NAV } from './ChefDashboard'
import RHPanel from '../../components/RHPanel'

export default function ChefRH() {
  return (
    <Layout navItems={CHEF_NAV} title="Ressources humaines">
      <RHPanel />
    </Layout>
  )
}
