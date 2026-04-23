import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Check, RotateCcw, Clock, Trash2, RefreshCw,
  MousePointer, Type, Palette, Image as ImageIcon, ChevronDown, X, Plus
} from 'lucide-react'
import {
  getOverrides, saveOverrides, buildCSS,
  getHistory, pushHistory, restoreSnapshot, resetOverrides
} from '../../data/siteOverrides'

// ── Editor injection script (injected into iframe) ─────────────────────────
const INJECT_SCRIPT = `
(function() {
  if (window.__editorInjected) return
  window.__editorInjected = true

  let selected = null
  let hovered  = null

  const overlay = document.createElement('div')
  overlay.id = '__edit-overlay'
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;pointer-events:none;'
  document.body.appendChild(overlay)

  const box = document.createElement('div')
  box.style.cssText = 'position:absolute;border:2px solid #00BCD4;border-radius:3px;pointer-events:none;transition:all 0.1s;box-shadow:0 0 0 9999px rgba(0,188,212,0.04);display:none;'
  overlay.appendChild(box)

  const selBox = document.createElement('div')
  selBox.style.cssText = 'position:absolute;border:2px solid #e8175d;border-radius:3px;pointer-events:none;box-shadow:0 0 0 9999px rgba(232,23,93,0.04);display:none;'
  overlay.appendChild(selBox)

  const label = document.createElement('div')
  label.style.cssText = 'position:absolute;background:#00BCD4;color:#000;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;font-family:monospace;white-space:nowrap;'
  overlay.appendChild(label)

  function getSelector(el) {
    if (el.id) return '#' + el.id
    if (el.tagName === 'BODY') return 'body'
    const tag = el.tagName.toLowerCase()
    const cls = Array.from(el.classList).filter(c => !c.startsWith('hover:')).slice(0, 2).join('.')
    const idx = Array.from(el.parentNode?.children || []).indexOf(el) + 1
    return cls ? tag + '.' + cls : tag + ':nth-child(' + idx + ')'
  }

  function getFullSelector(el) {
    const parts = []
    let cur = el
    let depth = 0
    while (cur && cur !== document.body && depth < 4) {
      parts.unshift(getSelector(cur))
      cur = cur.parentElement
      depth++
    }
    return parts.join(' > ')
  }

  function moveBox(el, b) {
    const r = el.getBoundingClientRect()
    b.style.display = 'block'
    b.style.left   = r.left + 'px'
    b.style.top    = r.top  + 'px'
    b.style.width  = r.width  + 'px'
    b.style.height = r.height + 'px'
  }

  document.addEventListener('mousemove', e => {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === document.body || el.id === '__edit-overlay') return
    hovered = el
    moveBox(el, box)
    label.style.display = 'block'
    label.style.left = el.getBoundingClientRect().left + 'px'
    label.style.top  = (el.getBoundingClientRect().top - 18) + 'px'
    label.textContent = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')
    label.style.background = '#00BCD4'
  }, true)

  document.addEventListener('click', e => {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === document.body || el.closest('#__edit-overlay')) return
    e.preventDefault()
    e.stopPropagation()
    selected = el
    moveBox(el, selBox)
    selBox.style.borderColor = '#e8175d'
    label.style.background = '#e8175d'

    const cs = window.getComputedStyle(el)
    window.parent.postMessage({
      type: 'element-selected',
      selector: getFullSelector(el),
      tagName: el.tagName,
      text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent : '',
      styles: {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        textAlign: cs.textAlign,
        padding: cs.padding,
        margin: cs.margin,
        borderRadius: cs.borderRadius,
        opacity: cs.opacity,
        letterSpacing: cs.letterSpacing,
        lineHeight: cs.lineHeight,
      }
    }, '*')
  }, true)

  // Listen for style preview commands from parent
  window.addEventListener('message', e => {
    if (e.data?.type === 'preview-style') {
      try {
        let tag = document.getElementById('__preview-style')
        if (!tag) { tag = document.createElement('style'); tag.id = '__preview-style'; document.head.appendChild(tag) }
        tag.textContent = e.data.css
      } catch {}
    }
    if (e.data?.type === 'preview-text' && selected) {
      if (selected.childNodes.length === 1 && selected.childNodes[0].nodeType === 3) {
        selected.textContent = e.data.text
      }
    }
  })
})()
`

