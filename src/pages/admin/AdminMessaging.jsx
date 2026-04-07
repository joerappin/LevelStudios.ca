import React from 'react'
import { ADMIN_NAV } from './Dashboard'
import MessagingPanel from '../../components/MessagingPanel'

export default function AdminMessaging() {
  return <MessagingPanel navItems={ADMIN_NAV} title="Messagerie interne" />
}
