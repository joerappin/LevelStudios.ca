import React, { createContext, useContext, useState, useEffect } from 'react'
import { Store } from '../data/store'

// Hardcoded admin account (never stored in files — always available)
const TEST_ACCOUNTS = [
  { email: 'joe.rappin@gmail.com', password: 'Mandrier88', type: 'admin', name: 'Joe Rappin', id: 'LVL10001' },
]

const AuthContext = createContext(null)

// ─── Fetch helpers ─────────────────────────────────────────────────────────────
async function apiGetAccounts() {
  const res = await fetch('/api/accounts.php')
  if (!res.ok) throw new Error('fetch failed')
  return res.json()
}

async function apiSaveAccount(account) {
  await fetch('/api/accounts.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  })
}

async function apiPatchAccount(id, fields) {
  await fetch('/api/accounts.php', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...fields }),
  })
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [impersonatedBy, setImpersonatedBy] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('level_studio_user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
    const backup = localStorage.getItem('level_studio_admin_backup')
    if (backup) { try { setImpersonatedBy(JSON.parse(backup)) } catch {} }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // 1 — hardcoded accounts
    const hardcoded = TEST_ACCOUNTS.find(a => a.email === email && a.password === password)
    if (hardcoded) {
      const userData = { ...hardcoded }; delete userData.password
      setUser(userData)
      localStorage.setItem('level_studio_user', JSON.stringify(userData))
      return { success: true, user: userData }
    }

    // 2 — JSON files (via Vite plugin locally / PHP on Hostinger)
    try {
      const accounts = await apiGetAccounts()
      const match = accounts.find(a => a.email === email && a.password === password && !a.pending)
      if (match) {
        const userData = { ...match }; delete userData.password
        setUser(userData)
        localStorage.setItem('level_studio_user', JSON.stringify(userData))
        return { success: true, user: userData }
      }
    } catch {}

    // 3 — localStorage fallback (legacy data)
    const stored = Store.findAccountByEmailAndPassword(email, password)
    if (stored) {
      const userData = { ...stored }; delete userData.password
      setUser(userData)
      localStorage.setItem('level_studio_user', JSON.stringify(userData))
      return { success: true, user: userData }
    }

    return { success: false, error: 'Email ou mot de passe incorrect' }
  }

  // ─── register — creates a client account, logs in immediately ────────────
  const register = ({ firstName, lastName, email, password, company, tps, tvq, clientType, googleAuth }) => {
    // Check duplicate in localStorage cache
    const existing = Store.getAccounts().find(a => a.email?.toLowerCase() === email?.toLowerCase())
    if (existing) return { success: false, error: 'Un compte avec cet email existe déjà.' }

    const id = `LVL4${Math.floor(10000 + Math.random() * 90000)}`
    const name = `${firstName || ''} ${lastName || ''}`.trim()
    const account = {
      id,
      email,
      name,
      type: 'client',
      clientType: clientType || 'particulier',
      company: company || null,
      tps: tps || null,
      tvq: tvq || null,
      password: googleAuth ? undefined : password,
      googleAuth: !!googleAuth,
      pending: false,
      created_at: new Date().toISOString(),
    }

    // Save to localStorage immediately (synchronous)
    Store.addAccount(account)

    // Persist to file (Mac → git → Hostinger) — fire and forget
    apiSaveAccount(account).catch(() => {})

    // Log in right away
    const userData = { ...account }
    delete userData.password
    setUser(userData)
    localStorage.setItem('level_studio_user', JSON.stringify(userData))

    return { success: true, user: userData }
  }

  const setAccountPassword = async (token, password) => {
    const data = Store.validatePwdToken(token)
    if (!data) return { success: false, error: 'Lien invalide ou expiré.' }
    Store.consumePwdToken(token)
    // Update in JSON file
    try { await apiPatchAccount(data.accountId, { password, pending: false }) } catch {}
    // Also update localStorage fallback
    Store.updateAccount(data.accountId, { password, pending: false })
    return { success: true, accountType: data.type }
  }

  const logout = () => {
    setUser(null)
    setImpersonatedBy(null)
    localStorage.removeItem('level_studio_user')
    localStorage.removeItem('level_studio_admin_backup')
  }

  const impersonate = (account) => {
    const currentUser = JSON.parse(localStorage.getItem('level_studio_user'))
    localStorage.setItem('level_studio_admin_backup', JSON.stringify(currentUser))
    setImpersonatedBy(currentUser)
    setUser(account)
    localStorage.setItem('level_studio_user', JSON.stringify(account))
  }

  const stopImpersonating = () => {
    const admin = JSON.parse(localStorage.getItem('level_studio_admin_backup'))
    if (admin) { setUser(admin); localStorage.setItem('level_studio_user', JSON.stringify(admin)) }
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