// ── Color/font helpers ──────────────────────────────────────────────────────
const FONT_FAMILIES = [
  'inherit', 'Georgia, serif', '"Times New Roman", serif',
  '"Arial", sans-serif', '"Helvetica Neue", sans-serif',
  '"Inter", sans-serif', '"Roboto", sans-serif',
  '"Montserrat", sans-serif', '"Playfair Display", serif',
]

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return ''
  const m = rgb.match(/\d+/g)
  if (!m || m.length < 3) return ''
  return '#' + [m[0], m[1], m[2]].map(v => parseInt(v).toString(16).padStart(2, '0')).join('')
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminPageEditor() {
  const navigate      = useNavigate()
  const [params]      = useSearchParams()
  const pagePath      = params.get('page') || '/'
  const pageLabel     = params.get('label') || 'Page'

  const iframeRef     = useRef(null)
  const [iframeReady, setIframeReady] = useState(false)
  const [activeTab,   setActiveTab]   = useState('element') // element | global | history
  const [selected,    setSelected]    = useState(null)      // { selector, tagName, text, styles }
  const [overrides,   setOverrides]   = useState(() => getOverrides())
  const [history,     setHistory]     = useState(() => getHistory())
  const [saved,       setSaved]       = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Local edits (pending, not yet applied)
  const [pendingRules, setPendingRules] = useState([]) // [{selector, styles:{}, text}]

  const iframeOrigin = window.location.origin

  // ── Inject editor script once iframe loads ───────────────────────────────
  const injectScript = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument
      if (!doc) return
      // First inject persisted overrides as CSS
      const existing = getOverrides()
      if (existing.rules?.length) {
        let tag = doc.getElementById('__site-overrides')
        if (!tag) { tag = doc.createElement('style'); tag.id = '__site-overrides'; doc.head?.appendChild(tag) }
        tag.textContent = buildCSS(existing)
      }
      const s = doc.createElement('script')
      s.textContent = INJECT_SCRIPT
      doc.body?.appendChild(s)
      setIframeReady(true)
    } catch {}
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'element-selected') {
        setSelected(e.data)
        setActiveTab('element')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // ── Send preview CSS to iframe whenever pendingRules changes ─────────────
  useEffect(() => {
    if (!iframeReady) return
    const allRules = [...(overrides.rules || []), ...pendingRules]
    const css = allRules.map(r => {
      const props = Object.entries(r.styles || {}).map(([k, v]) => `${k}: ${v} !important`).join('; ')
      return `${r.selector} { ${props} }`
    }).join('\n')
    iframeRef.current?.contentWindow?.postMessage({ type: 'preview-style', css }, iframeOrigin)
  }, [pendingRules, iframeReady]) // eslint-disable-line

  // ── Update or create a pending rule for selected element ─────────────────
  const applyPending = (property, value) => {
    if (!selected) return
    setPendingRules(prev => {
      const idx = prev.findIndex(r => r.selector === selected.selector)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], styles: { ...updated[idx].styles, [property]: value } }
        return updated
      }
      return [...prev, { selector: selected.selector, styles: { [property]: value } }]
    })
  }

  const applyTextPending = (text) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'preview-text', text }, iframeOrigin)
  }

  // ── Save / commit all pending rules ──────────────────────────────────────
  const handleSave = () => {
    if (!pendingRules.length) return
    const current = getOverrides()
    pushHistory(current, `Modif. ${pageLabel} — ${new Date().toLocaleTimeString('fr-FR')}`)

    const existing = current.rules || []
    const merged = [...existing]
    for (const pending of pendingRules) {
      const idx = merged.findIndex(r => r.selector === pending.selector)
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], styles: { ...merged[idx].styles, ...pending.styles } }
      } else {
        merged.push(pending)
      }
    }
    const updated = { ...current, rules: merged }
    saveOverrides(updated)
    setOverrides(updated)
    setHistory(getHistory())
    setPendingRules([])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── Undo last save ────────────────────────────────────────────────────────
  const handleUndo = () => {
    const h = getHistory()
    if (!h.length) return
    restoreSnapshot(h[0].snapshot)
    const next = getHistory().slice(1)
    localStorage.setItem('ls_site_overrides_history', JSON.stringify(next))
    setOverrides(getOverrides())
    setHistory(getHistory())
    setPendingRules([])
    // Reload iframe to reflect
    if (iframeRef.current) { iframeRef.current.src = iframeRef.current.src }
  }

  // ── Reset everything ──────────────────────────────────────────────────────
  const handleReset = () => {
    if (!confirm('Réinitialiser toutes les modifications du site ?')) return
    resetOverrides()
    setOverrides({})
    setPendingRules([])
    if (iframeRef.current) { iframeRef.current.src = iframeRef.current.src }
  }

  const totalRules = (overrides.rules?.length || 0) + pendingRules.length

  // ── Current selected styles with pending merge ────────────────────────────
  const pendingForSelected = pendingRules.find(r => r.selector === selected?.selector)?.styles || {}
  const curStyles = { ...(selected?.styles || {}), ...pendingForSelected }

  const inputStyle = {
    width: '100%', background: '#111', border: '1px solid #222', borderRadius: '8px',
    padding: '7px 10px', color: '#fff', fontSize: '12px', outline: 'none',
    transition: 'border-color 0.15s',
  }

  const TABS = [
    { key: 'element', label: 'Sélection', icon: MousePointer },
    { key: 'global',  label: 'Global',    icon: Palette },
    { key: 'history', label: 'Historique', icon: Clock },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080808', overflow: 'hidden' }}>

      {/* ── Top Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/admin/index')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '12px', padding: '6px 10px', borderRadius: '8px' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#1a1a1a' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'none' }}
        >
          <ArrowLeft size={13} /> Index
        </button>

        <div style={{ width: '1px', height: '20px', background: '#1e1e1e' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e8175d' }} />
          <span style={{ color: '#ddd', fontSize: '13px', fontWeight: 600 }}>{pageLabel}</span>
          <span style={{ color: '#444', fontSize: '11px', fontFamily: 'monospace' }}>{pagePath}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Pending indicator */}
        {pendingRules.length > 0 && (
          <span style={{ background: 'rgba(232,23,93,0.12)', border: '1px solid rgba(232,23,93,0.25)', color: '#e8175d', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
            {pendingRules.length} modif. en attente
          </span>
        )}

        <button onClick={() => { if (iframeRef.current) { setIframeReady(false); iframeRef.current.src = iframeRef.current.src } }}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#888', fontSize: '12px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#888'}
        >
          <RefreshCw size={12} /> Actualiser
        </button>

        <button onClick={handleUndo} disabled={!history.length}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: '8px', padding: '6px 12px', cursor: history.length ? 'pointer' : 'default', color: history.length ? '#aaa' : '#333', fontSize: '12px' }}
          onMouseEnter={e => { if (history.length) e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => e.currentTarget.style.color = history.length ? '#aaa' : '#333'}
        >
          <RotateCcw size={12} /> Annuler
        </button>

        <button onClick={handleSave} disabled={!pendingRules.length}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: pendingRules.length ? 'linear-gradient(135deg,#e8175d,#ff4d8d)' : '#1a1a1a', border: 'none', borderRadius: '8px', padding: '7px 16px', cursor: pendingRules.length ? 'pointer' : 'default', color: pendingRules.length ? '#fff' : '#333', fontSize: '12px', fontWeight: 700, boxShadow: pendingRules.length ? '0 4px 16px rgba(232,23,93,0.3)' : 'none', transition: 'all 0.2s' }}
        >
          {saved ? <><Check size={13} /> Appliqué !</> : <><Check size={13} /> Appliquer au site</>}
        </button>
      </div>

      {/* ── Main Area ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left Sidebar ── */}
        <div style={{ width: '320px', flexShrink: 0, background: '#0d0d0d', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '12px 6px', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#e8175d' : '#555', borderBottom: `2px solid ${active ? '#e8175d' : 'transparent'}`, transition: 'all 0.15s', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#aaa' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#555' }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

            {/* ── ELEMENT TAB ── */}
            {activeTab === 'element' && (
              selected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Selector info */}
                  <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '10px', color: '#555', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Élément sélectionné</p>
                    <p style={{ fontSize: '11px', color: '#00BCD4', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selected.tagName?.toLowerCase()}</p>
                    <p style={{ fontSize: '10px', color: '#444', fontFamily: 'monospace', marginTop: '2px', wordBreak: 'break-all' }}>{selected.selector}</p>
                  </div>

                  {/* Text content */}
                  {selected.text !== '' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Texte</label>
                      <textarea
                        defaultValue={selected.text}
                        rows={2}
                        onChange={e => applyTextPending(e.target.value)}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.4 }}
                        onFocus={e => e.target.style.borderColor = '#e8175d'}
                        onBlur={e => e.target.style.borderColor = '#222'}
                      />
                    </div>
                  )}

                  {/* Font size */}
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Taille du texte
                      <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{curStyles.fontSize}</span>
                    </label>
                    <input type="range" min="8" max="96" step="1"
                      value={parseInt(curStyles.fontSize) || 16}
                      onChange={e => applyPending('font-size', e.target.value + 'px')}
                      style={{ width: '100%', accentColor: '#e8175d' }}
                    />
                  </div>

                  {/* Font family */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Police</label>
                    <select
                      value={pendingForSelected['font-family'] || ''}
                      onChange={e => applyPending('font-family', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = '#e8175d'}
                      onBlur={e => e.target.style.borderColor = '#222'}
                    >
                      {FONT_FAMILIES.map(f => <option key={f} value={f} style={{ background: '#111' }}>{f}</option>)}
                    </select>
                  </div>

                  {/* Font weight */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Graisse</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '5px' }}>
                      {['400','500','600','700','800','900'].map(w => (
                        <button key={w} onClick={() => applyPending('font-weight', w)}
                          style={{ padding: '5px', borderRadius: '6px', border: `1px solid ${(pendingForSelected['font-weight'] || parseInt(curStyles.fontWeight)) == w ? '#e8175d' : '#222'}`, background: (pendingForSelected['font-weight'] || parseInt(curStyles.fontWeight)) == w ? 'rgba(232,23,93,0.1)' : '#111', color: '#ccc', fontSize: '11px', cursor: 'pointer', fontWeight: w }}
                        >{w}</button>
                      ))}
                    </div>
                  </div>

                  {/* Text align */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Alignement</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '5px' }}>
                      {['left','center','right','justify'].map(a => (
                        <button key={a} onClick={() => applyPending('text-align', a)}
                          style={{ padding: '5px', borderRadius: '6px', border: `1px solid ${(pendingForSelected['text-align'] || curStyles.textAlign) === a ? '#e8175d' : '#222'}`, background: (pendingForSelected['text-align'] || curStyles.textAlign) === a ? 'rgba(232,23,93,0.1)' : '#111', color: '#ccc', fontSize: '10px', cursor: 'pointer' }}
                        >{a === 'justify' ? 'just.' : a}</button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Couleur du texte</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color"
                        value={pendingForSelected['color'] || rgbToHex(curStyles.color) || '#ffffff'}
                        onChange={e => applyPending('color', e.target.value)}
                        style={{ width: '36px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px', background: '#111' }}
                      />
                      <input type="text"
                        value={pendingForSelected['color'] || rgbToHex(curStyles.color) || ''}
                        onChange={e => applyPending('color', e.target.value)}
                        placeholder="#ffffff"
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={e => e.target.style.borderColor = '#e8175d'}
                        onBlur={e => e.target.style.borderColor = '#222'}
                      />
                    </div>
                  </div>

                  {/* Background */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fond</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color"
                        value={pendingForSelected['background-color'] || rgbToHex(curStyles.backgroundColor) || '#000000'}
                        onChange={e => applyPending('background-color', e.target.value)}
                        style={{ width: '36px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px', background: '#111' }}
                      />
                      <input type="text"
                        value={pendingForSelected['background-color'] || rgbToHex(curStyles.backgroundColor) || ''}
                        onChange={e => applyPending('background-color', e.target.value)}
                        placeholder="transparent"
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={e => e.target.style.borderColor = '#e8175d'}
                        onBlur={e => e.target.style.borderColor = '#222'}
                      />
                    </div>
                  </div>

                  {/* Border radius */}
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Arrondi
                      <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{pendingForSelected['border-radius'] || curStyles.borderRadius}</span>
                    </label>
                    <input type="range" min="0" max="64" step="1"
                      value={parseInt(pendingForSelected['border-radius'] || curStyles.borderRadius) || 0}
                      onChange={e => applyPending('border-radius', e.target.value + 'px')}
                      style={{ width: '100%', accentColor: '#e8175d' }}
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Opacité
                      <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{Math.round((parseFloat(pendingForSelected['opacity'] || curStyles.opacity) || 1) * 100)}%</span>
                    </label>
                    <input type="range" min="0" max="1" step="0.01"
                      value={parseFloat(pendingForSelected['opacity'] || curStyles.opacity) || 1}
                      onChange={e => applyPending('opacity', e.target.value)}
                      style={{ width: '100%', accentColor: '#e8175d' }}
                    />
                  </div>

                  {/* Letter spacing */}
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Espacement lettres
                      <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{pendingForSelected['letter-spacing'] || curStyles.letterSpacing}</span>
                    </label>
                    <input type="range" min="-2" max="20" step="0.5"
                      value={parseFloat(pendingForSelected['letter-spacing'] || curStyles.letterSpacing) || 0}
                      onChange={e => applyPending('letter-spacing', e.target.value + 'px')}
                      style={{ width: '100%', accentColor: '#e8175d' }}
                    />
                  </div>

                  {/* Padding */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Padding</label>
                    <input type="text"
                      defaultValue={curStyles.padding}
                      placeholder="ex: 16px 24px"
                      onBlur={e => applyPending('padding', e.target.value)}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#e8175d'}
                    />
                  </div>

                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', height: '200px', textAlign: 'center' }}>
                  <MousePointer size={32} style={{ color: '#2a2a2a' }} />
                  <p style={{ color: '#444', fontSize: '13px' }}>Cliquez sur un élément dans la page pour le sélectionner</p>
                </div>
              )
            )}

            {/* ── GLOBAL TAB ── */}
            {activeTab === 'global' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '12px', color: '#555', lineHeight: 1.5 }}>
                  Ces règles s'appliquent à l'ensemble du site.
                </p>

                {/* Applied rules list */}
                <div>
                  <p style={{ fontSize: '10px', color: '#666', marginBottom: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Règles actives ({totalRules})
                  </p>
                  {(overrides.rules || []).concat(pendingRules).length === 0 ? (
                    <p style={{ color: '#333', fontSize: '12px' }}>Aucune règle appliquée.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(overrides.rules || []).concat(pendingRules).map((r, i) => (
                        <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '8px 10px' }}>
                          <p style={{ fontSize: '10px', color: '#00BCD4', fontFamily: 'monospace', marginBottom: '4px', wordBreak: 'break-all' }}>{r.selector}</p>
                          {Object.entries(r.styles || {}).map(([k, v]) => (
                            <p key={k} style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>{k}: {v}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reset button */}
                <button onClick={handleReset}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(232,23,93,0.06)', border: '1px solid rgba(232,23,93,0.2)', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: '#e8175d', fontSize: '12px', fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,23,93,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(232,23,93,0.06)'}
                >
                  <Trash2 size={13} /> Réinitialiser toutes les modifications
                </button>
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '10px', color: '#666', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Historique ({history.length})
                </p>
                {history.length === 0 ? (
                  <p style={{ color: '#333', fontSize: '12px' }}>Aucun historique.</p>
                ) : (
                  history.map((entry, i) => (
                    <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '10px 12px' }}>
                      <p style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>{entry.label}</p>
                      <p style={{ fontSize: '10px', color: '#444' }}>{new Date(entry.ts).toLocaleString('fr-FR')}</p>
                      <button
                        onClick={() => { if (confirm('Restaurer cette version ?')) { restoreSnapshot(entry.snapshot); setOverrides(getOverrides()); setPendingRules([]); if (iframeRef.current) iframeRef.current.src = iframeRef.current.src } }}
                        style={{ marginTop: '8px', background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: '#888', fontSize: '11px' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#00BCD4' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#2a2a2a' }}
                      >
                        Restaurer
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── iframe Preview ── */}
        <div style={{ flex: 1, position: 'relative', background: '#050505' }}>
          {!iframeReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, background: '#080808' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', border: '2px solid #e8175d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: '#444', fontSize: '13px' }}>Chargement de la page…</p>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Instruction badge */}
          {iframeReady && !selected && (
            <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', border: '1px solid #222', borderRadius: '999px', padding: '6px 16px', pointerEvents: 'none' }}>
              <p style={{ color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MousePointer size={12} style={{ color: '#e8175d' }} />
                Cliquez sur un élément pour le modifier
              </p>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={`${iframeOrigin}${pagePath}`}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            onLoad={injectScript}
            title={pageLabel}
          />
        </div>
      </div>
    </div>
  )
}
