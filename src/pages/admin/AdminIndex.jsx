import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Home, Mail, CalendarDays, User, Users, BarChart2,
  Layers, MessageSquare, Megaphone, Package, ShoppingBag,
  ClipboardList, BookOpen, Wrench, Tag, Clock,
  Plane, DollarSign, Edit3, Crown, UserCheck, LogIn, EyeOff, Eye
} from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'

const LS_KEY = 'ls_page_visibility'

function getDisabled() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function setDisabled(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map))
}

const PAGE_GROUPS = [
  {
    group: 'Pages publiques',
    color: '#e8175d',
    pages: [
      { key: 'home',        label: 'Accueil',          path: '/',                          icon: Home },
      { key: 'contact',     label: 'Contact',          path: '/contact',                   icon: Mail },
      { key: 'reservation', label: 'Réservation',      path: '/reservation',               icon: CalendarDays },
      { key: 'login-team',  label: 'Connexion Équipe', path: '/loginteamlevelprivate',     icon: LogIn },
    ]
  },
  {
    group: 'Espace Client',
    color: '#00BCD4',
    pages: [
      { key: 'client-dashboard',    label: 'Dashboard',    path: '/client/dashboard',    icon: BarChart2 },
      { key: 'client-reservations', label: 'Réservations', path: '/client/reservations', icon: CalendarDays },
      { key: 'client-library',      label: 'Médiathèque',  path: '/client/library',      icon: Package },
      { key: 'client-subscription', label: 'Abonnements',  path: '/client/subscription', icon: ShoppingBag },
      { key: 'client-contact',      label: 'Contact SAV',  path: '/client/contact',      icon: MessageSquare },
    ]
  },
  {
    group: 'Chef de Projets',
    color: '#9c27b0',
    badge: 'Chef',
    pages: [
      { key: 'chef-dashboard',     label: 'Dashboard',    path: '/chef/dashboard',     icon: BarChart2 },
      { key: 'chef-calendar',      label: 'Calendrier',   path: '/chef/calendar',      icon: CalendarDays },
      { key: 'chef-reservations',  label: 'Réservations', path: '/chef/reservations',  icon: ClipboardList },
      { key: 'chef-projects',      label: 'Projets',      path: '/chef/projects',      icon: Layers },
      { key: 'chef-rushes',        label: 'Rushes',       path: '/chef/rushes',        icon: Package },
      { key: 'chef-messaging',     label: 'Messagerie',   path: '/chef/messaging',     icon: MessageSquare },
    ]
  },
  {
    group: 'Employé simple',
    color: '#607d8b',
    badge: 'Employé',
    pages: [
      { key: 'emp-dashboard',  label: 'Dashboard',  path: '/employee/dashboard',  icon: BarChart2 },
      { key: 'emp-projects',   label: 'Projets',    path: '/employee/projects',   icon: Layers },
      { key: 'emp-calendar',   label: 'Calendrier', path: '/employee/calendar',   icon: CalendarDays },
      { key: 'emp-check',      label: 'Pointage',   path: '/employee/check',      icon: Clock },
      { key: 'emp-messaging',  label: 'Messagerie', path: '/employee/messaging',  icon: MessageSquare },
      { key: 'emp-leave',      label: 'Congés',     path: '/employee/leave',      icon: Plane },
    ]
  },
  {
    group: 'Administration',
    color: '#ff9800',
    pages: [
      { key: 'admin-dashboard',     label: 'Dashboard',     path: '/admin/dashboard',     icon: BarChart2 },
      { key: 'admin-calendar',      label: 'Calendrier',    path: '/admin/calendar',      icon: CalendarDays },
      { key: 'admin-reservations',  label: 'Réservations',  path: '/admin/reservations',  icon: ClipboardList },
      { key: 'admin-projects',      label: 'Projets',       path: '/admin/projects',      icon: Layers },
      { key: 'admin-messaging',     label: 'Messagerie',    path: '/admin/messaging',     icon: MessageSquare },
      { key: 'admin-sav',           label: 'SAV',           path: '/admin/sav',           icon: Users },
      { key: 'admin-communication', label: 'Communication', path: '/admin/communication', icon: Megaphone },
      { key: 'admin-promo',         label: 'Promos',        path: '/admin/promo',         icon: Tag },
      { key: 'admin-check',         label: 'Pointages',     path: '/admin/check',         icon: Clock },
      { key: 'admin-boarding',      label: 'RH / Congés',   path: '/admin/boarding',      icon: Plane },
      { key: 'admin-pricing',       label: 'Tarifs',        path: '/admin/pricing',       icon: DollarSign },
      { key: 'admin-manual',        label: 'Manuel',        path: '/admin/manual',        icon: BookOpen },
      { key: 'admin-tool',          label: 'Outils',        path: '/admin/tool',          icon: Wrench },
    ]
  },
]

