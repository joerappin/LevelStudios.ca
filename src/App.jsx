import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import MaintenancePage, { useMaintenanceBypass } from './pages/MaintenancePage'

// Public pages
import Home from './pages/Home'
import Login from './pages/Login'
import Contact from './pages/Contact'
import NewReservation from './pages/NewReservation'
import SetPassword from './pages/SetPassword'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminAccounts from './pages/admin/AdminAccounts'
import AdminCalendar from './pages/admin/AdminCalendar'
import AdminReservations from './pages/admin/AdminReservations'
import AdminProjects from './pages/admin/AdminProjects'
import AdminRushes from './pages/admin/AdminRushes'
import AdminMessaging from './pages/admin/AdminMessaging'
import AdminSAV from './pages/admin/AdminSAV'
import AdminCommunication from './pages/admin/AdminCommunication'
import AdminPromo from './pages/admin/AdminPromo'
import AdminAlerts from './pages/admin/AdminAlerts'
import AdminCheck from './pages/admin/AdminCheck'
import AdminBoarding from './pages/admin/AdminBoarding'
import AdminManual from './pages/admin/AdminManual'
import AdminTool from './pages/admin/AdminTool'
import AdminBeta from './pages/admin/AdminBeta'
import AdminVersions from './pages/admin/AdminVersions'
import AdminPricing from './pages/admin/AdminPricing'

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeProjects from './pages/employee/EmployeeProjects'
import EmployeeMessaging from './pages/employee/EmployeeMessaging'
import EmployeeCheck from './pages/employee/EmployeeCheck'
import EmployeeCalendar from './pages/employee/EmployeeCalendar'
import EmployeeLeave from './pages/employee/EmployeeLeave'
import EmployeeAccount from './pages/employee/EmployeeAccount'
import EmployeeAlerts from './pages/employee/EmployeeAlerts'

// Chef de Projet pages
import ChefDashboard from './pages/chef/ChefDashboard'
import ChefCalendar from './pages/chef/ChefCalendar'
import ChefReservations from './pages/chef/ChefReservations'
import ChefProjects from './pages/chef/ChefProjects'
import ChefAlerts from './pages/chef/ChefAlerts'
import ChefLibrary from './pages/chef/ChefLibrary'
import ChefRushes from './pages/chef/ChefRushes'
import ChefMessaging from './pages/chef/ChefMessaging'
import ChefAccount from './pages/chef/ChefAccount'
import ChefSav from './pages/chef/ChefSav'

// Rushes pages
import EmployeeRushes from './pages/employee/EmployeeRushes'

// Client pages
import ClientDashboard from './pages/client/ClientDashboard'
import ClientAccount from './pages/client/ClientAccount'
import ClientReservations from './pages/client/ClientReservations'
import ClientLibrary from './pages/client/ClientLibrary'
import ClientSubscription from './pages/client/ClientSubscription'
import ClientInvoices from './pages/client/ClientInvoices'
import ClientContact from './pages/client/ClientContact'

