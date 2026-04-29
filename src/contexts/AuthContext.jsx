import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Store } from '../data/store'

const AuthContext = createContext(null)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function logLogin(userData) {
  try {
    Store.addLoginEntry(userData.id, {
      email: userData.email,
      name: userData.name,
      userAgent: navigator.userAgent,
      ip: 'N/A',
    })
  } catch {}
}

async function fetchAccountByAuthId(authId) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('auth_id', authId)
    .single()
  if (error || !data) return null
  return data
}

// Map Supabase account row → app user shape
function toUserShape(account) {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    type: account.type,
    clientType: account.client_type,
    company: account.company,
    tps: account.tps,
    tvq: account.tvq,
    googleAuth: account.google_auth,
    pending: account.pending,
    created_at: account.created_at,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [impersonatedBy, setImpersonatedBy] = useState(null)

  // Restore session on mount
  useEffect(() => {
    // Restore impersonation backup
    const backup = localStorage.getItem('level_studio_admin_backup')
    if (backup) { try { setImpersonatedBy(JSON.parse(backup)) } catch {} }

    // Listen for Supabase auth changes (handles refresh + initial session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // During impersonation, don't overwrite the impersonated user
        const isImpersonating = !!localStorage.getItem('level_studio_admin_backup')
        if (isImpersonating) { setLoading(false); return }

        const account = await fetchAccountByAuthId(session.user.id)
        if (account) {
          const userData = toUserShape(account)
          setUser(userData)
          localStorage.setItem('level_studio_user', JSON.stringify(userData))
        }
      } else if (event === 'SIGNED_OUT') {
        // Only clear if not impersonating
        if (!localStorage.getItem('level_studio_admin_backup')) {
          setUser(null)
          localStorage.removeItem('level_studio_user')
        }
      }
      setLoading(false)
    })

    // Fallback: restore from localStorage if Supabase session is absent
    // (handles impersonated users and legacy accounts not yet in Supabase)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        const stored = localStorage.getItem('level_studio_user')
        if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (identifier, password) => {
    // 1 — Supabase Auth (primary)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      })

      if (!error && data?.user) {
        const account = await fetchAccountByAuthId(data.user.id)
        if (account) {
          if (account.pending) {
            await supabase.auth.signOut()
            return { success: false, error: 'Compte en attente de validation.' }
          }
          const userData = toUserShape(account)
          setUser(userData)
          localStorage.setItem('level_studio_user', JSON.stringify(userData))
          logLogin(userData)
          return { success: true, user: userData }
        }
      }
    } catch {}

    // 2 — localStorage fallback (legacy accounts not yet migrated to Supabase)
    const stored = Store.findAccountByEmailAndPassword(identifier, password)
    if (stored) {
      const userData = { ...stored }
      delete userData.password
      setUser(userData)
      localStorage.setItem('level_studio_user', JSON.stringify(userData))
      logLogin(userData)
      return { success: true, user: userData }
    }

    return { success: false, error: 'Identifiant ou mot de passe incorrect' }
  }

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = async ({ firstName, lastName, email, password, company, tps, tvq, clientType, googleAuth }) => {
    const name = `${firstName || ''} ${lastName || ''}`.trim()

    // Check duplicate in Supabase
    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    if (existing) return { success: false, error: 'Un compte avec cet email existe déjà.' }

    const appId = `LVL4${Math.floor(10000 + Math.random() * 90000)}`

    // Create in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: googleAuth ? Math.random().toString(36) : password,
      options: { data: { name, type: 'client', app_id: appId } },
    })

    if (authError) return { success: false, error: authError.message }

    const authId = authData.user?.id

    // Insert into accounts table
    const accountRow = {
      id: appId,
      email: email.toLowerCase(),
      name,
      type: 'client',
      client_type: clientType || 'particulier',
      company: company || null,
      tps: tps || null,
      tvq: tvq || null,
      google_auth: !!googleAuth,
      pending: false,
      active: true,
      auth_id: authId,
    }

    const { error: insertError } = await supabase.from('accounts').insert(accountRow)
    if (insertError) return { success: false, error: insertError.message }

    // Also write to localStorage for backward compat during progressive migration
    Store.addAccount({ ...accountRow, clientType: accountRow.client_type, googleAuth: accountRow.google_auth, created_at: new Date().toISOString() })

    const userData = toUserShape(accountRow)
    setUser(userData)
    localStorage.setItem('level_studio_user', JSON.stringify(userData))

    return { success: true, user: userData }
  }

  // ─── Set password (from token link) ───────────────────────────────────────
  const setAccountPassword = async (token, password) => {
    const data = Store.validatePwdToken(token)
    if (!data) return { success: false, error: 'Lien invalide ou expiré.' }
    Store.consumePwdToken(token)
    Store.updateAccount(data.accountId, { password, pending: false })

    // Also update in Supabase accounts table
    await supabase
      .from('accounts')
      .update({ pending: false })
      .eq('id', data.accountId)

    return { success: true, accountType: data.type }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setImpersonatedBy(null)
    localStorage.removeItem('level_studio_user')
    localStorage.removeItem('level_studio_admin_backup')
  }

  // ─── Impersonation (admin only — localStorage-based) ──────────────────────
  const impersonate = (account) => {
    const currentUser = JSON.parse(localStorage.getItem('level_studio_user'))
    localStorage.setItem('level_studio_admin_backup', JSON.stringify(currentUser))
    setImpersonatedBy(currentUser)
    setUser(account)
    localStorage.setItem('level_studio_user', JSON.stringify(account))
  }

  const stopImpersonating = () => {
    const admin = JSON.parse(localStorage.getItem('level_studio_admin_backup'))
    if (admin) {
      setUser(admin)
      localStorage.setItem('level_studio_user', JSON.stringify(admin))
    }
    setImpersonatedBy(null)
    localStorage.removeItem('level_studio_admin_backup')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, impersonate, stopImpersonating, impersonatedBy, setAccountPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
