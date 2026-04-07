import React, { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('ls_theme') || 'light')
  const [lang, setLang] = useState(() => localStorage.getItem('ls_lang') || 'fr')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('ls_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('ls_lang', lang)
  }, [lang])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const toggleLang = () => setLang(l => l === 'fr' ? 'en' : 'fr')

  return (
    <AppContext.Provider value={{ theme, lang, toggleTheme, toggleLang }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
