const OVERRIDES_KEY = 'ls_site_overrides'
const HISTORY_KEY   = 'ls_site_overrides_history'

export function getOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}') } catch { return {} }
}

export function saveOverrides(overrides) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
  window.dispatchEvent(new CustomEvent('site-overrides-changed'))
}

export function buildCSS(overrides) {
  const rules = overrides.rules || []
  return rules.map(r => {
    const props = Object.entries(r.styles || {})
      .map(([k, v]) => `${k}: ${v} !important`)
      .join('; ')
    return `${r.selector} { ${props} }`
  }).join('\n')
}

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

export function pushHistory(snapshot, label) {
  const h = getHistory()
  h.unshift({ label, snapshot: JSON.stringify(snapshot), ts: Date.now() })
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)))
}

export function restoreSnapshot(snapshotStr) {
  try {
    const snap = JSON.parse(snapshotStr)
    saveOverrides(snap)
  } catch {}
}

export function resetOverrides() {
  localStorage.removeItem(OVERRIDES_KEY)
  window.dispatchEvent(new CustomEvent('site-overrides-changed'))
}
