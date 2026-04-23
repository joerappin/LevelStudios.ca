import { useEffect, useState } from 'react'
import { buildCSS, getOverrides } from '../data/siteOverrides'

export default function SiteOverrideInjector() {
  const [css, setCss] = useState(() => buildCSS(getOverrides()))

  useEffect(() => {
    const refresh = () => setCss(buildCSS(getOverrides()))
    window.addEventListener('site-overrides-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('site-overrides-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  if (!css) return null
  return <style id="site-overrides">{css}</style>
}
