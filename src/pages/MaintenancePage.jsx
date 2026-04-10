import React, { useState, useEffect, useRef } from 'react'

const MAINTENANCE_KEY = 'level_maintenance_bypass'
const VALID_ID  = 'Revs'
const VALID_PWD = 'Mandrier88'

export function useMaintenanceBypass() {
  const [bypassed, setBypassed] = useState(() =>
    sessionStorage.getItem(MAINTENANCE_KEY) === 'true'
  )
  const bypass = () => {
    sessionStorage.setItem(MAINTENANCE_KEY, 'true')
    setBypassed(true)
  }
  return { bypassed, bypass }
}

/* ── Girophare animé ───────────────────────────────────────────────────────── */
function Girophare({ delay = 0 }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => {
      const id = setInterval(() => setOn(v => !v), 600)
      return () => clearInterval(id)
    }, delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Dôme */}
      <div style={{
        width: '38px', height: '22px',
        borderRadius: '19px 19px 0 0',
        background: on
          ? 'radial-gradient(ellipse at 50% 60%, #ffcc00, #ff8800)'
          : '#2a2000',
        boxShadow: on
          ? '0 0 18px 8px rgba(255,180,0,0.6), 0 0 50px 16px rgba(255,140,0,0.25)'
          : 'none',
        transition: 'background 0.1s, box-shadow 0.1s',
        border: '2px solid #444',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* reflet */}
        {on && <div style={{
          position: 'absolute', top: '3px', left: '8px',
          width: '10px', height: '6px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)',
        }} />}
      </div>
      {/* Col */}
      <div style={{ width: '10px', height: '8px', background: '#333', borderTop: '1px solid #555' }} />
      {/* Tige */}
      <div style={{ width: '6px', height: '44px', background: 'linear-gradient(180deg,#555,#333)', borderRadius: '0 0 2px 2px' }} />
      {/* Socle */}
      <div style={{ width: '20px', height: '5px', background: '#444', borderRadius: '2px' }} />
    </div>
  )
}

/* ── Barrière Jersey ────────────────────────────────────────────────────────── */
function Barrier() {
  const stripes = ['#cc1111','#ffffff','#cc1111','#ffffff','#cc1111','#ffffff','#cc1111','#ffffff']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      {/* Barre haute */}
      <div style={{
        width: '80px', height: '18px', borderRadius: '4px',
        overflow: 'hidden', border: '1.5px solid #555',
        display: 'flex', transform: 'skewX(-12deg)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      }}>
        {stripes.map((c, i) => (
          <div key={i} style={{ flex: 1, background: c }} />
        ))}
      </div>
      {/* Barre basse — inversée */}
      <div style={{
        width: '80px', height: '18px', borderRadius: '4px',
        overflow: 'hidden', border: '1.5px solid #555',
        display: 'flex', transform: 'skewX(12deg)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      }}>
        {[...stripes].reverse().map((c, i) => (
          <div key={i} style={{ flex: 1, background: c }} />
        ))}
      </div>
      {/* Pieds */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '60px', marginTop: '2px' }}>
        {[0,1].map(i => (
          <div key={i} style={{
            width: '14px', height: '12px',
            background: 'linear-gradient(180deg,#666,#333)',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }} />
        ))}
      </div>
    </div>
  )
}

/* ── Modal identifiant ──────────────────────────────────────────────────────── */
function AccessModal({ onClose, onBypass }) {
  const [id,  setId]  = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(false)
  const idRef = useRef(null)

  useEffect(() => { setTimeout(() => idRef.current?.focus(), 80) }, [])

  const submit = (e) => {
    e.preventDefault()
    if (id === VALID_ID && pwd === VALID_PWD) {
      onBypass()
    } else {
      setErr('Identifiant ou mot de passe incorrect.')
      setShake(true)
      setTimeout(() => setShake(false), 450)
    }
  }

  const inputStyle = (focused) => ({
    width: '100%', boxSizing: 'border-box',
    background: '#0a0a0a',
    border: 'none',
    borderBottom: `2px solid ${focused ? '#FFD600' : 'rgba(255,255,255,0.15)'}`,
    color: '#fff', fontSize: '14px', padding: '10px 4px',
    outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'border-color 0.2s',
  })

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: '#111',
        border: '1px solid rgba(255,214,0,0.25)',
        borderRadius: '16px',
        padding: '40px 36px',
        width: '100%', maxWidth: '360px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,214,0,0.1)',
        animation: shake ? 'shake 0.45s ease' : 'none',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>🔐</div>
          <h2 style={{
            color: '#FFD600', fontSize: '16px', fontWeight: 800, margin: 0,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'Montserrat, system-ui, sans-serif',
          }}>Accès restreint</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '6px' }}>
            Identifiez-vous pour accéder au site
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,214,0,0.7)', marginBottom: '8px' }}>
              Identifiant
            </label>
            <FocusInput ref={idRef} value={id} onChange={setId} placeholder="Votre identifiant" type="text" inputStyle={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,214,0,0.7)', marginBottom: '8px' }}>
              Mot de passe
            </label>
            <FocusInput value={pwd} onChange={setPwd} placeholder="••••••••" type="password" inputStyle={inputStyle} />
          </div>

          {err && (
            <div style={{
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '8px', color: '#f87171', fontSize: '12px',
              padding: '9px 12px', textAlign: 'center',
            }}>{err}</div>
          )}

          <button type="submit" style={{
            background: 'linear-gradient(135deg, #FFD600, #FFA500)',
            color: '#111', fontWeight: 800, fontSize: '13px',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            border: 'none', borderRadius: '8px', padding: '13px',
            cursor: 'pointer', marginTop: '4px',
            boxShadow: '0 4px 20px rgba(255,214,0,0.3)',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Accéder au site →
          </button>
        </form>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
    </div>
  )
}