export default function AdminIndex() {
  const navigate = useNavigate()
  const [disabled, setDisabledState] = useState(() => getDisabled())

  const toggle = (e, path) => {
    e.stopPropagation()
    const next = { ...disabled, [path]: !disabled[path] }
    setDisabled(next)
    setDisabledState(next)
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Index des pages">
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Index des pages</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Sélectionnez une page pour l'ouvrir dans l'éditeur visuel.</p>
        </div>

        {PAGE_GROUPS.map(group => (
          <div key={group.group} style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '18px', background: group.color, borderRadius: '2px' }} />
              <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>
                {group.group}
              </h2>
              {group.badge && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: `${group.color}18`, border: `1px solid ${group.color}40`, color: group.color, letterSpacing: '0.05em' }}>
                  {group.badge === 'Chef'
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Crown size={9} /> Chef de projets</span>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UserCheck size={9} /> Employé</span>}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
              {group.pages.map(page => {
                const Icon = page.icon
                const isOff = !!disabled[page.path]
                return (
                  <div key={page.key} style={{ position: 'relative' }}>
                    {/* Main card */}
                    <button
                      onClick={() => navigate(`/admin/editor?page=${encodeURIComponent(page.path)}&label=${encodeURIComponent(page.label)}`)}
                      style={{
                        width: '100%',
                        background: isOff ? '#0d0d0d' : '#111',
                        border: `1px solid ${isOff ? '#1a1a1a' : '#1e1e1e'}`,
                        borderRadius: '14px',
                        padding: '20px 16px 44px',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px',
                        textAlign: 'left', transition: 'all 0.18s',
                        position: 'relative', overflow: 'hidden',
                        opacity: isOff ? 0.45 : 1,
                      }}
                      onMouseEnter={e => {
                        if (isOff) return
                        e.currentTarget.style.border = `1px solid ${group.color}44`
                        e.currentTarget.style.background = '#161616'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = `0 8px 24px ${group.color}18`
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.border = `1px solid ${isOff ? '#1a1a1a' : '#1e1e1e'}`
                        e.currentTarget.style.background = isOff ? '#0d0d0d' : '#111'
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: group.color, opacity: isOff ? 0.12 : 0.4, borderRadius: '14px 14px 0 0' }} />
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${group.color}18`, border: `1px solid ${group.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isOff
                          ? <EyeOff size={16} style={{ color: '#444' }} />
                          : <Icon size={16} style={{ color: group.color }} />}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: isOff ? '#444' : '#ddd', marginBottom: '3px' }}>{page.label}</p>
                        <p style={{ fontSize: '10px', color: '#333', fontFamily: 'monospace' }}>{page.path}</p>
                      </div>
                      {!isOff && (
                        <div style={{ position: 'absolute', bottom: '44px', right: '12px', opacity: 0.3 }}>
                          <Edit3 size={12} style={{ color: '#fff' }} />
                        </div>
                      )}
                    </button>

                    {/* Toggle button */}
                    <button
                      onClick={e => toggle(e, page.path)}
                      style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        borderRadius: '0 0 14px 14px',
                        padding: '7px 10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        cursor: 'pointer',
                        fontSize: '10px', fontWeight: 700,
                        border: 'none',
                        background: isOff ? 'rgba(76,175,80,0.12)' : 'rgba(232,23,93,0.08)',
                        borderTop: `1px solid ${isOff ? 'rgba(76,175,80,0.2)' : 'rgba(232,23,93,0.12)'}`,
                        color: isOff ? '#4caf50' : '#e8175d',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = isOff ? 'rgba(76,175,80,0.22)' : 'rgba(232,23,93,0.16)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = isOff ? 'rgba(76,175,80,0.12)' : 'rgba(232,23,93,0.08)'
                      }}
                    >
                      {isOff
                        ? <><Eye size={10} /> Activer</>
                        : <><EyeOff size={10} /> Désactiver</>}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
