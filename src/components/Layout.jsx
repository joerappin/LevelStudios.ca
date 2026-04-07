import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Menu, X, Sun, Moon, ChevronDown, ArrowLeftCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { translations } from '../i18n/translations'
import { cn } from '../utils'
import AdminChatBot from './AdminChatBot'
import ClientChatBot from './ClientChatBot'

export default function Layout({ children, navItems, title }) {
  const { user, logout, impersonatedBy, stopImpersonating } = useAuth()
  const { theme, lang, toggleTheme, toggleLang } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isDark = theme === 'dark'
  const t = (k) => translations[lang]?.[k] || k
  const handleLogout = () => { logout(); navigate('/') }
  const handleStopImpersonating = () => { stopImpersonating(); navigate('/admin/accounts') }

  // Role badge color
  const roleBadge = {
    admin:    isDark ? 'bg-violet-900/50 text-violet-300 border border-violet-800' : 'bg-violet-100 text-violet-700',
    employee: isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-800'       : 'bg-blue-100 text-blue-700',
    client:   isDark ? 'bg-green-900/50 text-green-300 border border-green-800'    : 'bg-green-100 text-green-700',
  }

  const SidebarContent = () => (
    <div className={cn('flex flex-col h-full', isDark ? 'bg-zinc-900' : 'bg-white')}>

      {/* Logo row */}
      <div className={cn('h-16 flex items-center justify-between px-5 border-b flex-shrink-0', isDark ? 'border-zinc-800' : 'border-gray-100')}>
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.jpg" className="w-7 h-7 object-contain rounded-lg flex-shrink-0" alt="Level Studios" />
          <div className="leading-none min-w-0">
            <span className={cn('font-bold text-sm tracking-tight block truncate', isDark ? 'text-white' : 'text-gray-900')}>
              Level Studios
            </span>
            <span className={cn('text-[10px] font-semibold px-1 py-0.5 rounded uppercase tracking-wide', isDark ? 'text-violet-400 bg-violet-950/50' : 'text-violet-600 bg-violet-50')}>
              {user?.type === 'admin' ? 'Admin' : user?.type === 'employee' ? 'Employé' : 'Beta'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Theme toggle */}
          <button onClick={toggleTheme} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button className={cn('lg:hidden p-1.5 rounded-lg', isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-100')} onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item, i) => {
          if (item.separator) {
            return <div key={i} className={cn('my-2 border-t', isDark ? 'border-zinc-800/70' : 'border-gray-100')} />
          }
          const isActive = location.pathname === item.path
          return (
            <button
              key={i}
              onClick={() => { navigate(item.path); setSidebarOpen(false) }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5',
                isActive
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/30'
                  : isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-left">{item.labelKey ? t(item.labelKey) : item.label}</span>
              {item.badge && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center',
                  isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className={cn('p-3 border-t space-y-1.5 flex-shrink-0', isDark ? 'border-zinc-800' : 'border-gray-100')}>
        {/* Language toggle */}
        <button onClick={toggleLang} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors', isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}>
          <span className="text-base">{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
          <span className="font-medium">{lang === 'fr' ? 'Français' : 'English'}</span>
          <ChevronDown size={13} className="ml-auto" />
        </button>

        {/* User card */}
        <div className={cn('flex items-center gap-3 px-3 py-2 rounded-xl', isDark ? 'bg-zinc-800' : 'bg-gray-50')}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0A4C99' }}>
            <span className="text-white text-xs font-bold">{user?.name?.charAt(0) || '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-xs font-semibold truncate', isDark ? 'text-zinc-200' : 'text-gray-800')}>{user?.name}</p>
            <p className={cn('text-[10px] truncate', isDark ? 'text-zinc-500' : 'text-gray-400')}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} title={t('logout')} className={cn('p-1 rounded-lg transition-colors flex-shrink-0', isDark ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-gray-700')}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn('min-h-screen flex', isDark ? 'bg-zinc-950' : 'bg-gray-50')}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 z-50 border-r transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
        isDark ? 'border-zinc-800' : 'border-gray-200'
      )}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className={cn(
          'h-16 flex items-center justify-between px-4 sm:px-6 border-b sticky top-0 z-30',
          isDark ? 'bg-zinc-950/95 border-zinc-800 backdrop-blur' : 'bg-white border-gray-100'
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
        <main className={cn('flex-1 p-4 sm:p-6 overflow-auto', isDark ? 'text-white' : 'text-gray-900')}>
          {children}
        </main>
      </div>

      {user?.type === 'admin' && <AdminChatBot />}
      {user?.type === 'client' && <ClientChatBot />}
    </div>
  )
}
