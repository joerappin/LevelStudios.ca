import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Check, RotateCcw, Clock, Trash2, RefreshCw,
  MousePointer, Type, Palette, Image as ImageIcon, Move, Square
} from 'lucide-react'
import {
  getOverrides, saveOverrides, buildCSS,
  getHistory, pushHistory, restoreSnapshot, resetOverrides
} from '../../data/siteOverrides'

// ── Iframe injection script ─────────────────────────────────────────────────
const INJECT_SCRIPT = `
(function() {
  if (window.__editorInjected) return
  window.__editorInjected = true

  let selected = null
  let textEditEl = null

  // ── Overlay boxes ──────────────────────────────────────────────────────
  const overlay = document.createElement('div')
  overlay.id = '__edit-overlay'
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99998;pointer-events:none;'
  document.body.appendChild(overlay)

  const hoverBox = document.createElement('div')
  hoverBox.style.cssText = 'position:fixed;border:1.5px dashed #00BCD4;border-radius:3px;pointer-events:none;display:none;transition:all 0.08s;'
  overlay.appendChild(hoverBox)

  const selBox = document.createElement('div')
  selBox.style.cssText = 'position:fixed;border:2px solid #e8175d;border-radius:3px;pointer-events:none;display:none;box-shadow:0 0 0 3px rgba(232,23,93,0.12);'
  overlay.appendChild(selBox)

  const tagLabel = document.createElement('div')
  tagLabel.style.cssText = 'position:fixed;background:#e8175d;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;font-family:monospace;display:none;z-index:99999;pointer-events:none;white-space:nowrap;'
  document.body.appendChild(tagLabel)

  // Text-edit mode toolbar (floating in iframe)
  const textToolbar = document.createElement('div')
  textToolbar.id = '__text-toolbar'
  textToolbar.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:6px 10px;display:none;gap:6px;z-index:99999;align-items:center;pointer-events:all;box-shadow:0 4px 20px rgba(0,0,0,0.5);'
  document.body.appendChild(textToolbar)

  function makeToolbarBtn(label, cmd, val) {
    const b = document.createElement('button')
    b.textContent = label
    b.style.cssText = 'background:#2a2a2a;border:1px solid #444;color:#ccc;border-radius:5px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:600;'
    b.onmouseenter = () => b.style.background = '#3a3a3a'
    b.onmouseleave = () => b.style.background = '#2a2a2a'
    b.onmousedown = (e) => {
      e.preventDefault()
      document.execCommand('styleWithCSS', false, true)
      document.execCommand(cmd, false, val)
    }
    return b
  }

  // Highlight selection button
  const hlBtn = makeToolbarBtn('Surligner', 'hiliteColor', '#ffe000')
  const boldBtn = makeToolbarBtn('G', 'bold')
  boldBtn.style.fontWeight = '900'
  const italicBtn = makeToolbarBtn('I', 'italic')
  italicBtn.style.fontStyle = 'italic'
  const colorInput = document.createElement('input')
  colorInput.type = 'color'; colorInput.value = '#e8175d'
  colorInput.style.cssText = 'width:26px;height:26px;border:none;border-radius:4px;cursor:pointer;padding:2px;background:#2a2a2a;'
  colorInput.title = 'Couleur du texte sélectionné'
  colorInput.onchange = () => {
    document.execCommand('styleWithCSS', false, true)
    document.execCommand('foreColor', false, colorInput.value)
  }
  const exitBtn = document.createElement('button')
  exitBtn.textContent = '✕ Quitter édition'
  exitBtn.style.cssText = 'background:rgba(232,23,93,0.15);border:1px solid rgba(232,23,93,0.4);color:#e8175d;border-radius:5px;padding:4px 10px;cursor:pointer;font-size:11px;margin-left:6px;'
  exitBtn.onmousedown = (e) => { e.preventDefault(); exitTextEdit() }

  const sep = document.createElement('div')
  sep.style.cssText = 'width:1px;height:18px;background:#333;'

  textToolbar.append(boldBtn, italicBtn, sep.cloneNode(), colorInput, sep.cloneNode(), hlBtn, sep.cloneNode(), exitBtn)

  // ── Helpers ─────────────────────────────────────────────────────────────
  function getSelector(el) {
    if (el.id) return '#' + CSS.escape(el.id)
    const tag = el.tagName.toLowerCase()
    if (el.parentNode) {
      const idx = Array.from(el.parentNode.children).indexOf(el) + 1
      return tag + ':nth-child(' + idx + ')'
    }
    return tag
  }
  function getFullSelector(el, depth) {
    const parts = []; let cur = el; let d = 0
    while (cur && cur !== document.body && d < (depth || 3)) {
      parts.unshift(getSelector(cur)); cur = cur.parentElement; d++
    }
    return parts.join(' > ')
  }
  function placeBox(box, el) {
    const r = el.getBoundingClientRect()
    box.style.display = 'block'
    box.style.left = r.left + 'px'; box.style.top = r.top + 'px'
    box.style.width = r.width + 'px'; box.style.height = r.height + 'px'
  }
  function isTextEl(el) {
    const tags = ['P','H1','H2','H3','H4','H5','H6','SPAN','A','BUTTON','LI','TD','TH','LABEL','STRONG','EM']
    return tags.includes(el.tagName)
  }

  // ── Text edit mode ──────────────────────────────────────────────────────
  function enterTextEdit(el) {
    if (textEditEl) exitTextEdit()
    textEditEl = el
    el.contentEditable = 'true'
    el.style.outline = '2px dashed #00BCD4'
    el.focus()
    textToolbar.style.display = 'flex'
    overlay.style.pointerEvents = 'none'
    window.parent.postMessage({ type: 'text-edit-mode', active: true }, '*')
  }
  function exitTextEdit() {
    if (!textEditEl) return
    textEditEl.contentEditable = 'false'
    textEditEl.style.outline = ''
    textEditEl = null
    textToolbar.style.display = 'none'
    overlay.style.pointerEvents = 'none'
    window.parent.postMessage({ type: 'text-edit-mode', active: false }, '*')
  }

  // ── Mouse events ─────────────────────────────────────────────────────────
  document.addEventListener('mousemove', e => {
    if (textEditEl) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === document.body || el.closest('#__edit-overlay') || el === textToolbar) return
    placeBox(hoverBox, el)
  }, true)

  document.addEventListener('mouseleave', () => { hoverBox.style.display = 'none'; tagLabel.style.display = 'none' })

  document.addEventListener('click', e => {
    if (textEditEl) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === document.body || el.closest('#__edit-overlay') || el === textToolbar) return
    e.preventDefault(); e.stopPropagation()
    selected = el
    placeBox(selBox, el)
    hoverBox.style.display = 'none'
    const cs = window.getComputedStyle(el)
    const r = el.getBoundingClientRect()
    tagLabel.style.display = 'block'
    tagLabel.style.left = r.left + 'px'
    tagLabel.style.top = Math.max(0, r.top - 20) + 'px'
    tagLabel.textContent = el.tagName.toLowerCase()
    window.parent.postMessage({
      type: 'element-selected',
      selector: getFullSelector(el),
      tagName: el.tagName,
      isText: isTextEl(el),
      text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent.trim() : '',
      styles: {
        color: cs.color, backgroundColor: cs.backgroundColor,
        fontSize: cs.fontSize, fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily, textAlign: cs.textAlign,
        borderRadius: cs.borderRadius, opacity: cs.opacity,
        letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight,
        border: cs.border, borderColor: cs.borderColor,
        borderWidth: cs.borderWidth, borderStyle: cs.borderStyle,
        transform: cs.transform,
        width: cs.width, height: cs.height,
      },
      rect: { x: r.left, y: r.top, w: r.width, h: r.height }
    }, '*')
  }, true)

  // Double-click enters text edit mode
  document.addEventListener('dblclick', e => {
    if (!selected) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === document.body) return
    e.preventDefault(); e.stopPropagation()
    enterTextEdit(el)
  }, true)

  // ── Messages from parent ──────────────────────────────────────────────────
  window.addEventListener('message', e => {
    const d = e.data
    if (!d) return

    if (d.type === 'preview-style') {
      let tag = document.getElementById('__preview-style')
      if (!tag) { tag = document.createElement('style'); tag.id = '__preview-style'; document.head.appendChild(tag) }
      tag.textContent = d.css
    }
    if (d.type === 'preview-text' && selected) {
      if (selected.childNodes.length === 1 && selected.childNodes[0].nodeType === 3)
        selected.textContent = d.text
    }
    if (d.type === 'enter-text-edit' && selected) enterTextEdit(selected)
    if (d.type === 'exit-text-edit') exitTextEdit()
    if (d.type === 'refresh-selbox' && selected) placeBox(selBox, selected)
  })
})()
`

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

