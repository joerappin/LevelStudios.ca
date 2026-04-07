import React from 'react'
import { CHEF_NAV } from './ChefDashboard'
import MessagingPanel from '../../components/MessagingPanel'

export default function ChefMessaging() {
  return <MessagingPanel navItems={CHEF_NAV} title="Messagerie" />
}
