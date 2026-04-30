// Build gestion — app.levelstudios.ca
// Routes : admin, employé, chef de projet, client classique, freelance

import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { ArrowLeftCircle, LayoutDashboard, Film } from 'lucide-react'
import { syncAll } from './lib/db'
import { useRealtimeSync } from './lib/realtime'
import SiteOverrideInjector from './components/SiteOverrideInjector'

// Auth pages
import Login        from './pages/Login'
import SetPassword  from './pages/SetPassword'
import AuthCallback from './pages/AuthCallback'

// Admin pages
import AdminDashboard   from './pages/admin/Dashboard'
import AdminAccounts    from './pages/admin/AdminAccounts'
import AdminCalendar    from './pages/admin/AdminCalendar'
import AdminReservations from './pages/admin/AdminReservations'
import AdminProjects    from './pages/admin/AdminProjects'
import AdminRushes      from './pages/admin/AdminRushes'
import AdminMessaging   from './pages/admin/AdminMessaging'
import AdminSAV         from './pages/admin/AdminSAV'
import AdminCommunication from './pages/admin/AdminCommunication'
import AdminPromo       from './pages/admin/AdminPromo'
import AdminAlerts      from './pages/admin/AdminAlerts'
import AdminCheck       from './pages/admin/AdminCheck'
import AdminBoarding    from './pages/admin/AdminBoarding'
import AdminManual      from './pages/admin/AdminManual'
import AdminTool        from './pages/admin/AdminTool'
import AdminBeta        from './pages/admin/AdminBeta'
import AdminPerf        from './pages/admin/AdminPerf'
import AdminVersions    from './pages/admin/AdminVersions'
import AdminPricing     from './pages/admin/AdminPricing'
import AdminRecette     from './pages/admin/AdminRecette'
import AdminIndex       from './pages/admin/AdminIndex'
import AdminSatisfaction from './pages/admin/AdminSatisfaction'
import AdminPageEditor  from './pages/admin/AdminPageEditor'
import AdminRH          from './pages/admin/AdminRH'

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeProjects  from './pages/employee/EmployeeProjects'
import EmployeeMessaging from './pages/employee/EmployeeMessaging'
import EmployeeCheck     from './pages/employee/EmployeeCheck'
import EmployeeCalendar  from './pages/employee/EmployeeCalendar'
import EmployeeLeave     from './pages/employee/EmployeeLeave'
import EmployeeAccount   from './pages/employee/EmployeeAccount'
import EmployeeAlerts    from './pages/employee/EmployeeAlerts'
import EmployeeRushes    from './pages/employee/EmployeeRushes'

// Chef de projet pages
import ChefDashboard    from './pages/chef/ChefDashboard'
import ChefCalendar     from './pages/chef/ChefCalendar'
import ChefReservations from './pages/chef/ChefReservations'
import ChefProjects     from './pages/chef/ChefProjects'
import ChefAlerts       from './pages/chef/ChefAlerts'
import ChefLibrary      from './pages/chef/ChefLibrary'
import ChefRushes       from './pages/chef/ChefRushes'
import ChefMessaging    from './pages/chef/ChefMessaging'
import ChefAccount      from './pages/chef/ChefAccount'
import ChefSav          from './pages/chef/ChefSav'
import ChefPerf         from './pages/chef/ChefPerf'
import ChefRH           from './pages/chef/ChefRH'

// Client classique pages
import ClientDashboard    from './pages/client/ClientDashboard'
import ClientAccount      from './pages/client/ClientAccount'
import ClientReservations from './pages/client/ClientReservations'
import ClientLibrary      from './pages/client/ClientLibrary'
import ClientSubscription from './pages/client/ClientSubscription'
import ClientInvoices     from './pages/client/ClientInvoices'
import ClientContact      from './pages/client/ClientContact'

// Client Test pages
import ClientTestLogin        from './pages/clienttest/ClientTestLogin'
import ClientTestDashboard    from './pages/clienttest/ClientTestDashboard'
import ClientTestReservations from './pages/clienttest/ClientTestReservations'
import ClientTestLibrary      from './pages/clienttest/ClientTestLibrary'
import ClientTestSubscription from './pages/clienttest/ClientTestSubscription'
import ClientTestInvoices     from './pages/clienttest/ClientTestInvoices'
import ClientTestContact      from './pages/clienttest/ClientTestContact'
import ClientTestAccount      from './pages/clienttest/ClientTestAccount'

// ── Guards ────────────────────────────────────────────────────────────────────

function ProtectedRoute({ children, requiredType }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  const isStaffRoute = requiredType === 'admin' || requiredType === 'employee'
  if (!user) return <Navigate to="/login" replace />
  if (requiredType && user.type !== requiredType) return <Navigate to="/login" replace />
  return children
}

function ClientTestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00bcd4', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!user || (user.type !== 'clienttest' && user.type !== 'client')) return <Navigate to="/clienttest" replace />
  return children
}

// ── Bannière impersonation ────────────────────────────────────────────────────

