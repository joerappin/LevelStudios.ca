import React from 'react'
import { Users } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import RHPanel from '../../components/RHPanel'

export default function AdminRH() {
  return (
    <Layout navItems={ADMIN_NAV} title="Ressources humaines">
      <RHPanel />
    </Layout>
  )
}
