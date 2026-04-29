// Build public — levelstudios.ca
// Routes : landing page, contact, réservation, portail Pathé (neo)

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import MaintenancePage, { useMaintenanceBypass } from './pages/MaintenancePage'
import { syncAll } from './lib/db'
import { useRealtimeSync } from './lib/realtime'

// Public pages
import Home          from './pages/Home'
import HomeNeo       from './pages/HomeNeo'
import Contact       from './pages/Contact'
import NewReservation from './pages/NewReservation'
import SetPassword   from './pages/SetPassword'

// Portail Pathé (neo) — reste sur levelstudios.ca
import ClientNeoLogin        from './pages/clientneo/ClientNeoLogin'
import ClientNeoDashboard    from './pages/clientneo/ClientNeoDashboard'
import ClientNeoReservations from './pages/clientneo/ClientNeoReservations'
import ClientNeoLibrary      from './pages/clientneo/ClientNeoLibrary'
import ClientNeoSubscription from './pages/clientneo/ClientNeoSubscription'
import ClientNeoInvoices     from './pages/clientneo/ClientNeoInvoices'
import ClientNeoContact      from './pages/clientneo/ClientNeoContact'
import ClientNeoAccount      from './pages/clientneo/ClientNeoAccount'

function ClientNeoRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00bcd4', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!user || (user.type !== 'clienttest' && user.type !== 'client')) return <Navigate to="/pathe" replace />
  return children
}

function PageGateRoute({ children, path }) {
  const { user } = useAuth()
  if (user?.type === 'admin') return children
  try {
    const disabled = JSON.parse(localStorage.getItem('ls_page_visibility') || '{}')
    if (disabled[path]) return <Navigate to="/" replace />
  } catch {}
  return children
}

function PublicRoutes() {
  const { user } = useAuth()
  useRealtimeSync(!!user)
  React.useEffect(() => { if (user) syncAll().catch(() => {}) }, [user?.id])

  return (
    <Routes>
      <Route path="/"    element={<PageGateRoute path="/"><Home /></PageGateRoute>} />
      <Route path="/neo" element={<HomeNeo />} />

      <Route path="/contact"     element={<PageGateRoute path="/contact"><Contact /></PageGateRoute>} />
      <Route path="/reservation" element={<PageGateRoute path="/reservation"><NewReservation /></PageGateRoute>} />
      <Route path="/set-password" element={<SetPassword />} />

      {/* Portail Pathé (neo) */}
      <Route path="/pathe"                  element={<ClientNeoLogin />} />
      <Route path="/pathe/dashboard"        element={<ClientNeoRoute><ClientNeoDashboard /></ClientNeoRoute>} />
      <Route path="/pathe/reservations"     element={<ClientNeoRoute><ClientNeoReservations /></ClientNeoRoute>} />
      <Route path="/pathe/library"          element={<ClientNeoRoute><ClientNeoLibrary /></ClientNeoRoute>} />
      <Route path="/pathe/subscription"     element={<ClientNeoRoute><ClientNeoSubscription /></ClientNeoRoute>} />
      <Route path="/pathe/invoices"         element={<ClientNeoRoute><ClientNeoInvoices /></ClientNeoRoute>} />
      <Route path="/pathe/contact"          element={<ClientNeoRoute><ClientNeoContact /></ClientNeoRoute>} />
      <Route path="/pathe/account"          element={<ClientNeoRoute><ClientNeoAccount /></ClientNeoRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppWithMaintenance() {
  const { bypassed, bypass } = useMaintenanceBypass()
  if (!bypassed) return <MaintenancePage onBypass={bypass} />
  return (
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <PublicRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  )
}

export default function AppPublic() {
  return <AppWithMaintenance />
}