function ImpersonationBanner() {
  const { user, impersonatedBy, stopImpersonating } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  if (!impersonatedBy) return null
  const isTestView = location.pathname.startsWith('/clienttest')
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '36px',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', background: 'rgba(12,9,0,0.96)',
      borderBottom: '1px solid rgba(234,179,8,0.35)', backdropFilter: 'blur(8px)',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ opacity: 0.8 }}>👁</span>
        Vue en tant que <strong style={{ color: '#fff' }}>{user?.name}</strong>
        <span style={{ opacity: 0.5 }}>— {impersonatedBy.name}</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isTestView ? (
          <button onClick={() => navigate('/client/dashboard')} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'6px', cursor:'pointer', border:'1px solid rgba(139,92,246,0.35)', background:'rgba(139,92,246,0.15)', color:'#a78bfa' }}>
            <LayoutDashboard size={11} /> Vue Classique
          </button>
        ) : (
          <button onClick={() => navigate('/clienttest/dashboard')} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'6px', cursor:'pointer', border:'1px solid rgba(0,188,212,0.35)', background:'rgba(0,188,212,0.12)', color:'#00bcd4' }}>
            <Film size={11} /> Vue Neo
          </button>
        )}
        <button onClick={() => { stopImpersonating(); navigate('/admin/accounts') }} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'6px', cursor:'pointer', border:'1px solid rgba(234,179,8,0.35)', background:'rgba(234,179,8,0.15)', color:'#fbbf24' }}>
          <ArrowLeftCircle size={11} /> Retour Admin
        </button>
      </div>
    </div>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────