// ── Main component ──────────────────────────────────────────────────────────
export default function AdminPageEditor() {
  const navigate   = useNavigate()
  const [params]   = useSearchParams()
  const pagePath   = params.get('page') || '/'
  const pageLabel  = params.get('label') || 'Page'

  const iframeRef  = useRef(null)
  const [iframeReady, setIframeReady] = useState(false)
  const [activeTab, setActiveTab]     = useState('element')
  const [selected,  setSelected]      = useState(null)
  const [textEditMode, setTextEditMode] = useState(false)
  const [overrides, setOverrides]     = useState(() => getOverrides())
  const [history,   setHistory]       = useState(() => getHistory())
  const [pending,   setPending]       = useState([])
  const [saved,     setSaved]         = useState(false)

  const iframeOrigin = window.location.origin

  // ── Inject editor script ────────────────────────────────────────────────
  const injectScript = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument
      if (!doc) return
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

  // ── Listen for iframe messages ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'element-selected') {
        setSelected(e.data)
        setActiveTab(e.data.isText ? 'text' : 'shape')
      }
      if (e.data?.type === 'text-edit-mode') {
        setTextEditMode(e.data.active)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // ── Send preview CSS to iframe ──────────────────────────────────────────
  useEffect(() => {
    if (!iframeReady) return
    const allRules = [...(overrides.rules || []), ...pending]
    const css = allRules.map(r => {
      const props = Object.entries(r.styles || {}).map(([k, v]) => `${k}: ${v} !important`).join('; ')
      return `${r.selector} { ${props} }`
    }).join('\n')
    iframeRef.current?.contentWindow?.postMessage({ type: 'preview-style', css }, iframeOrigin)
  }, [pending, iframeReady]) // eslint-disable-line

  // ── Pending rules helpers ───────────────────────────────────────────────
  const applyPending = (property, value) => {
    if (!selected) return
    setPending(prev => {
      const idx = prev.findIndex(r => r.selector === selected.selector)
      if (idx >= 0) {
        const u = [...prev]; u[idx] = { ...u[idx], styles: { ...u[idx].styles, [property]: value } }; return u
      }
      return [...prev, { selector: selected.selector, styles: { [property]: value } }]
    })
  }

  const pendingForSel = pending.find(r => r.selector === selected?.selector)?.styles || {}
  const cur = { ...(selected?.styles || {}), ...pendingForSel }

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!pending.length) return
    const current = getOverrides()
    pushHistory(current, `${pageLabel} — ${new Date().toLocaleTimeString('fr-FR')}`)
    const merged = [...(current.rules || [])]
    for (const p of pending) {
      const idx = merged.findIndex(r => r.selector === p.selector)
      if (idx >= 0) merged[idx] = { ...merged[idx], styles: { ...merged[idx].styles, ...p.styles } }
      else merged.push(p)
    }
    const updated = { ...current, rules: merged }
    saveOverrides(updated); setOverrides(updated); setHistory(getHistory())
    setPending([]); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const handleUndo = () => {
    const h = getHistory(); if (!h.length) return
    restoreSnapshot(h[0].snapshot)
    const next = getHistory().slice(1)
    localStorage.setItem('ls_site_overrides_history', JSON.stringify(next))
    setOverrides(getOverrides()); setHistory(getHistory()); setPending([])
    if (iframeRef.current) iframeRef.current.src = iframeRef.current.src
  }

  const handleReset = () => {
    if (!confirm('Réinitialiser toutes les modifications ?')) return
    resetOverrides(); setOverrides({}); setPending([])
    if (iframeRef.current) iframeRef.current.src = iframeRef.current.src
  }

  const sendToIframe = (msg) => iframeRef.current?.contentWindow?.postMessage(msg, iframeOrigin)

  // ── Styles ──────────────────────────────────────────────────────────────
  const inp = {
    width: '100%', background: '#111', border: '1px solid #222',
    borderRadius: '8px', padding: '7px 10px', color: '#fff',
    fontSize: '12px', outline: 'none', transition: 'border-color 0.15s',
  }
  const focusBorder = { onFocus: e => e.target.style.borderColor = '#e8175d', onBlur: e => e.target.style.borderColor = '#222' }

  const Row = ({ label, right, children }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ fontSize: '10px', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</label>
        {right && <span style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>{right}</span>}
      </div>
      {children}
    </div>
  )

  const ColorRow = ({ label, prop, fallback }) => (
    <Row label={label}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="color"
          value={pendingForSel[prop] || rgbToHex(selected?.styles?.[fallback]) || '#000000'}
          onChange={e => applyPending(prop, e.target.value)}
          style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px', background: '#111' }}
        />
        <input type="text"
          value={pendingForSel[prop] || rgbToHex(selected?.styles?.[fallback]) || ''}
          onChange={e => applyPending(prop, e.target.value)}
          placeholder="#rrggbb"
          style={{ ...inp, flex: 1 }} {...focusBorder}
        />
      </div>
    </Row>
  )

  const TABS = [
    { key: 'element', label: 'Infos',     icon: MousePointer },
    { key: 'text',    label: 'Texte',     icon: Type },
    { key: 'shape',   label: 'Forme',     icon: Square },
    { key: 'pos',     label: 'Position',  icon: Move },
    { key: 'history', label: 'Historique',icon: Clock },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080808', overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        <button onClick={() => navigate('/admin/index')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '12px', padding: '6px 10px', borderRadius: '8px' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#1a1a1a' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'none' }}
        ><ArrowLeft size={12} /> Index</button>

        <div style={{ width: '1px', height: '18px', background: '#1e1e1e' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#e8175d' }} />
          <span style={{ color: '#ddd', fontSize: '13px', fontWeight: 600 }}>{pageLabel}</span>
          <span style={{ color: '#444', fontSize: '11px', fontFamily: 'monospace' }}>{pagePath}</span>
        </div>
        <div style={{ flex: 1 }} />

        {textEditMode && (
          <span style={{ background: 'rgba(0,188,212,0.12)', border: '1px solid rgba(0,188,212,0.3)', color: '#00BCD4', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
            ✎ Mode édition texte — Double-cliquez pour sélectionner
          </span>
        )}
        {pending.length > 0 && !textEditMode && (
          <span style={{ background: 'rgba(232,23,93,0.1)', border: '1px solid rgba(232,23,93,0.22)', color: '#e8175d', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
            {pending.length} modif. en attente
          </span>
        )}

        <button onClick={() => { setIframeReady(false); iframeRef.current.src = iframeRef.current.src }}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#888', fontSize: '12px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#888'}
        ><RefreshCw size={11} /> Actualiser</button>

        <button onClick={handleUndo} disabled={!history.length}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: '8px', padding: '6px 12px', cursor: history.length ? 'pointer' : 'default', color: history.length ? '#aaa' : '#333', fontSize: '12px' }}
          onMouseEnter={e => { if (history.length) e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => e.currentTarget.style.color = history.length ? '#aaa' : '#333'}
        ><RotateCcw size={11} /> Annuler</button>

        <button onClick={handleSave} disabled={!pending.length}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: pending.length ? 'linear-gradient(135deg,#e8175d,#ff4d8d)' : '#1a1a1a', border: 'none', borderRadius: '8px', padding: '7px 16px', cursor: pending.length ? 'pointer' : 'default', color: pending.length ? '#fff' : '#333', fontSize: '12px', fontWeight: 700, boxShadow: pending.length ? '0 4px 16px rgba(232,23,93,0.3)' : 'none', transition: 'all 0.2s' }}
        >{saved ? <><Check size={12} /> Appliqué !</> : <><Check size={12} /> Appliquer au site</>}</button>
      </div>

      {/* ── Main ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={{ width: '300px', flexShrink: 0, background: '#0d0d0d', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
            {TABS.map(tab => {
              const Icon = tab.icon; const active = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#e8175d' : '#555', borderBottom: `2px solid ${active ? '#e8175d' : 'transparent'}`, transition: 'all 0.15s', fontSize: '9px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#aaa' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#555' }}
                ><Icon size={13} />{tab.label}</button>
              )
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

            {/* ── INFOS TAB ── */}
            {activeTab === 'element' && (
              !selected ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '200px', textAlign: 'center' }}>
                  <MousePointer size={28} style={{ color: '#2a2a2a' }} />
                  <p style={{ color: '#444', fontSize: '12px' }}>Cliquez sur un élément dans la page pour le sélectionner</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '10px', color: '#555', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Élément</p>
                    <p style={{ fontSize: '12px', color: '#00BCD4', fontFamily: 'monospace' }}>{selected.tagName?.toLowerCase()}</p>
                    <p style={{ fontSize: '10px', color: '#444', fontFamily: 'monospace', marginTop: '3px', wordBreak: 'break-all' }}>{selected.selector}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ flex: 1, background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '10px' }}>
                      <p style={{ fontSize: '9px', color: '#555', marginBottom: '3px' }}>LARGEUR</p>
                      <p style={{ fontSize: '12px', color: '#aaa', fontFamily: 'monospace' }}>{selected.rect ? Math.round(selected.rect.w) + 'px' : cur.width}</p>
                    </div>
                    <div style={{ flex: 1, background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '10px' }}>
                      <p style={{ fontSize: '9px', color: '#555', marginBottom: '3px' }}>HAUTEUR</p>
                      <p style={{ fontSize: '12px', color: '#aaa', fontFamily: 'monospace' }}>{selected.rect ? Math.round(selected.rect.h) + 'px' : cur.height}</p>
                    </div>
                  </div>
                  {selected.isText && (
                    <button onClick={() => { sendToIframe({ type: 'enter-text-edit' }); setTextEditMode(true) }}
                      style={{ width: '100%', background: 'rgba(0,188,212,0.08)', border: '1px solid rgba(0,188,212,0.25)', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: '#00BCD4', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,188,212,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,188,212,0.08)'}
                    ><Type size={13} /> Éditer le texte (sélection partielle)</button>
                  )}
                  {textEditMode && (
                    <button onClick={() => { sendToIframe({ type: 'exit-text-edit' }); setTextEditMode(false) }}
                      style={{ width: '100%', background: 'rgba(232,23,93,0.08)', border: '1px solid rgba(232,23,93,0.25)', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: '#e8175d', fontSize: '12px', fontWeight: 600 }}
                    >✕ Quitter le mode édition texte</button>
                  )}
                </div>
              )
            )}

            {/* ── TEXTE TAB ── */}
            {activeTab === 'text' && (
              !selected ? <p style={{ color: '#444', fontSize: '12px', marginTop: '20px', textAlign: 'center' }}>Sélectionnez un élément</p> : (
                <div>
                  {/* Partial text edit button */}
                  {selected.isText && (
                    <div style={{ marginBottom: '18px', background: 'rgba(0,188,212,0.06)', border: '1px solid rgba(0,188,212,0.18)', borderRadius: '8px', padding: '12px' }}>
                      <p style={{ fontSize: '11px', color: '#00BCD4', fontWeight: 600, marginBottom: '6px' }}>Édition texte partielle</p>
                      <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.5, marginBottom: '8px' }}>Double-cliquez sur l'élément dans la page pour activer l'édition. Sélectionnez ensuite le texte à modifier.</p>
                      {!textEditMode
                        ? <button onClick={() => { sendToIframe({ type: 'enter-text-edit' }); setTextEditMode(true) }}
                            style={{ width: '100%', background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.3)', borderRadius: '7px', padding: '8px', cursor: 'pointer', color: '#00BCD4', fontSize: '11px', fontWeight: 600 }}
                          >✎ Activer l'édition texte</button>
                        : <button onClick={() => { sendToIframe({ type: 'exit-text-edit' }); setTextEditMode(false) }}
                            style={{ width: '100%', background: 'rgba(232,23,93,0.1)', border: '1px solid rgba(232,23,93,0.3)', borderRadius: '7px', padding: '8px', cursor: 'pointer', color: '#e8175d', fontSize: '11px', fontWeight: 600 }}
                          >✕ Quitter l'édition texte</button>
                      }
                    </div>
                  )}

                  {/* Whole-element text content */}
                  {selected.text !== '' && (
                    <Row label="Contenu texte">
                      <textarea defaultValue={selected.text} rows={2}
                        onChange={e => sendToIframe({ type: 'preview-text', text: e.target.value })}
                        style={{ ...inp, resize: 'vertical', lineHeight: 1.4 }} {...focusBorder}
                      />
                    </Row>
                  )}

                  <Row label="Taille" right={cur.fontSize}>
                    <input type="range" min="8" max="120" step="1"
                      value={parseInt(cur.fontSize) || 16}
                      onChange={e => applyPending('font-size', e.target.value + 'px')}
                      style={{ width: '100%', accentColor: '#e8175d' }}
                    />
                  </Row>

                  <Row label="Police">
                    <select value={pendingForSel['font-family'] || ''} onChange={e => applyPending('font-family', e.target.value)}
                      style={{ ...inp, cursor: 'pointer' }} {...focusBorder}>
                      {FONT_FAMILIES.map(f => <option key={f} value={f} style={{ background: '#111' }}>{f}</option>)}
                    </select>
                  </Row>

                  <Row label="Graisse">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '4px' }}>
                      {['400','500','600','700','800','900'].map(w => (
                        <button key={w} onClick={() => applyPending('font-weight', w)}
                          style={{ padding: '5px 2px', borderRadius: '6px', border: `1px solid ${(pendingForSel['font-weight'] || parseInt(cur.fontWeight)) == w ? '#e8175d' : '#222'}`, background: (pendingForSel['font-weight'] || parseInt(cur.fontWeight)) == w ? 'rgba(232,23,93,0.1)' : '#111', color: '#ccc', fontSize: '11px', cursor: 'pointer', fontWeight: w }}
                        >{w}</button>
                      ))}
                    </div>
                  </Row>

                  <Row label="Alignement">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px' }}>
                      {['left','center','right','justify'].map(a => (
                        <button key={a} onClick={() => applyPending('text-align', a)}
                          style={{ padding: '5px', borderRadius: '6px', border: `1px solid ${(pendingForSel['text-align'] || cur.textAlign) === a ? '#e8175d' : '#222'}`, background: (pendingForSel['text-align'] || cur.textAlign) === a ? 'rgba(232,23,93,0.1)' : '#111', color: '#ccc', fontSize: '10px', cursor: 'pointer' }}
                        >{a === 'justify' ? 'just.' : a}</button>
                      ))}
                    </div>
                  </Row>

                  <ColorRow label="Couleur texte" prop="color" fallback="color" />

                  <Row label="Espacement lettres" right={pendingForSel['letter-spacing'] || cur.letterSpacing}>
                    <input type="range" min="-2" max="20" step="0.5"
                      value={parseFloat(pendingForSel['letter-spacing'] || cur.letterSpacing) || 0}
                      onChange={e => applyPending('letter-spacing', e.target.value + 'px')}
                      style={{ width: '100%', accentColor: '#e8175d' }}
                    />
                  </Row>

                  <Row label="Interligne" right={pendingForSel['line-height'] || cur.lineHeight}>
                    <input type="range" min="0.8" max="3" step="0.05"
                      value={parseFloat(pendingForSel['line-height'] || cur.lineHeight) || 1.5}
                      onChange={e => applyPending('line-height', e.target.value)}
                      style={{ width: '100%', accentColor: '#e8175d' }}
                    />
                  </Row>
                </div>
              )
            )}

            {/* ── FORME TAB ── */}
            {activeTab === 'shape' && (
              !selected ? <p style={{ color: '#444', fontSize: '12px', marginTop: '20px', textAlign: 'center' }}>Sélectionnez un élément</p> : (
                <div>
                  {/* Remplissage */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '10px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '12px', background: '#555', borderRadius: '2px', display: 'inline-block' }} /> Remplissage
                    </p>
                    <ColorRow label="Couleur de fond" prop="background-color" fallback="backgroundColor" />
                    <Row label="Opacité" right={Math.round((parseFloat(pendingForSel['opacity'] || cur.opacity) || 1) * 100) + '%'}>
                      <input type="range" min="0" max="1" step="0.01"
                        value={parseFloat(pendingForSel['opacity'] || cur.opacity) || 1}
                        onChange={e => applyPending('opacity', e.target.value)}
                        style={{ width: '100%', accentColor: '#e8175d' }}
                      />
                    </Row>
                  </div>

                  <div style={{ height: '1px', background: '#1a1a1a', margin: '4px 0 20px' }} />

                  {/* Contour */}
                  <div>
                    <p style={{ fontSize: '10px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '12px', border: '2px solid #555', borderRadius: '2px', display: 'inline-block' }} /> Contour
                    </p>

                    <Row label="Épaisseur" right={(pendingForSel['border-width'] || '0') + ''}>
                      <input type="range" min="0" max="12" step="1"
                        value={parseInt(pendingForSel['border-width'] || cur.borderWidth) || 0}
                        onChange={e => {
                          applyPending('border-width', e.target.value + 'px')
                          if (parseInt(e.target.value) > 0 && !pendingForSel['border-style']) applyPending('border-style', 'solid')
                        }}
                        style={{ width: '100%', accentColor: '#e8175d' }}
                      />
                    </Row>

                    <Row label="Style contour">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px' }}>
                        {['solid','dashed','dotted','double'].map(s => (
                          <button key={s} onClick={() => applyPending('border-style', s)}
                            style={{ padding: '5px 2px', borderRadius: '6px', border: `1px solid ${(pendingForSel['border-style'] || cur.borderStyle) === s ? '#e8175d' : '#222'}`, background: (pendingForSel['border-style'] || cur.borderStyle) === s ? 'rgba(232,23,93,0.1)' : '#111', color: '#ccc', fontSize: '10px', cursor: 'pointer' }}
                          >{s}</button>
                        ))}
                      </div>
                    </Row>

                    <ColorRow label="Couleur contour" prop="border-color" fallback="borderColor" />

                    <Row label="Arrondi" right={(pendingForSel['border-radius'] || cur.borderRadius)}>
                      <input type="range" min="0" max="64" step="1"
                        value={parseInt(pendingForSel['border-radius'] || cur.borderRadius) || 0}
                        onChange={e => applyPending('border-radius', e.target.value + 'px')}
                        style={{ width: '100%', accentColor: '#e8175d' }}
                      />
                    </Row>
                  </div>
                </div>
              )
            )}

            {/* ── POSITION TAB ── */}
            {activeTab === 'pos' && (
              !selected ? <p style={{ color: '#444', fontSize: '12px', marginTop: '20px', textAlign: 'center' }}>Sélectionnez un élément</p> : (
                <div>
                  <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.5, marginBottom: '16px' }}>
                    Déplace l'élément via <code style={{ color: '#00BCD4' }}>transform: translate</code>, sans perturber le reste de la mise en page.
                  </p>

                  {/* X axis */}
                  {(() => {
                    const nudgeBtnStyle = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#888', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', lineHeight: 1, flexShrink: 0, userSelect: 'none' }
                    const nudgeBtnHover = e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.color = '#fff' }
                    const nudgeBtnLeave = e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#888' }
                    const txVal = parseInt(pendingForSel['--tx']) || 0
                    const tyVal = parseInt(pendingForSel['--ty']) || 0
                    const setTX = (tx) => { applyPending('--tx', tx); applyPending('transform', `translate(${tx}px, ${tyVal}px)`); sendToIframe({ type: 'refresh-selbox' }) }
                    const setTY = (ty) => { applyPending('--ty', ty); applyPending('transform', `translate(${txVal}px, ${ty}px)`); sendToIframe({ type: 'refresh-selbox' }) }
                    return <>
                      <Row label="Axe X (horizontal)" right={txVal + 'px'}>
                        <input type="range" min="-400" max="400" step="1"
                          value={txVal}
                          onChange={e => setTX(parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: '#e8175d' }}
                        />
                        <div style={{ display: 'flex', gap: '5px', marginTop: '6px', alignItems: 'center' }}>
                          <button style={nudgeBtnStyle} onMouseEnter={nudgeBtnHover} onMouseLeave={nudgeBtnLeave} onClick={() => setTX(txVal - 1)}>−</button>
                          <input type="number" value={txVal}
                            onChange={e => setTX(parseInt(e.target.value) || 0)}
                            style={{ ...inp, flex: 1, textAlign: 'center' }} {...focusBorder}
                          />
                          <button style={nudgeBtnStyle} onMouseEnter={nudgeBtnHover} onMouseLeave={nudgeBtnLeave} onClick={() => setTX(txVal + 1)}>+</button>
                          <span style={{ color: '#555', fontSize: '12px' }}>px</span>
                        </div>
                      </Row>

                      <Row label="Axe Y (vertical)" right={tyVal + 'px'}>
                        <input type="range" min="-400" max="400" step="1"
                          value={tyVal}
                          onChange={e => setTY(parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: '#e8175d' }}
                        />
                        <div style={{ display: 'flex', gap: '5px', marginTop: '6px', alignItems: 'center' }}>
                          <button style={nudgeBtnStyle} onMouseEnter={nudgeBtnHover} onMouseLeave={nudgeBtnLeave} onClick={() => setTY(tyVal - 1)}>−</button>
                          <input type="number" value={tyVal}
                            onChange={e => setTY(parseInt(e.target.value) || 0)}
                            style={{ ...inp, flex: 1, textAlign: 'center' }} {...focusBorder}
                          />
                          <button style={nudgeBtnStyle} onMouseEnter={nudgeBtnHover} onMouseLeave={nudgeBtnLeave} onClick={() => setTY(tyVal + 1)}>+</button>
                          <span style={{ color: '#555', fontSize: '12px' }}>px</span>
                        </div>
                      </Row>
                    </>
                  })()}

                  {/* Reset position */}
                  <button onClick={() => {
                    applyPending('--tx', 0); applyPending('--ty', 0); applyPending('transform', 'translate(0px, 0px)')
                  }}
                    style={{ width: '100%', marginTop: '8px', background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#666', fontSize: '12px' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#444' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#222' }}
                  >Réinitialiser la position</button>

                  <div style={{ height: '1px', background: '#1a1a1a', margin: '20px 0' }} />

                  {/* Padding / margin */}
                  <Row label="Padding">
                    <input type="text" defaultValue={cur.padding} placeholder="ex: 16px 24px"
                      onBlur={e => applyPending('padding', e.target.value)}
                      style={inp} {...focusBorder}
                    />
                  </Row>
                  <Row label="Margin">
                    <input type="text" defaultValue={cur.margin} placeholder="ex: 0 auto"
                      onBlur={e => applyPending('margin', e.target.value)}
                      style={inp} {...focusBorder}
                    />
                  </Row>
                </div>
              )
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <p style={{ fontSize: '10px', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Historique ({history.length})</p>
                  <button onClick={handleReset}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid rgba(232,23,93,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#e8175d', fontSize: '10px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,23,93,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  ><Trash2 size={10} /> Reset site</button>
                </div>
                {history.length === 0
                  ? <p style={{ color: '#333', fontSize: '12px' }}>Aucun historique.</p>
                  : history.map((entry, i) => (
                    <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '10px 12px' }}>
                      <p style={{ fontSize: '12px', color: '#ccc', marginBottom: '3px' }}>{entry.label}</p>
                      <p style={{ fontSize: '10px', color: '#444' }}>{new Date(entry.ts).toLocaleString('fr-FR')}</p>
                      <button onClick={() => { if (confirm('Restaurer cette version ?')) { restoreSnapshot(entry.snapshot); setOverrides(getOverrides()); setPending([]); iframeRef.current.src = iframeRef.current.src } }}
                        style={{ marginTop: '8px', background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: '#888', fontSize: '11px' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#00BCD4' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#2a2a2a' }}
                      >Restaurer</button>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* ── iframe ── */}
        <div style={{ flex: 1, position: 'relative', background: '#050505' }}>
          {!iframeReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, background: '#080808' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', border: '2px solid #e8175d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: '#444', fontSize: '13px' }}>Chargement…</p>
              </div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          {iframeReady && !selected && (
            <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', border: '1px solid #222', borderRadius: '999px', padding: '6px 16px', pointerEvents: 'none' }}>
              <p style={{ color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <MousePointer size={11} style={{ color: '#e8175d' }} /> Cliquez sur un élément · Double-clic pour éditer le texte
              </p>
            </div>
          )}
          <iframe ref={iframeRef} src={`${iframeOrigin}${pagePath}`}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            onLoad={injectScript} title={pageLabel}
          />
        </div>
      </div>
    </div>
  )
}