function ProtectedRoute({ children, requiredType }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/" replace />
  if (requiredType && user.type !== requiredType) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/reservation" element={<NewReservation />} />
      <Route path="/set-password" element={<SetPassword />} />

      <Route path="/admin/dashboard" element={<ProtectedRoute requiredType="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/accounts" element={<ProtectedRoute requiredType="admin"><AdminAccounts /></ProtectedRoute>} />
      <Route path="/admin/calendar" element={<ProtectedRoute requiredType="admin"><AdminCalendar /></ProtectedRoute>} />
      <Route path="/admin/reservations" element={<ProtectedRoute requiredType="admin"><AdminReservations /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute requiredType="admin"><AdminProjects /></ProtectedRoute>} />
      <Route path="/admin/rushes" element={<ProtectedRoute requiredType="admin"><AdminRushes /></ProtectedRoute>} />
      <Route path="/admin/messaging" element={<ProtectedRoute requiredType="admin"><AdminMessaging /></ProtectedRoute>} />
      <Route path="/admin/sav" element={<ProtectedRoute requiredType="admin"><AdminSAV /></ProtectedRoute>} />
      <Route path="/admin/communication" element={<ProtectedRoute requiredType="admin"><AdminCommunication /></ProtectedRoute>} />
      <Route path="/admin/promo" element={<ProtectedRoute requiredType="admin"><AdminPromo /></ProtectedRoute>} />
      <Route path="/admin/alerts" element={<ProtectedRoute requiredType="admin"><AdminAlerts /></ProtectedRoute>} />
      <Route path="/admin/check" element={<ProtectedRoute requiredType="admin"><AdminCheck /></ProtectedRoute>} />
      <Route path="/admin/boarding" element={<ProtectedRoute requiredType="admin"><AdminBoarding /></ProtectedRoute>} />
      <Route path="/admin/manual" element={<ProtectedRoute requiredType="admin"><AdminManual /></ProtectedRoute>} />
      <Route path="/admin/tool" element={<ProtectedRoute requiredType="admin"><AdminTool /></ProtectedRoute>} />
      <Route path="/admin/beta" element={<ProtectedRoute requiredType="admin"><AdminBeta /></ProtectedRoute>} />
      <Route path="/admin/versions" element={<ProtectedRoute requiredType="admin"><AdminVersions /></ProtectedRoute>} />
      <Route path="/admin/pricing" element={<ProtectedRoute requiredType="admin"><AdminPricing /></ProtectedRoute>} />

      <Route path="/employee/dashboard" element={<ProtectedRoute requiredType="employee"><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/employee/projects" element={<ProtectedRoute requiredType="employee"><EmployeeProjects /></ProtectedRoute>} />
      <Route path="/employee/messaging" element={<ProtectedRoute requiredType="employee"><EmployeeMessaging /></ProtectedRoute>} />
      <Route path="/employee/check" element={<ProtectedRoute requiredType="employee"><EmployeeCheck /></ProtectedRoute>} />
      <Route path="/employee/calendar" element={<ProtectedRoute requiredType="employee"><EmployeeCalendar /></ProtectedRoute>} />
      <Route path="/employee/leave" element={<ProtectedRoute requiredType="employee"><EmployeeLeave /></ProtectedRoute>} />
      <Route path="/employee/account" element={<ProtectedRoute requiredType="employee"><EmployeeAccount /></ProtectedRoute>} />
      <Route path="/employee/alerts" element={<ProtectedRoute requiredType="employee"><EmployeeAlerts /></ProtectedRoute>} />
      <Route path="/employee/rushes" element={<ProtectedRoute requiredType="employee"><EmployeeRushes /></ProtectedRoute>} />

      <Route path="/chef/dashboard" element={<ProtectedRoute requiredType="employee"><ChefDashboard /></ProtectedRoute>} />
      <Route path="/chef/calendar" element={<ProtectedRoute requiredType="employee"><ChefCalendar /></ProtectedRoute>} />
      <Route path="/chef/reservations" element={<ProtectedRoute requiredType="employee"><ChefReservations /></ProtectedRoute>} />
      <Route path="/chef/projects" element={<ProtectedRoute requiredType="employee"><ChefProjects /></ProtectedRoute>} />
      <Route path="/chef/alerts" element={<ProtectedRoute requiredType="employee"><ChefAlerts /></ProtectedRoute>} />
      <Route path="/chef/library" element={<ProtectedRoute requiredType="employee"><ChefLibrary /></ProtectedRoute>} />
      <Route path="/chef/rushes" element={<ProtectedRoute requiredType="employee"><ChefRushes /></ProtectedRoute>} />
      <Route path="/chef/messaging" element={<ProtectedRoute requiredType="employee"><ChefMessaging /></ProtectedRoute>} />
      <Route path="/chef/account" element={<ProtectedRoute requiredType="employee"><ChefAccount /></ProtectedRoute>} />
      <Route path="/chef/sav" element={<ProtectedRoute requiredType="employee"><ChefSav /></ProtectedRoute>} />

      <Route path="/client/dashboard" element={<ProtectedRoute requiredType="client"><ClientDashboard /></ProtectedRoute>} />
      <Route path="/client/account" element={<ProtectedRoute requiredType="client"><ClientAccount /></ProtectedRoute>} />
      <Route path="/client/reservations" element={<ProtectedRoute requiredType="client"><ClientReservations /></ProtectedRoute>} />
      <Route path="/client/library" element={<ProtectedRoute requiredType="client"><ClientLibrary /></ProtectedRoute>} />
      <Route path="/client/subscription" element={<ProtectedRoute requiredType="client"><ClientSubscription /></ProtectedRoute>} />
      <Route path="/client/invoices" element={<ProtectedRoute requiredType="client"><ClientInvoices /></ProtectedRoute>} />
      <Route path="/client/contact" element={<ProtectedRoute requiredType="client"><ClientContact /></ProtectedRoute>} />

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
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  )
}

export default function App() {
  return <AppWithMaintenance />
}
