import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, CalendarDays, FolderOpen, CreditCard, MessageSquare,
  User, LogOut, Menu, Sun, Moon, ChevronDown, ArrowLeftCircle,
  KeyRound, Receipt, Headphones, ChevronUp,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { translations } from '../i18n/translations'
import { createPageUrl, cn } from '../utils'
import { Store } from '../data/store'

export default function ClientLayout({ children, title }) {
  const { user, logout, impersonatedBy, stopImpersonating } = useAuth()
  const { theme, lang, toggleTheme, toggleLang } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const handleStopImpersonating = () => { stopImpersonating(); navigate('/admin/accounts') }

  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const t = (k) => translations[lang]?.[k] || k
  const isDark = theme === 'dark'
  const handleLogout = () => { logout(); navigate('/') }

  const pendingCount = user ? Store.getReservations().filter(r => r.client_email === user.email && r.status === 'a_payer').length : 0
  const flags = Store.getFeatureFlags()

  const navItems = [
    { key: 'nav_dashboard',     path: createPageUrl('ClientDashboard'),    icon: Home },
    { key: 'nav_reservations',  path: '/client/invoices',                  icon: CalendarDays },
    flags.library_tab      && { key: 'nav_library',      path: createPageUrl('ClientLibrary'),      icon: FolderOpen },
    flags.subscription_tab && { key: 'nav_subscription', path: createPageUrl('ClientSubscription'), icon: CreditCard },
  ].filter(Boolean)

  const SidebarContent = () => (
    <div className={cn('flex flex-col h-full', isDark ? 'bg-zinc-900' : 'bg-white')}>

      {/* Logo row */}
      <div className={cn('h-16 flex items-center justify-between px-5 border-b flex-shrink-0', isDark ? 'border-zinc-800' : 'border-gray-100')}>
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" className="w-7 h-7 object-contain rounded-lg flex-shrink-0" alt="Level Studios" />
          <div className="leading-none">
            <span className={cn('font-bold text-sm tracking-tight block', isDark ? 'text-white' : 'text-gray-900')}>
              Level Studios
            </span>
            <span className={cn('text-[10px] font-semibold px-1 py-0.5 rounded uppercase tracking-wide', isDark ? 'text-violet-400 bg-violet-950/50' : 'text-violet-600 bg-violet-50')}>
              Beta
            </span>
          </div>
        </div>
        {/* Theme toggle */}
        <button onClick={toggleTheme} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(({ key, path, icon: Icon }) => {
          const isActive = location.pathname === path
          const badge = key === 'nav_reservations' && pendingCount > 0 ? pendingCount : null
          const label = key === 'nav_reservations' ? 'Réservations' : t(key)
          return (
            <button
              key={key}
              onClick={() => { navigate(path); setSidebarOpen(false) }}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/30'
                  : isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="flex-shrink-0" />
                {label}
              </div>
              {badge && (
                <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                  isActive ? 'bg-white/20 text-white' : 'bg-violet-600 text-white')}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className={cn('p-3 border-t space-y-1.5 flex-shrink-0', isDark ? 'border-zinc-800' : 'border-gray-100')}>
        {/* Language */}
        <button onClick={toggleLang} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors', isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}>
          <span className="text-base">{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
          <span className="font-medium">{lang === 'fr' ? 'Français' : 'English'}</span>
          <ChevronDown size={13} className="ml-auto" />
        </button>

        {/* User card + dropdown */}
        <div ref={userMenuRef} className="relative">
          {/* Dropdown menu — opens upward */}
          {userMenuOpen && (
            <div className={cn(
              'absolute bottom-full left-0 right-0 mb-2 rounded-xl border overflow-hidden shadow-xl',
              isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
            )}>
              {[
                { icon: User,       label: 'Informations personnelles', path: createPageUrl('ClientAccount') },
                { icon: KeyRound,   label: 'Mot de passe',              path: createPageUrl('ClientAccount') },
                { icon: Headphones, label: 'Contact SAV',               path: createPageUrl('ClientContact') },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={label}
                  onClick={() => { navigate(path); setUserMenuOpen(false); setSidebarOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors text-left',
                    isDark ? 'text-zinc-300 hover:bg-zinc-700 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon size={13} className={isDark ? 'text-zinc-500' : 'text-gray-400'} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Trigger button */}
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors',
              userMenuOpen
                ? isDark ? 'bg-zinc-700' : 'bg-gray-100'
                : isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-50 hover:bg-gray-100'
            )}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0A4C99' }}>
              <span className="text-white text-xs font-bold">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <span className={cn('text-xs font-medium flex-1 truncate text-left', isDark ? 'text-zinc-300' : 'text-gray-700')}>
              {user?.name || 'User'}
            </span>
            {userMenuOpen
              ? <ChevronUp size={13} className={isDark ? 'text-zinc-500' : 'text-gray-400'} />
              : <ChevronDown size={13} className={isDark ? 'text-zinc-500' : 'text-gray-400'} />
            }
          </button>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
            isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          )}
        >
          <LogOut size={14} />
          {t('logout')}
        </button>
      </div>
    </div>
  )

  return (
    <div className={cn('min-h-screen flex', isDark ? 'bg-zinc-950' : 'bg-gray-50')}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-56 z-50 border-r transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
        isDark ? 'border-zinc-800' : 'border-gray-200'
      )}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className={cn(
          'h-16 flex items-center justify-between px-4 sm:px-6 border-b sticky top-0 z-30',
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-100'
        )}>
          <div className="flex items-center gap-3">
            <button className={cn('lg:hidden p-2 rounded-lg', isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-100')} onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className={cn('font-bold text-lg', isDark ? 'text-white' : 'text-gray-900')}>{title}</h1>
          </div>

          <div className="flex items-center gap-2" />
        </header>

        {impersonatedBy && (
          <div className="sticky top-16 z-20 flex items-center justify-between px-4 sm:px-6 py-2.5" style={{ background: 'rgba(234,179,8,0.12)', borderBottom: '1px solid rgba(234,179,8,0.3)' }}>
            <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
              👁 Vue en tant que <strong>{user?.name}</strong> — connecté en tant que {impersonatedBy.name}
            </span>
            <button onClick={handleStopImpersonating} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors" style={{ background: 'rgba(234,179,8,0.2)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.4)' }}>
              <ArrowLeftCircle size={13} /> Retour Admin
            </button>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