function ManagementRoutes() {
  const { user } = useAuth()
  useRealtimeSync(!!user)
  useEffect(() => { if (user) syncAll().catch(() => {}) }, [user?.id])

  return (
    <>
      <ImpersonationBanner />
      <Routes>
        <Route path="/"            element={<Navigate to="/login" replace />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/auth"        element={<AuthCallback />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Admin */}
        <Route path="/admin/dashboard"    element={<ProtectedRoute requiredType="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/accounts"     element={<ProtectedRoute requiredType="admin"><AdminAccounts /></ProtectedRoute>} />
        <Route path="/admin/calendar"     element={<ProtectedRoute requiredType="admin"><AdminCalendar /></ProtectedRoute>} />
        <Route path="/admin/reservations" element={<ProtectedRoute requiredType="admin"><AdminReservations /></ProtectedRoute>} />
        <Route path="/admin/projects"     element={<ProtectedRoute requiredType="admin"><AdminProjects /></ProtectedRoute>} />
        <Route path="/admin/rushes"       element={<ProtectedRoute requiredType="admin"><AdminRushes /></ProtectedRoute>} />
        <Route path="/admin/messaging"    element={<ProtectedRoute requiredType="admin"><AdminMessaging /></ProtectedRoute>} />
        <Route path="/admin/sav"          element={<ProtectedRoute requiredType="admin"><AdminSAV /></ProtectedRoute>} />
        <Route path="/admin/communication" element={<ProtectedRoute requiredType="admin"><AdminCommunication /></ProtectedRoute>} />
        <Route path="/admin/promo"        element={<ProtectedRoute requiredType="admin"><AdminPromo /></ProtectedRoute>} />
        <Route path="/admin/alerts"       element={<ProtectedRoute requiredType="admin"><AdminAlerts /></ProtectedRoute>} />
        <Route path="/admin/check"        element={<ProtectedRoute requiredType="admin"><AdminCheck /></ProtectedRoute>} />
        <Route path="/admin/boarding"     element={<ProtectedRoute requiredType="admin"><AdminBoarding /></ProtectedRoute>} />
        <Route path="/admin/manual"       element={<ProtectedRoute requiredType="admin"><AdminManual /></ProtectedRoute>} />
        <Route path="/admin/tool"         element={<ProtectedRoute requiredType="admin"><AdminTool /></ProtectedRoute>} />
        <Route path="/admin/perf"         element={<ProtectedRoute requiredType="admin"><AdminPerf /></ProtectedRoute>} />
        <Route path="/admin/beta"         element={<ProtectedRoute requiredType="admin"><AdminBeta /></ProtectedRoute>} />
        <Route path="/admin/versions"     element={<ProtectedRoute requiredType="admin"><AdminVersions /></ProtectedRoute>} />
        <Route path="/admin/pricing"      element={<ProtectedRoute requiredType="admin"><AdminPricing /></ProtectedRoute>} />
        <Route path="/admin/recette"      element={<ProtectedRoute requiredType="admin"><AdminRecette /></ProtectedRoute>} />
        <Route path="/admin/satisfaction" element={<ProtectedRoute requiredType="admin"><AdminSatisfaction /></ProtectedRoute>} />
        <Route path="/admin/index"        element={<ProtectedRoute requiredType="admin"><AdminIndex /></ProtectedRoute>} />
        <Route path="/admin/editor"       element={<ProtectedRoute requiredType="admin"><AdminPageEditor /></ProtectedRoute>} />
        <Route path="/admin/rh"           element={<ProtectedRoute requiredType="admin"><AdminRH /></ProtectedRoute>} />

        {/* Employé */}
        <Route path="/employee/dashboard" element={<ProtectedRoute requiredType="employee"><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/employee/projects"  element={<ProtectedRoute requiredType="employee"><EmployeeProjects /></ProtectedRoute>} />
        <Route path="/employee/messaging" element={<ProtectedRoute requiredType="employee"><EmployeeMessaging /></ProtectedRoute>} />
        <Route path="/employee/check"     element={<ProtectedRoute requiredType="employee"><EmployeeCheck /></ProtectedRoute>} />
        <Route path="/employee/calendar"  element={<ProtectedRoute requiredType="employee"><EmployeeCalendar /></ProtectedRoute>} />
        <Route path="/employee/leave"     element={<ProtectedRoute requiredType="employee"><EmployeeLeave /></ProtectedRoute>} />
        <Route path="/employee/account"   element={<ProtectedRoute requiredType="employee"><EmployeeAccount /></ProtectedRoute>} />
        <Route path="/employee/alerts"    element={<ProtectedRoute requiredType="employee"><EmployeeAlerts /></ProtectedRoute>} />
        <Route path="/employee/rushes"    element={<ProtectedRoute requiredType="employee"><EmployeeRushes /></ProtectedRoute>} />

        {/* Chef de projet */}
        <Route path="/chef/dashboard"    element={<ProtectedRoute requiredType="employee"><ChefDashboard /></ProtectedRoute>} />
        <Route path="/chef/calendar"     element={<ProtectedRoute requiredType="employee"><ChefCalendar /></ProtectedRoute>} />
        <Route path="/chef/reservations" element={<ProtectedRoute requiredType="employee"><ChefReservations /></ProtectedRoute>} />
        <Route path="/chef/projects"     element={<ProtectedRoute requiredType="employee"><ChefProjects /></ProtectedRoute>} />
        <Route path="/chef/alerts"       element={<ProtectedRoute requiredType="employee"><ChefAlerts /></ProtectedRoute>} />
        <Route path="/chef/library"      element={<ProtectedRoute requiredType="employee"><ChefLibrary /></ProtectedRoute>} />
        <Route path="/chef/rushes"       element={<ProtectedRoute requiredType="employee"><ChefRushes /></ProtectedRoute>} />
        <Route path="/chef/messaging"    element={<ProtectedRoute requiredType="employee"><ChefMessaging /></ProtectedRoute>} />
        <Route path="/chef/account"      element={<ProtectedRoute requiredType="employee"><ChefAccount /></ProtectedRoute>} />
        <Route path="/chef/sav"          element={<ProtectedRoute requiredType="employee"><ChefSav /></ProtectedRoute>} />
        <Route path="/chef/perf"         element={<ProtectedRoute requiredType="employee"><ChefPerf /></ProtectedRoute>} />
        <Route path="/chef/rh"           element={<ProtectedRoute requiredType="employee"><ChefRH /></ProtectedRoute>} />

        {/* Client classique */}
        <Route path="/client/dashboard"    element={<ProtectedRoute requiredType="client"><ClientDashboard /></ProtectedRoute>} />
        <Route path="/client/account"      element={<ProtectedRoute requiredType="client"><ClientAccount /></ProtectedRoute>} />
        <Route path="/client/reservations" element={<ProtectedRoute requiredType="client"><ClientReservations /></ProtectedRoute>} />
        <Route path="/client/library"      element={<ProtectedRoute requiredType="client"><ClientLibrary /></ProtectedRoute>} />
        <Route path="/client/subscription" element={<ProtectedRoute requiredType="client"><ClientSubscription /></ProtectedRoute>} />
        <Route path="/client/invoices"     element={<ProtectedRoute requiredType="client"><ClientInvoices /></ProtectedRoute>} />
        <Route path="/client/contact"      element={<ProtectedRoute requiredType="client"><ClientContact /></ProtectedRoute>} />

        {/* Client Test */}
        <Route path="/clienttest"                  element={<ClientTestLogin />} />
        <Route path="/clienttest/dashboard"        element={<ClientTestRoute><ClientTestDashboard /></ClientTestRoute>} />
        <Route path="/clienttest/reservations"     element={<ClientTestRoute><ClientTestReservations /></ClientTestRoute>} />
        <Route path="/clienttest/library"          element={<ClientTestRoute><ClientTestLibrary /></ClientTestRoute>} />
        <Route path="/clienttest/subscription"     element={<ClientTestRoute><ClientTestSubscription /></ClientTestRoute>} />
        <Route path="/clienttest/invoices"         element={<ClientTestRoute><ClientTestInvoices /></ClientTestRoute>} />
        <Route path="/clienttest/contact"          element={<ClientTestRoute><ClientTestContact /></ClientTestRoute>} />
        <Route path="/clienttest/account"          element={<ClientTestRoute><ClientTestAccount /></ClientTestRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default function AppManagement() {
  return (
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <SiteOverrideInjector />
          <ManagementRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  )
}
