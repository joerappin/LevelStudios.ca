import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Home, Mail, CalendarDays, User, Users, BarChart2,
  Layers, MessageSquare, Megaphone, Package, ShoppingBag,
  ClipboardList, BookOpen, Wrench, Tag, Clock,
  Plane, DollarSign, Edit3, LogIn, Star, FileText, GitBranch, ScanLine, Loader2, Palette
} from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { generateSiteDoc, generateConnectionSchema, generateAnnotatedGuide } from '../../utils/pdfGenerators'

const LS_KEY = 'ls_page_visibility'
const BRAND_COLOR_KEY = 'ls_brand_color'
const DEFAULT_BRAND = '#e8175d'

function getDisabled() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function setDisabled(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map))
}

function getBrandColor() {
  return localStorage.getItem(BRAND_COLOR_KEY) || DEFAULT_BRAND
}

function setBrandColor(color) {
  localStorage.setItem(BRAND_COLOR_KEY, color)
  document.documentElement.style.setProperty('--brand-color', color)
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  document.documentElement.style.setProperty('--brand-rgb', `${r},${g},${b}`)
  window.dispatchEvent(new CustomEvent('ls:brandcolor', { detail: color }))
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
    group: 'Employé',
    color: '#607d8b',
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
      { key: 'admin-satisfaction',  label: 'Satisfaction',  path: '/admin/satisfaction',  icon: Star },
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

const PRESET_COLORS = [
  '#e8175d', '#7c3aed', '#2563eb', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#be185d', '#7e22ce', '#ea580c',
]

export default function AdminIndex() {
  const navigate = useNavigate()
  const [disabled, setDisabledState] = useState(() => getDisabled())
  const [pdfLoading, setPdfLoading] = useState({ site: false, schema: false, guide: false })
  const [brandColor, setBrandColorState] = useState(() => getBrandColor())
  const [showColorPicker, setShowColorPicker] = useState(false)
  const colorInputRef = useRef(null)

  const handlePdf = async (key, fn) => {
    setPdfLoading(s => ({ ...s, [key]: true }))
    try { await fn() } finally { setPdfLoading(s => ({ ...s, [key]: false })) }
  }

  const toggle = (e, path) => {
    e.stopPropagation()
    const next = { ...disabled, [path]: !disabled[path] }
    setDisabled(next)
    setDisabledState(next)
  }

  const handleColorChange = (color) => {
    setBrandColorState(color)
    setBrandColor(color)
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Index des pages">
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Index des pages</h1>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '28px' }}>Sélectionnez une page pour l'ouvrir dans l'éditeur visuel.</p>

          {/* PDF buttons + Color picker */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {[
              { key: 'site', label: 'Documentation site', sub: 'Toutes les pages, page par page', icon: FileText, fn: generateSiteDoc, color: '#88ebff' },
              { key: 'schema', label: 'Schéma de connexion', sub: 'Interactivité inter-comptes', icon: GitBranch, fn: generateConnectionSchema, color: '#ea73fb' },
              { key: 'guide', label: 'Guide fonctionnalités', sub: 'Pages annotées avec flèches', icon: ScanLine, fn: generateAnnotatedGuide, color: '#ff89ac' },
            ].map(({ key, label, sub, icon: Icon, fn, color }) => (
              <button key={key}
                disabled={pdfLoading[key]}
                onClick={() => handlePdf(key, fn)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 20px', borderRadius: '14px', cursor: pdfLoading[key] ? 'not-allowed' : 'pointer',
                  background: '#0e0e0e', border: `1px solid ${color}30`,
                  opacity: pdfLoading[key] ? 0.7 : 1, transition: 'all 0.18s',
                  boxShadow: `0 0 0 0 ${color}00`,
                  minWidth: '260px',
                }}
                onMouseEnter={e => { if (!pdfLoading[key]) { e.currentTarget.style.border = `1px solid ${color}60`; e.currentTarget.style.background = `${color}08`; e.currentTarget.style.boxShadow = `0 4px 20px ${color}15` } }}
                onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${color}30`; e.currentTarget.style.background = '#0e0e0e'; e.currentTarget.style.boxShadow = `0 0 0 0 ${color}00` }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {pdfLoading[key]
                    ? <Loader2 size={17} style={{ color, animation: 'spin 1s linear infinite' }} />
                    : <Icon size={17} style={{ color }} />
                  }
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ddd', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>{pdfLoading[key] ? 'Génération en cours…' : sub}</div>
                </div>
              </button>
            ))}

            {/* Brand color picker */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowColorPicker(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 20px', borderRadius: '14px', cursor: 'pointer',
                  background: '#0e0e0e', border: `1px solid ${brandColor}40`,
                  minWidth: '220px', transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${brandColor}80`; e.currentTarget.style.background = `${brandColor}08` }}
                onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${brandColor}40`; e.currentTarget.style.background = '#0e0e0e' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${brandColor}20`, border: `1px solid ${brandColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Palette size={17} style={{ color: brandColor }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ddd', marginBottom: '4px' }}>Couleur landing page</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: brandColor, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>{brandColor.toUpperCase()}</span>
                  </div>
                </div>
              </button>

              {showColorPicker && (
                <div
                  style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: '8px', zIndex: 100,
                    background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '16px',
                    width: '260px', boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Couleur des éléments roses
                  </div>
                  {/* Presets */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        title={c}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%', background: c, border: brandColor === c ? '3px solid #fff' : '2px solid transparent',
                          cursor: 'pointer', transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      />
                    ))}
                  </div>
                  {/* Custom color */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={brandColor}
                      onChange={e => handleColorChange(e.target.value)}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={e => {
                        const v = e.target.value
                        if (/^#[0-9a-fA-F]{6}$/.test(v)) handleColorChange(v)
                        else setBrandColorState(v)
                      }}
                      style={{
                        flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
                        padding: '6px 10px', color: '#ddd', fontSize: '12px', fontFamily: 'monospace',
                        outline: 'none',
                      }}
                      maxLength={7}
                    />
                    {brandColor !== DEFAULT_BRAND && (
                      <button
                        onClick={() => handleColorChange(DEFAULT_BRAND)}
                        title="Réinitialiser"
                        style={{ fontSize: '10px', color: '#666', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}
                      >
                        ↩
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    style={{ width: '100%', marginTop: '12px', background: brandColor, color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 0', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    Appliquer
                  </button>
                </div>
              )}
            </div>
          </div>

          {showColorPicker && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowColorPicker(false)} />
          )}
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

        {PAGE_GROUPS.map(group => (
          <div key={group.group} style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '18px', background: group.color, borderRadius: '2px' }} />
              <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>
                {group.group}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
              {group.pages.map(page => {
                const Icon = page.icon
                const isOff = !!disabled[page.path]
                return (
                  <button key={page.key}
                    onClick={() => navigate(`/admin/editor?page=${encodeURIComponent(page.path)}&label=${encodeURIComponent(page.label)}`)}
                    style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', textAlign: 'left', transition: 'all 0.18s', position: 'relative', overflow: 'hidden', opacity: isOff ? 0.5 : 1 }}
                    onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${group.color}44`; e.currentTarget.style.background = '#161616'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${group.color}18` }}
                    onMouseLeave={e => { e.currentTarget.style.border = '1px solid #1e1e1e'; e.currentTarget.style.background = '#111'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: group.color, opacity: 0.4, borderRadius: '14px 14px 0 0' }} />
                    {/* Disabled overlay */}
                    {isOff && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ef4444', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '4px', padding: '3px 8px' }}>Désactivée</span>
                      </div>
                    )}
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${group.color}18`, border: `1px solid ${group.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} style={{ color: group.color }} />
                    </div>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#ddd' }}>{page.label}</p>
                        {/* Toggle switch for all non-admin pages */}
                        {!page.path.startsWith('/admin') && <div
                          onClick={e => toggle(e, page.path)}
                          style={{
                            width: '28px', height: '16px', borderRadius: '999px', flexShrink: 0,
                            background: isOff ? '#c0392b' : '#27ae60',
                            position: 'relative', cursor: 'pointer',
                            transition: 'background 0.2s',
                            boxShadow: isOff ? 'inset 0 0 0 1px rgba(0,0,0,0.3)' : 'inset 0 0 0 1px rgba(0,0,0,0.2)',
                          }}
                          title={isOff ? 'Page désactivée — cliquer pour activer' : 'Page active — cliquer pour désactiver'}
                        >
                          <div style={{
                            position: 'absolute', top: '2px',
                            left: isOff ? '2px' : '12px',
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: '#fff',
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          }} />
                        </div>}
                      </div>
                      <p style={{ fontSize: '10px', color: '#444', fontFamily: 'monospace' }}>{page.path}</p>
                    </div>
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', opacity: 0.3 }}>
                      <Edit3 size={12} style={{ color: '#fff' }} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
