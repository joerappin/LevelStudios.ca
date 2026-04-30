import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, X, Users, Star, Check, ChevronDown, ArrowRight,
  Zap, Shield, Award, Camera, Mic, Sun, CheckCircle, LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { createPageUrl } from '../utils'
import { sendWelcomeEmail } from '../utils/emailService'
import VisitorChatBot from '../components/VisitorChatBot'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
  </svg>
)

/* ─── LOGIN MODAL ──────────────────────────────────────────── */
function LoginModal({ onClose, initialTab = 'login' }) {
  const { login, register, logout } = useAuth()
  const navigate = useNavigate()
  const [brandColor, setBrandColorState] = useState(() => getBrandColor())
  useEffect(() => {
    const handler = (e) => setBrandColorState(e.detail || getBrandColor())
    window.addEventListener('ls:brandcolor', handler)
    return () => window.removeEventListener('ls:brandcolor', handler)
  }, [])

  const [tab, setTab] = useState(initialTab)
  // Login
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  // Register
  const [reg, setReg] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', company: '', tps: '', tvq: '', cgu: false })
  const [regError, setRegError] = useState('')

  const googleBtnRef = useRef(null)

  const handleGoogleCredential = (response) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      const { given_name, family_name, email, name } = payload
      const firstName = given_name || name?.split(' ')[0] || ''
      const lastName  = family_name || name?.split(' ').slice(1).join(' ') || ''
      const result = register({ firstName, lastName, email, password: `google_${Date.now()}`, googleAuth: true, clientType: 'particulier' })
      if (result.success) {
        onClose()
        sendWelcomeEmail({ firstName, lastName, email, clientType: 'particulier' })
        navigate(createPageUrl('ClientDashboard'))
      }
    } catch {}
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.google?.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential, auto_select: false })
    }
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const timer = setTimeout(() => {
      if (googleBtnRef.current && window.google?.accounts.id) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black', size: 'large',
          width: googleBtnRef.current.offsetWidth || 400,
          text: 'continue_with', shape: 'rectangular', logo_alignment: 'center',
        })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [tab])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    const result = await login(loginForm.email, loginForm.password)
    if (result.success) {
      const type = result.user.type
      if (type === 'admin' || type === 'employee' || type === 'client' || type === 'freelance') {
        logout()
        window.location.href = 'https://app.levelstudios.ca'
        return
      }
      onClose()
      navigate('/espace-client/dashboard')
    } else setLoginError(result.error)
  }

  const handleRegister = () => {
    setRegError('')
    const { firstName, lastName, email, password, confirmPassword, cgu, tps, tvq, company } = reg
    if (!firstName || !lastName || !email || !password) { setRegError('Veuillez remplir tous les champs obligatoires.'); return }
    if (password.length < 6) { setRegError('Le mot de passe doit faire au moins 6 caractères.'); return }
    if (password !== confirmPassword) { setRegError('Les mots de passe ne correspondent pas.'); return }
    if (!cgu) { setRegError('Veuillez accepter les conditions générales.'); return }
    const clientType = (tps || tvq) ? 'pro' : 'particulier'
    const result = register({ firstName, lastName, email, password, company, tps, tvq, clientType })
    if (result.success) {
      onClose()
      sendWelcomeEmail({ firstName, lastName, email, clientType })
      navigate(createPageUrl('ClientDashboard'))
    } else setRegError(result.error || 'Erreur lors de la création du compte.')
  }

  const inputCls = "w-full border rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 text-sm transition-colors"
  const inputStyle = { background: '#1a1a1a', borderColor: '#2a2a2a' }
  const labelCls = "block text-zinc-400 text-sm mb-1.5"

  const GoogleSection = () => (
    <>
      {GOOGLE_CLIENT_ID ? (
        <div ref={googleBtnRef} className="w-full overflow-hidden rounded-xl" />
      ) : (
        <button disabled className="w-full flex items-center justify-center gap-3 rounded-xl py-3 border text-sm font-medium opacity-40 cursor-not-allowed"
          style={{ borderColor: '#2a2a2a', background: '#1a1a1a', color: '#666' }}>
          {GOOGLE_ICON} Continuer avec Google
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600 font-medium">ou</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
    </>
  )

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="border rounded-2xl w-full max-w-md relative shadow-2xl overflow-y-auto" style={{ background: '#111', borderColor: hexToRgba(brandColor, 0.2), maxHeight: '90vh' }}>
        <div className="p-8">
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" style={{ width: 56, height: 56, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} alt="Level Studios" />
            <span className="text-white font-bold text-xl">Level Studios</span>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden mb-6 border" style={{ borderColor: '#222', background: '#161616' }}>
            {[['login', 'Se connecter'], ['register', 'Créer un compte']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{ background: tab === key ? brandColor : 'transparent', color: tab === key ? '#fff' : '#555' }}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <GoogleSection />
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={loginForm.email} placeholder="votre@email.com" required
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls}>Mot de passe</label>
                <input type="password" value={loginForm.password} placeholder="••••••••" required
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </div>
              {loginError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-4 py-3">{loginError}</div>}
              <button type="submit" className="w-full text-white font-bold rounded-xl py-3 transition-all hover:opacity-85"
                style={{ background: `linear-gradient(135deg,${brandColor},#ff4d8d)`, boxShadow: `0 4px 20px ${hexToRgba(brandColor, 0.35)}` }}>
                Se connecter
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <GoogleSection />
              <div className="grid grid-cols-2 gap-3">
                {[{ key: 'firstName', label: 'Prénom *' }, { key: 'lastName', label: 'Nom *' }].map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <input type="text" value={reg[f.key]} onChange={e => setReg(p => ({ ...p, [f.key]: e.target.value }))}
                      className={inputCls} style={inputStyle} />
                  </div>
                ))}
              </div>
              {[
                { key: 'email',           label: 'Email *',                    type: 'email' },
                { key: 'password',        label: 'Mot de passe *',             type: 'password' },
                { key: 'confirmPassword', label: 'Confirmer le mot de passe *', type: 'password' },
                { key: 'company',         label: 'Entreprise',                 type: 'text', opt: true },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}{f.opt && <span className="ml-1 text-xs text-zinc-600">(optionnel)</span>}</label>
                  <input type={f.type} value={reg[f.key]} onChange={e => setReg(p => ({ ...p, [f.key]: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[{ key: 'tps', label: 'TPS' }, { key: 'tvq', label: 'TVQ' }].map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label} <span className="text-xs text-zinc-600">(optionnel)</span></label>
                    <input type="text" value={reg[f.key]} onChange={e => setReg(p => ({ ...p, [f.key]: e.target.value }))}
                      className={inputCls} style={inputStyle} />
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={reg.cgu} onChange={e => setReg(p => ({ ...p, cgu: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-pink-500 flex-shrink-0" />
                <span className="text-xs text-zinc-500 leading-relaxed">
                  J'accepte les <span className="underline text-pink-500">Conditions Générales</span> et la <span className="underline text-pink-500">Politique de Confidentialité</span>
                </span>
              </label>
              {regError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-4 py-3">{regError}</div>}
              <button onClick={handleRegister} className="w-full text-white font-bold rounded-xl py-3 transition-all hover:opacity-85"
                style={{ background: `linear-gradient(135deg,${brandColor},#ff4d8d)`, boxShadow: `0 4px 20px ${hexToRgba(brandColor, 0.35)}` }}>
                Créer mon compte
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── FAQ ITEM ─────────────────────────────────────────────── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  const [brandColor, setBrandColorState] = useState(() => getBrandColor())
  useEffect(() => {
    const handler = (e) => setBrandColorState(e.detail || getBrandColor())
    window.addEventListener('ls:brandcolor', handler)
    return () => window.removeEventListener('ls:brandcolor', handler)
  }, [])
  return (
    <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${open ? hexToRgba(brandColor, 0.25) : '#1e1e1e'}`, background: '#111', transition: 'border-color 0.2s' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/3">
        <span className="text-white font-semibold text-sm">{q}</span>
        <ChevronDown size={16} style={{ color: open ? brandColor : '#555', flexShrink: 0, marginLeft: '16px', transition: 'transform 0.3s, color 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && <div className="px-5 pb-5" style={{ color: '#666', fontSize: '13px', lineHeight: 1.7 }}>{a}</div>}
    </div>
  )
}

function getBrandColor() { return localStorage.getItem('ls_brand_color') || '#e8175d' }
function hexToRgba(hex, alpha) {
  try {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch { return `rgba(232,23,93,${alpha})` }
}

/* ─── MAIN COMPONENT ──────────────────────────────────────── */
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [slideIndex, setSlideIndex] = useState(0)
  const [brandColor, setBrandColorState] = useState(() => getBrandColor())

  useEffect(() => {
    const handler = (e) => setBrandColorState(e.detail || getBrandColor())
    window.addEventListener('ls:brandcolor', handler)
    return () => window.removeEventListener('ls:brandcolor', handler)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const slideImages = [
    '/studios/studio-a.jpg',
    '/studios/studio-b.jpg',
    '/studios/studio-c.png',
  ]

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex(i => (i + 1) % slideImages.length), 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const handleDashboard = () => {
    if (!user) { setLoginOpen(true); return }
    if (user.type === 'admin') navigate(createPageUrl('Dashboard'))
    else if (user.type === 'employee') {
      if (user.roleKey === 'chef_projet') navigate(createPageUrl('ChefDashboard'))
      else navigate(createPageUrl('EmployeeDashboard'))
    } else navigate(createPageUrl('ClientDashboard'))
  }

  const studios = [
    { name: 'Studio A', capacity: '1 à 4 pers.', img: '/studios/studio-a.jpg', badge: null },
    { name: 'Studio B', capacity: '1 à 4 pers.', img: '/studios/studio-b.jpg', badge: null },
    { name: 'Studio C', capacity: '1 à 6 pers.', img: '/studios/studio-c.png', badge: null },
  ]

  const equipment = [
    {
      name: 'Sony FX30',
      desc: '3 caméras multi-angles pour une captation cinématographique 4K',
      icon: Camera,
      brand: 'SONY',
    },
    {
      name: 'Shure SM7B',
      desc: "Jusqu'à 4 micros professionnels pour chaque intervenant",
      icon: Mic,
      brand: 'SHURE',
    },
    {
      name: 'Aputure LS 300d II',
      desc: 'Éclairage studio LED 300W pour une image parfaite',
      icon: Sun,
      brand: 'APUTURE',
    },
  ]

  const reviews = [
    { name: 'Sarah K.', role: 'Podcasteuse', text: 'Qualité exceptionnelle, équipe au top. Mes épisodes ont doublé d\'audience depuis que j\'enregistre ici.', stars: 5 },
    { name: 'Marc D.', role: 'YouTubeur', text: 'Studio parfait pour mes interviews. Le rendu 4K est impressionnant et la livraison en 24h est un vrai plus.', stars: 5 },
    { name: 'Julie R.', role: 'Coach Business', text: 'Le coaching inclus dans l\'offre Gold m\'a permis de vraiment améliorer ma présence à l\'écran.', stars: 5 },
  ]

  const faqs = [
    { q: 'Comment réserver un studio ?', a: 'Cliquez sur "Réserver un studio", choisissez votre créneau et finalisez en créant un compte. Simple et rapide.' },
    { q: 'Qu\'est-ce qui est inclus dans l\'offre ARGENT ?', a: 'L\'accès au studio, un opérateur dédié, 3 caméras Sony FX30, 4 micros Shure SM7B, le pré-montage et la livraison sous 24h.' },
    { q: 'Puis-je acheter des heures à l\'avance ?', a: 'Oui, nos packs d\'heures vous permettent d\'économiser jusqu\'à 20% sur le tarif horaire.' },
    { q: 'Quelle est la différence entre ARGENT et GOLD ?', a: 'L\'offre GOLD inclut un accompagnement renforcé, une personnalisation avancée, du coaching et des options live stream.' },
    { q: 'Les fichiers sont-ils sauvegardés ?', a: 'Oui, vos fichiers sont sauvegardés pendant 14 jours avec un lien de téléchargement sécurisé.' },
  ]

  // Dégradé signature : orange → rose → violet → cyan (comme la ref)
  // display:inline-block + padding évite le clipping des lettres par WebkitBackgroundClip
  const G = {
    backgroundImage: `linear-gradient(90deg, #ff9a3c, ${brandColor}, #c879ff, #38d9f5)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontStyle: 'italic',
    fontWeight: 900,
    display: 'inline-block',
    paddingBottom: '0.22em',
    paddingRight: '0.28em',
    paddingLeft: '0.04em',
    lineHeight: 1.1,
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}

      {/* Chatbot visiteurs (non connectés uniquement) */}
      {!user && <VisitorChatBot />}

      {/* ── NAV ─────────────────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          paddingTop:   scrolled ? '12px' : '0px',
          paddingLeft:  scrolled ? '4%'   : '0px',
          paddingRight: scrolled ? '4%'   : '0px',
          transition: 'padding 0.45s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <nav
          className="w-full backdrop-blur-xl"
          style={{
            background:   scrolled ? 'rgba(8,8,8,0.97)' : 'rgba(8,8,8,0.6)',
            borderBottom: scrolled ? 'none' : '1px solid rgba(255,255,255,0.06)',
            border:       scrolled ? `1px solid ${hexToRgba(brandColor, 0.25)}` : undefined,
            borderRadius: scrolled ? '999px' : '0px',
            boxShadow:    scrolled ? '0 8px 40px rgba(0,0,0,0.8)' : 'none',
            transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{
              height:       scrolled ? '84px' : '100px',
              paddingLeft:  scrolled ? '22px' : '32px',
              paddingRight: scrolled ? '22px' : '32px',
              maxWidth: '1280px',
              margin: '0 auto',
              transition: 'height 0.45s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <img
                src="/logo.png"
                alt="Level Studios"
                className="object-contain"
                style={{
                  height: scrolled ? '72px' : '88px',
                  width:  scrolled ? '72px' : '88px',
                  filter: 'brightness(0) invert(1)',
                  transition: 'height 0.45s, width 0.45s',
                }}
              />
              <span className="font-bold tracking-tight text-white" style={{ fontSize: scrolled ? '14px' : '17px', transition: 'font-size 0.45s' }}>
                Level Studios
              </span>
            </div>

            {/* Nav links — desktop */}
            <div className="hidden md:flex items-center gap-8">
              {[['#studios','Studios'],['#tarifs','Services'],['#materiel','Matériel'],['#avis','Avis'],['contact','Contact']].map(([href, label]) => (
                href === 'contact'
                  ? <button key={href} onClick={() => navigate(createPageUrl('Contact'))}
                      className="text-zinc-500 hover:text-white transition-colors text-sm font-medium">{label}</button>
                  : <a key={href} href={href}
                      className="text-zinc-500 hover:text-white transition-colors text-sm font-medium">{label}</a>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {!user && (
                <button onClick={() => setLoginOpen(true)}
                  className="text-zinc-400 hover:text-white transition-colors text-center leading-tight">
                  <div className="text-sm font-medium">Connexion client</div>
                  <div className="text-[10px] opacity-50 font-normal">Créer son compte</div>
                </button>
              )}
              <button
                onClick={user ? handleDashboard : () => navigate(createPageUrl('Reservation'))}
                className="font-semibold text-white text-sm transition-all hover:opacity-85"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, #ff4d8d)`,
                  borderRadius: '999px',
                  padding: '10px 28px',
                  boxShadow: `0 4px 20px ${hexToRgba(brandColor, 0.4)}`,
                }}
              >
                {user ? 'Mon espace' : 'Réserver'}
              </button>
              {user && (
                <button
                  onClick={() => { logout(); navigate(user?.type === 'admin' || user?.type === 'employee' ? '/loginteamlevelprivate' : '/') }}
                  title="Se déconnecter"
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>

            {/* Mobile burger */}
            <button className="md:hidden text-zinc-400 p-1" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-2 border px-5 py-5 space-y-3 rounded-2xl"
            style={{ background: '#111', borderColor: hexToRgba(brandColor, 0.2) }}>
            {[['#studios','Studios'],['#tarifs','Services'],['#materiel','Matériel'],['#avis','Avis']].map(([href, label]) => (
              <a key={href} href={href} className="block text-zinc-300 py-2 text-sm font-medium" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <button onClick={() => { setMenuOpen(false); setLoginOpen(true) }} className="block w-full text-left text-zinc-400 py-2 text-sm">Connexion client</button>
            <button
              onClick={() => { setMenuOpen(false); navigate(createPageUrl('Reservation')) }}
              className="block w-full text-white font-bold rounded-xl py-3 text-center text-sm"
              style={{ background: `linear-gradient(135deg, ${brandColor}, #ff4d8d)` }}
            >
              Réserver
            </button>
          </div>
        )}
      </div>

      {/* ── HERO ────────────────────────────────────────────── */}
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        .fade-up-1 { animation: fadeUp 0.8s ease both; }
        .fade-up-2 { animation: fadeUp 0.8s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.8s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.8s 0.45s ease both; }

        @keyframes rainbow-drift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 400% 50%; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 40px 12px rgba(59,130,246,0.45), 0 0 90px 20px rgba(59,130,246,0.18), 0 10px 40px rgba(0,0,0,0.5); }
          40%      { box-shadow: 0 0 60px 18px rgba(99,102,241,0.55), 0 0 120px 30px rgba(139,92,246,0.22), 0 10px 40px rgba(0,0,0,0.5); }
          70%      { box-shadow: 0 0 50px 14px rgba(59,130,246,0.5),  0 0 100px 24px rgba(56,189,248,0.2),  0 10px 40px rgba(0,0,0,0.5); }
        }
        .btn-rainbow {
          background: linear-gradient(90deg,
            #ff0040, #ff6a00, #ffe000, #00e676,
            #00b0ff, #7c4dff, #e91e63, #ff4d8d,
            #ff0040
          );
          background-size: 400% 100%;
          opacity: 0.8;
          animation: rainbow-drift 15s linear infinite, glow-pulse 15s linear infinite;
        }
        .btn-rainbow:hover {
          opacity: 1;
        }

        /* ── Scroll reveal ── */
        .reveal {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-d1 { transition-delay: 0.10s; }
        .reveal-d2 { transition-delay: 0.20s; }
        .reveal-d3 { transition-delay: 0.30s; }
        .reveal-d4 { transition-delay: 0.40s; }
      `}</style>

      <section style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

        {/* Glow de fond */}
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: `radial-gradient(ellipse, ${hexToRgba(brandColor, 0.12)} 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Contenu centré */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 60px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>

          {/* Badge */}
          <div className="fade-up-1 inline-flex items-center gap-2 rounded-full mb-8"
            style={{ background: hexToRgba(brandColor, 0.1), border: `1px solid ${hexToRgba(brandColor, 0.3)}`, color: brandColor, padding: '8px 18px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: brandColor, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            3 Studios disponibles maintenant
          </div>

          {/* Headline massif */}
          <h1 className="fade-up-2 text-white" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.03em', marginBottom: '28px' }}>
            Vous avez choisi<br />
            d'être{' '}
            <span style={G}>différent.</span>
          </h1>

          {/* Sous-titre */}
          <p className="fade-up-3" style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#666', lineHeight: 1.7, marginBottom: '10px', maxWidth: '580px' }}>
            Premium.&nbsp; Personnalisable.&nbsp;{' '}
            <strong style={{ color: '#999', fontWeight: 700 }}>Unique.</strong>
          </p>
          <p className="fade-up-3" style={{ fontSize: '0.95rem', color: '#444', marginBottom: '48px' }}>
            Une production de niveau professionnel — opérateur dédié, livraison sous 24h.
          </p>

          {/* CTAs */}
          <div className="fade-up-4 flex items-center gap-4 flex-wrap justify-center" style={{ marginBottom: '64px' }}>
            <button
              onClick={() => navigate(createPageUrl('Reservation'))}
              className="btn-rainbow group inline-flex items-center gap-2 font-bold text-white transition-all"
              style={{ borderRadius: '999px', padding: '16px 36px', fontSize: '15px', border: 'none', cursor: 'pointer' }}
            >
              Réserver un studio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate(createPageUrl('Contact'))}
              className="inline-flex items-center gap-2 font-semibold text-zinc-400 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', padding: '15px 28px', fontSize: '14px', background: 'rgba(255,255,255,0.03)' }}
            >
              Nous contacter
            </button>
          </div>

          {/* Stats */}
          <div className="fade-up-4 flex items-center gap-8 flex-wrap justify-center">
            {[['📍','Montréal, QC'],['500+','sessions réalisées'],['4.9 ★','de satisfaction']].map(([val, label], i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{val}</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Image carousel plein-largeur en bas */}
        <div style={{ position: 'relative', height: '340px', flexShrink: 0 }}>
          {slideImages.map((src, i) => (
            <img key={i} src={src} alt={`Studio ${i + 1}`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === slideIndex ? 1 : 0, transition: 'opacity 1.2s ease-in-out' }}
            />
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #080808 0%, transparent 30%, transparent 65%, #080808 100%)' }} />
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
            {slideImages.map((_, i) => (
              <button key={i} onClick={() => setSlideIndex(i)}
                style={{ borderRadius: '999px', border: 'none', cursor: 'pointer', transition: 'all 0.3s', width: i === slideIndex ? '24px' : '6px', height: '6px', background: i === slideIndex ? brandColor : 'rgba(255,255,255,0.3)' }}
              />
            ))}
          </div>
        </div>

        {/* Prix de départ */}
        <div style={{ textAlign: 'center', padding: '18px 0 8px', background: '#080808' }}>
          <span style={{ color: '#fff', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>à partir de 149$</span>
          <span style={{ color: '#555', fontSize: 'clamp(1rem, 2vw, 1.5rem)', fontWeight: 700, marginLeft: '8px' }}>+tx.</span>
        </div>

        {/* ── Logo banner infini ── */}
        <div style={{ overflow: 'hidden', padding: '22px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="marquee-track" style={{ display: 'flex', alignItems: 'center', gap: 0, whiteSpace: 'nowrap', width: 'max-content', userSelect: 'none' }}>
            {[...Array(2)].flatMap((_, di) =>
              ['YouTube', 'Spotify', 'Apple Podcasts', 'TikTok', 'Instagram', 'LinkedIn', 'Deezer', 'Amazon Music', 'Twitch'].map((name, i) => (
                <span key={`${di}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '36px', padding: '0 36px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.07)', fontSize: '8px' }}>✦</span>
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── STUDIOS ─────────────────────────────────────────── */}
      <section id="studios" style={{ padding: '100px 24px', background: '#080808' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div className="reveal" style={{ marginBottom: '40px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: brandColor, marginBottom: '16px' }}>Nos Studios</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', margin: 0 }}>
                Vos studios.<br />
                À votre <span style={G}>image.</span>
              </h2>
              <button onClick={() => navigate(createPageUrl('Reservation'))}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontSize: '14px', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#555'}
              >
                Voir tous les studios <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid studios — reference style */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {studios.map((s, i) => (
              <div key={i}
                onClick={() => navigate(createPageUrl('Reservation'))}
                className={`reveal reveal-d${i + 1}`}
                style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer', aspectRatio: '4/3', background: '#111' }}
                onMouseEnter={e => {
                  e.currentTarget.querySelector('img').style.transform = 'scale(1.05)'
                  e.currentTarget.querySelector('.studio-overlay').style.opacity = '1'
                }}
                onMouseLeave={e => {
                  e.currentTarget.querySelector('img').style.transform = 'scale(1)'
                  e.currentTarget.querySelector('.studio-overlay').style.opacity = '0'
                }}
              >
                <img src={s.img} alt={s.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)', display: 'block' }}
                />
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
                {/* Hover rose tint */}
                <div className="studio-overlay" style={{ position: 'absolute', inset: 0, background: hexToRgba(brandColor, 0.07), opacity: 0, transition: 'opacity 0.3s' }} />

                {/* Top badge */}
                {s.badge && (
                  <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                    <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', borderRadius: '8px', padding: '5px 12px', border: '1px solid rgba(255,255,255,0.25)' }}>
                      {s.badge}
                    </span>
                  </div>
                )}

                {/* Bottom content */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 22px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <h3 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)', letterSpacing: '-0.02em', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.6)', margin: 0 }}>
                    {s.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, marginLeft: '12px' }}>
                    <Users size={11} style={{ color: 'rgba(255,255,255,0.6)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.capacity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFS ──────────────────────────────────────────── */}
      <section id="tarifs" style={{ padding: '100px 24px', background: '#0d0d0d' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div className="reveal" style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: brandColor, marginBottom: '16px' }}>Nos Services</p>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '16px' }}>
              Le point commun entre<br />
              <span style={G}>Joe Rogan</span>{' '}
              <span style={{ fontStyle: 'italic', color: '#fff' }}>et vous ?</span>
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#555' }}>Choisissez votre formule.</p>
          </div>

          {/* 3-column pricing cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', alignItems: 'stretch', overflow: 'visible' }}>

            {/* ── BRONZE ── */}
            <div className="reveal reveal-d1" style={{ background: '#fff', borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', color: '#888', marginBottom: '8px', fontFamily: 'Georgia, serif' }}>Bronze</span>
                <p style={{ fontSize: '12px', color: '#aaa' }}>L'essentiel pour vos productions.</p>
              </div>

              <button onClick={() => navigate(createPageUrl('Reservation'))}
                style={{ width: '100%', border: `1.5px solid ${hexToRgba(brandColor, 0.35)}`, borderRadius: '12px', padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: brandColor, background: hexToRgba(brandColor, 0.04), cursor: 'pointer', marginBottom: '28px', transition: 'all 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.background = hexToRgba(brandColor, 0.09); e.currentTarget.style.borderColor = brandColor }}
                onMouseLeave={e => { e.currentTarget.style.background = hexToRgba(brandColor, 0.04); e.currentTarget.style.borderColor = hexToRgba(brandColor, 0.35) }}
              >
                Réserver mon studio →
              </button>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {[
                  { label: 'Le Studio', items: [
                    { text: 'Studio podcast entièrement équipé', ok: true },
                    { text: 'Opérateur dédié pendant la session', ok: true },
                    { text: 'Choix du décor et ambiance', ok: true },
                  ]},
                  { label: 'Équipement', items: [
                    { text: '3 caméras Sony FX30 4K multi-angles', ok: true },
                    { text: "Jusqu'à 4 micros Shure SM7B", ok: true },
                    { text: 'Éclairage Godox SL300III-K2', ok: true },
                  ]},
                  { label: 'Services', items: [
                    { text: 'Fichiers bruts livrés sur votre espace instantanément après le tournage', ok: true },
                    { text: 'Pré-montage multicaméra & synchro audio/vidéo livrés sous 48h', ok: false },
                    { text: 'Suppression des silences', ok: false },
                    { text: 'Export WAV mixé qualité studio', ok: false },
                    { text: 'Introduction dynamique', ok: false },
                    { text: 'Motion design, animation logo', ok: false },
                    { text: 'Montage finalisé livré sous 5 jours', ok: false },
                    { text: "Jusqu'à 2 révisions possible", ok: false },
                    { text: 'Sauvegarde 7 jours', ok: true },
                  ]},
                ].map(group => (
                  <div key={group.label}>
                    <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ccc', marginBottom: '10px' }}>{group.label}</p>
                    {group.items.map(item => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '8px' }}>
                        {item.ok
                          ? <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: hexToRgba(brandColor, 0.1), border: `1px solid ${hexToRgba(brandColor, 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                              <Check size={9} style={{ color: brandColor }} />
                            </span>
                          : <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                              <X size={8} style={{ color: '#ccc' }} />
                            </span>
                        }
                        <span style={{ fontSize: '12.5px', color: item.ok ? '#333' : '#ccc', lineHeight: 1.5, textDecoration: item.ok ? 'none' : 'line-through' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* ── ARGENT (featured) ── */}
            <div className="reveal reveal-d2" style={{ background: '#fff', borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: `0 8px 60px ${hexToRgba(brandColor, 0.18)}`, border: `1.5px solid ${hexToRgba(brandColor, 0.25)}`, transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 20px 80px ${hexToRgba(brandColor, 0.38)}`; e.currentTarget.style.borderColor = hexToRgba(brandColor, 0.6) }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 8px 60px ${hexToRgba(brandColor, 0.18)}`; e.currentTarget.style.borderColor = hexToRgba(brandColor, 0.25) }}
            >
              {/* Rainbow badge */}
              <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', borderRadius: '999px', padding: '6px 20px', fontSize: '10px', fontWeight: 800, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                background: 'linear-gradient(90deg, #ff0040, #ff6a00, #ffe000, #00e676, #00b0ff, #7c4dff, #e91e63, #ff4d8d, #ff0040)',
                backgroundSize: '400% 100%', animation: 'rainbow-drift 15s linear infinite' }}>
                ✦ Best seller
              </div>

              <div style={{ marginBottom: '24px', marginTop: '20px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', color: brandColor, marginBottom: '8px', fontFamily: 'Georgia, serif' }}>Argent</span>
                <p style={{ fontSize: '12px', color: '#aaa' }}>La référence pour vos productions.</p>
              </div>

              <button onClick={() => navigate(createPageUrl('Reservation'))}
                style={{ width: '100%', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#fff', background: `linear-gradient(135deg,${brandColor},#ff4d8d)`, border: 'none', cursor: 'pointer', marginBottom: '28px', transition: 'opacity 0.2s', textAlign: 'left', boxShadow: `0 4px 20px ${hexToRgba(brandColor, 0.3)}` }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Réserver mon studio →
              </button>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {[
                  { label: 'Le Studio', items: [
                    { text: 'Studio podcast entièrement équipé' },
                    { text: 'Opérateur dédié pendant la session' },
                    { text: 'Choix du décor et ambiance' },
                  ]},
                  { label: 'Équipement', items: [
                    { text: '3 caméras Sony FX30 4K multi-angles' },
                    { text: "Jusqu'à 4 micros Shure SM7B" },
                    { text: 'Éclairage Godox SL300III-K2' },
                  ]},
                  { label: 'Services', items: [
                    { text: 'Fichiers bruts livrés sur votre espace instantanément après le tournage' },
                    { text: 'Pré-montage multicaméra & synchro audio/vidéo livrés sous 48h' },
                    { text: 'Suppression des silences' },
                    { text: 'Export WAV mixé qualité studio' },
                    { text: 'Introduction dynamique', ok: false },
                    { text: 'Motion design, animation logo', ok: false },
                    { text: 'Montage finalisé livré sous 5 jours', ok: false },
                    { text: "Jusqu'à 2 révisions possible", ok: false },
                    { text: 'Sauvegarde 14 jours' },
                  ]},
                ].map(group => (
                  <div key={group.label}>
                    <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: hexToRgba(brandColor, 0.5), marginBottom: '10px' }}>{group.label}</p>
                    {group.items.map(item => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '8px' }}>
                        {item.ok === false
                          ? <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                              <X size={8} style={{ color: '#ccc' }} />
                            </span>
                          : <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: hexToRgba(brandColor, 0.1), border: `1px solid ${hexToRgba(brandColor, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                              <Check size={9} style={{ color: brandColor }} />
                            </span>
                        }
                        <span style={{ fontSize: '12.5px', color: item.ok === false ? '#ccc' : '#222', lineHeight: 1.5, textDecoration: item.ok === false ? 'line-through' : 'none' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* ── OR ── */}
            <div className="reveal reveal-d3" style={{ background: '#fff', borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(184,134,11,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', color: '#b8860b', marginBottom: '8px', fontFamily: 'Georgia, serif' }}>Or</span>
                <p style={{ fontSize: '12px', color: '#aaa' }}>Votre épisode prêt à publier.</p>
              </div>

              <button onClick={() => navigate(createPageUrl('Reservation'))}
                style={{ width: '100%', border: `1.5px solid ${hexToRgba(brandColor, 0.35)}`, borderRadius: '12px', padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: brandColor, background: hexToRgba(brandColor, 0.04), cursor: 'pointer', marginBottom: '28px', transition: 'all 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.background = hexToRgba(brandColor, 0.09); e.currentTarget.style.borderColor = brandColor }}
                onMouseLeave={e => { e.currentTarget.style.background = hexToRgba(brandColor, 0.04); e.currentTarget.style.borderColor = hexToRgba(brandColor, 0.35) }}
              >
                Je veux mon épisode prêt à publier →
              </button>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {[
                  { label: 'Le Studio', items: [
                    { text: 'Studio podcast entièrement équipé' },
                    { text: 'Opérateur dédié pendant la session' },
                    { text: 'Choix du décor et ambiance' },
                  ]},
                  { label: 'Équipement', items: [
                    { text: '3 caméras Sony FX30 4K multi-angles' },
                    { text: "Jusqu'à 4 micros Shure SM7B" },
                    { text: 'Éclairage Godox SL300III-K2' },
                  ]},
                  { label: 'Services', items: [
                    { text: 'Fichiers bruts livrés sur votre espace instantanément après le tournage' },
                    { text: 'Pré-montage multicaméra & synchro audio/vidéo livrés sous 48h' },
                    { text: 'Suppression des silences' },
                    { text: 'Export WAV mixé qualité studio' },
                    { text: 'Introduction dynamique' },
                    { text: 'Motion design, animation logo' },
                    { text: 'Montage finalisé livré sous 5 jours' },
                    { text: "Jusqu'à 2 révisions possible" },
                    { text: 'Sauvegarde 2 mois' },
                  ]},
                ].map(group => (
                  <div key={group.label}>
                    <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ccc', marginBottom: '10px' }}>{group.label}</p>
                    {group.items.map(item => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '8px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: hexToRgba(brandColor, 0.1), border: `1px solid ${hexToRgba(brandColor, 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                          <Check size={9} style={{ color: brandColor }} />
                        </span>
                        <span style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.5 }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Options strip */}
          <div className="reveal" style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '28px 32px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Zap size={15} style={{ color: brandColor }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Options supplémentaires</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
              {[
                { label: 'Contenu', items: ['Photo', 'Short vidéo', 'Miniature'] },
                { label: 'Live', items: ['Live stream', 'Briefing live', 'Replay'] },
                { label: 'Accompagnement', items: ['Community manager', 'Coaching'] },
              ].map(g => (
                <div key={g.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', margin: 0 }}>{g.label}</p>
                    {(g.label === 'Accompagnement' || g.label === 'Live') && (
                      <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: hexToRgba(brandColor, 0.12), color: brandColor, border: `1px solid ${hexToRgba(brandColor, 0.3)}`, borderRadius: '999px', padding: '2px 8px' }}>Bientôt</span>
                    )}
                  </div>
                  {g.items.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: brandColor, flexShrink: 0 }} />
                      <span style={{ color: '#666', fontSize: '12px' }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MATÉRIEL ────────────────────────────────────────── */}
      <section id="materiel" style={{ padding: '100px 24px', background: '#080808' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: '56px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: brandColor, marginBottom: '16px' }}>Équipement</p>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              Entrez dans un{' '}
              <span style={G}>studio</span>{' '}
              <span style={{ fontStyle: 'italic', color: '#fff' }}>équipé.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {equipment.map((item, i) => (
              <div key={i} className={`reveal reveal-d${i + 1}`} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = hexToRgba(brandColor, 0.3)}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
              >
                <div style={{ aspectRatio: '16/7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#0d0d0d' }}>
                  <item.icon size={36} style={{ color: brandColor, opacity: 0.5 }} />
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.15em', color: '#fff', opacity: 0.1 }}>{item.brand}</span>
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>{item.name}</h3>
                  <p style={{ color: '#555', fontSize: '13px', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {[
              { icon: Shield, title: 'Studio acoustique', desc: 'Isolation phonique professionnelle.' },
              { icon: Zap, title: 'Livraison 24h', desc: 'Fichiers montés dans les 24h suivant la session.' },
              { icon: Award, title: 'Opérateur dédié', desc: 'Un expert présent à chaque session.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: hexToRgba(brandColor, 0.1), border: `1px solid ${hexToRgba(brandColor, 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: brandColor }} />
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{title}</h4>
                  <p style={{ color: '#555', fontSize: '12px', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVIS ────────────────────────────────────────────── */}
      <section id="avis" style={{ padding: '100px 24px', background: '#0d0d0d' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: '60px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: brandColor, marginBottom: '16px' }}>Témoignages clients</p>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              Ils ont <span style={G}>choisi</span>{' '}
              <span style={{ fontStyle: 'italic', color: '#fff' }}>Level Studios.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {reviews.map((r, i) => (
              <div key={i} className={`reveal reveal-d${i + 1}`} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = hexToRgba(brandColor, 0.25)}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
              >
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} size={14} style={{ fill: brandColor, color: brandColor }} />
                  ))}
                </div>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.7, flex: 1 }}>"{r.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg,${brandColor},#ff4d8d)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 800 }}>{r.name[0]}</span>
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{r.name}</p>
                    <p style={{ color: '#555', fontSize: '11px' }}>{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#080808' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: brandColor, marginBottom: '16px' }}>FAQ</p>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>Vos questions.</h2>
          </div>
          <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 100px', background: '#0d0d0d' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="reveal" style={{ position: 'relative', borderRadius: '24px', padding: 'clamp(48px,6vw,80px) 40px', textAlign: 'center', overflow: 'hidden', border: `1px solid ${hexToRgba(brandColor, 0.2)}`, background: `linear-gradient(135deg, ${hexToRgba(brandColor, 0.08)} 0%, rgba(8,8,8,0.95) 60%)` }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '300px', background: `radial-gradient(ellipse, ${hexToRgba(brandColor, 0.12)} 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: brandColor, marginBottom: '20px' }}>Prêt à tourner ?</p>
              <h2 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '20px' }}>
                Réservez votre<br />
                <span style={G}>studio maintenant.</span>
              </h2>
              <p style={{ color: '#555', fontSize: '1rem', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
                Quelques clics pour créer du contenu de niveau professionnel.
              </p>
              <button
                onClick={() => navigate(createPageUrl('Reservation'))}
                className="group inline-flex items-center gap-2 font-bold text-white transition-all hover:opacity-85"
                style={{ background: `linear-gradient(135deg,${brandColor},#ff4d8d)`, borderRadius: '999px', padding: '18px 48px', fontSize: '16px', boxShadow: `0 10px 40px ${hexToRgba(brandColor, 0.4)}`, border: 'none', cursor: 'pointer' }}
              >
                Réserver maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ padding: '40px 24px', background: '#080808', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <button
            onClick={() => navigate('/loginteamlevelprivate')}
            title="Accès équipe"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 1, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <img src="/logo.png" style={{ height: '56px', width: '56px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} alt="Level Studios" />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px' }}>Level Studios</span>
          </button>
          <p style={{ color: '#333', fontSize: '12px' }}>© 2026 Level Studios — Tous droits réservés.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <button onClick={() => navigate(createPageUrl('Contact'))} style={{ color: '#444', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#444'}>Contact</button>
            <a href="#" style={{ color: '#444', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#444'}>Mentions légales</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
