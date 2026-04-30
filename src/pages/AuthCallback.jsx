import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function dashboardFor(type, roleKey) {
  if (type === 'admin') return '/admin/dashboard'
  if (type === 'employee') return roleKey === 'chef_projet' ? '/chef/dashboard' : '/employee/dashboard'
  if (type === 'client') return '/client/dashboard'
  if (type === 'freelance') return '/freelance/dashboard'
  if (type === 'clienttest') return '/clienttest/dashboard'
  return '/login'
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const at = searchParams.get('at')
    const rt = searchParams.get('rt')
    if (at && rt) {
      supabase.auth.setSession({ access_token: at, refresh_token: rt })
        .then(({ error: e }) => { if (e) setError('Session invalide. Veuillez vous reconnecter.') })
    } else {
      navigate('/login', { replace: true })
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (user) {
      const redirect = searchParams.get('redirect')
      navigate(redirect || dashboardFor(user.type, user.roleKey), { replace: true })
    }
  }, [user, loading])

  return (
    <div style={{ minHeight: '100vh', background: '#01154B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      {error
        ? <p style={{ color: '#f87171', fontFamily: 'sans-serif' }}>{error}</p>
        : <div style={{ width: 32, height: 32, border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      }
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
