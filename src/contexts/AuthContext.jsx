import React, { createContext, useContext, useState, useEffect } from 'react'
import { Store } from '../data/store'
import { fsGetAccountByEmail, fsUpdateAccount } from '../lib/firestoreService'
// type helper: maps stored account type to Firestore collection key
function typeFor(data) { return data?.type || 'client' }

const TEST_ACCOUNTS = [
  {
    email: 'joe.rappin@gmail.com',
    password: 'Mandrier88',
    type: 'admin',
    name: 'Joe Rappin',
    id: 'LVL10001',
  },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [impersonatedBy, setImpersonatedBy] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('level_studio_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    const backup = localStorage.getItem('level_studio_admin_backup')
    if (backup) {
      try { setImpersonatedBy(JSON.parse(backup)) } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Check hardcoded test accounts first
    const account = TEST_ACCOUNTS.find(a => a.email === email && a.password === password)
    if (account) {
      const userData = { ...account }
      delete userData.password
      setUser(userData)
      localStorage.setItem('level_studio_user', JSON.stringify(userData))
      return { success: true, user: userData }
    }
    // Check Firestore first
    try {
      const fsAccount = await fsGetAccountByEmail(email)
      if (fsAccount && fsAccount.password === password && !fsAccount.pending) {
        const userData = { ...fsAccount }
        delete userData.password
        setUser(userData)
        localStorage.setItem('level_studio_user', JSON.stringify(userData))
        return { success: true, user: userData }
      }
    } catch {}
    // Fallback: localStorage
    const stored = Store.findAccountByEmailAndPassword(email, password)
    if (stored) {
      const userData = { ...stored }
      delete userData.password
      setUser(userData)
      localStorage.setItem('level_studio_user', JSON.stringify(userData))
      return { success: true, user: userData }
    }
    return { success: false, error: 'Email ou mot de passe incorrect' }
  }

  const setAccountPassword = async (token, password) => {
    const data = Store.validatePwdToken(token)
    if (!data) return { success: false, error: 'Lien invalide ou expiré.' }
    Store.updateAccount(data.accountId, { password, pending: false })
    Store.consumePwdToken(token)
    try { await fsUpdateAccount(data.accountId, data.type || 'client', { password, pending: false }) } catch {}
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
    if (admin) {
      setUser(admin)
      localStorage.setItem('level_studio_user', JSON.stringify(admin))
    }
    setImpersonatedBy(null)
    localStorage.removeItem('level_studio_admin_backup')
  }

  const register = (data) => {
    const newUser = {
      email: data.email,
      type: 'client',
      name: `${data.firstName} ${data.lastName}`,
      id: `LVL3C${Math.floor(Math.random() * 90000) + 10000}`,
      phone: data.phone || '',
      clientType: data.clientType || 'particulier',
    }
    setUser(newUser)
    localStorage.setItem('level_studio_user', JSON.stringify(newUser))
    return { success: true, user: newUser }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, impersonate, stopImpersonating, impersonatedBy, setAccountPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