/* petit helper pour gérer le focus sur l'input */
const FocusInput = React.forwardRef(({ value, onChange, placeholder, type, inputStyle }, ref) => {
  const [focused, setFocused] = useState(false)
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle(focused)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
})

/* ── Page principale ────────────────────────────────────────────────────────── */
export default function MaintenancePage({ onBypass }) {
  const [modal, setModal] = useState(false)

  // Nombre de barrières selon largeur
  const BARRIERS = 7

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, #1a1200 0%, #0a0a0a 55%, #050505 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden', position: 'relative',
      gap: 0,
    }}>

      {/* Étoiles */}
      <Stars />

      {/* Lueur jaune derrière le panneau */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(255,214,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── Rangée girophares ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        gap: '220px', marginBottom: '0px', zIndex: 2,
      }}>
        <Girophare delay={0} />
        <Girophare delay={300} />
      </div>

      {/* ── Rangée barrières haute ── */}
      <BarrierRow count={BARRIERS} />

      {/* ── Panneau cliquable ── */}
      <Sign onClick={() => setModal(true)} />

      {/* ── Rangée barrières basse ── */}
      <BarrierRow count={BARRIERS} />

      {modal && <AccessModal onClose={() => setModal(false)} onBypass={onBypass} />}
    </div>
  )
}

function BarrierRow({ count }) {
  return (
    <div style={{
      display: 'flex', gap: '6px',
      margin: '10px 0', zIndex: 2, flexWrap: 'wrap', justifyContent: 'center',
    }}>
      {Array.from({ length: count }).map((_, i) => <Barrier key={i} />)}
    </div>
  )
}

function Sign({ onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Panneau */}
      <div
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          transform: hover ? 'scale(1.025) translateY(-2px)' : 'scale(1)',
          transition: 'transform 0.2s ease',
          filter: `drop-shadow(0 8px 40px rgba(255,214,0,${hover ? '0.45' : '0.28'}))`,
        }}
      >
        <div style={{
          background: 'linear-gradient(160deg, #ffe93a 0%, #FFD600 40%, #f0c400 100%)',
          border: '5px solid #1a1a00',
          borderRadius: '10px',
          padding: '32px 44px 28px',
          minWidth: '340px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.1)',
        }}>
          {/* Boulons */}
          {[{top:9,left:9},{top:9,right:9},{bottom:9,left:9},{bottom:9,right:9}].map((s,i) => (
            <div key={i} style={{
              position: 'absolute', width: '9px', height: '9px',
              borderRadius: '50%', background: '#333',
              border: '2px solid #555', ...s,
            }} />
          ))}

          {/* Icône */}
          <div style={{ fontSize: '48px', lineHeight: 1, marginBottom: '10px' }}>⚠️</div>

          {/* Surtitre */}
          <p style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#5a4000', margin: '0 0 8px',
          }}>Level Studios</p>

          {/* Titre */}
          <h1 style={{
            fontSize: '26px', fontWeight: 900, color: '#1a1200',
            lineHeight: 1.15, margin: '0 0 8px',
            textTransform: 'uppercase', letterSpacing: '0.03em',
            fontFamily: 'Montserrat, system-ui, sans-serif',
          }}>
            Site en<br />maintenance
          </h1>

          {/* Séparateur */}
          <div style={{ width: '50px', height: '2px', background: '#5a4000', margin: '10px auto', borderRadius: '2px', opacity: 0.4 }} />

          {/* Sous-texte */}
          <p style={{ fontSize: '12px', color: '#5a4000', margin: '0 0 16px', lineHeight: 1.6, fontStyle: 'italic' }}>
            Nous revenons très bientôt<br />avec une expérience améliorée.
          </p>

          {/* Bouton hint */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#1a1200', color: '#FFD600',
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '7px 18px', borderRadius: '6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}>
            <span>🔒</span> Cliquez pour accéder
          </div>
        </div>
      </div>

      {/* Poteaux */}
      <div style={{ display: 'flex', gap: '80px' }}>
        {[0,1].map(i => (
          <div key={i} style={{
            width: '10px', height: '52px',
            background: 'linear-gradient(180deg, #777, #444)',
            borderRadius: '0 0 3px 3px',
            boxShadow: '2px 0 4px rgba(0,0,0,0.4)',
          }} />
        ))}
      </div>
    </div>
  )
}

function Stars() {
  const stars = useRef(
    Array.from({ length: 70 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 55,
      r: Math.random() * 1.5 + 0.5,
      o: Math.random() * 0.5 + 0.1,
    }))
  )
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {stars.current.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.r * 2}px`, height: `${s.r * 2}px`,
          borderRadius: '50%',
          background: 'white',
          opacity: s.o,
        }} />
      ))}
    </div>
  )
}
