import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, X, Users, Star, Check, ChevronDown, ArrowRight,
  Zap, Shield, Award, Camera, Mic, Sun
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { createPageUrl } from '../utils'

/* ─── LOGIN MODAL ──────────────────────────────────────────── */
function LoginModal({ onClose }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    const result = login(email, password)
    if (result.success) {
      onClose()
      if (result.user.type === 'admin') navigate(createPageUrl('Dashboard'))
      else if (result.user.type === 'employee') {
        if (result.user.roleKey === 'chef_projet') navigate(createPageUrl('ChefDashboard'))
        else navigate(createPageUrl('EmployeeDashboard'))
      } else navigate(createPageUrl('ClientDashboard'))
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="border rounded-2xl w-full max-w-md p-8 relative shadow-2xl" style={{ background: '#111', borderColor: 'rgba(232,23,93,0.2)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo-brand.jpg" className="h-10 w-10 object-contain" alt="Level Studios" style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 0 5px #0A5399)' }} />
          <span className="text-white font-bold text-xl">Level Studios</span>
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Connexion</h2>
        <p className="text-zinc-400 text-sm mb-6">Accédez à votre espace personnel</p>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 text-sm transition-colors"
              style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
              placeholder="votre@email.com"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Mot de passe</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 text-sm transition-colors"
              style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full text-white font-bold rounded-xl py-3 transition-all mt-2 hover:opacity-85" style={{ background: 'linear-gradient(135deg,#e8175d,#ff4d8d)', boxShadow: '0 4px 20px rgba(232,23,93,0.35)' }}>
            Se connecter
          </button>
        </form>
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid #1e1e1e' }}>
          <p className="text-zinc-600 text-xs text-center mb-3">Comptes de démonstration</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { role: 'Admin', email: 'joe.rappin@gmail.com', pwd: 'level88' },
              { role: 'Employé', email: 'employe@levelstudio.fr', pwd: 'emp123' },
              { role: 'Client', email: 'client@test.fr', pwd: 'client123' },
            ].map(a => (
              <button key={a.role} onClick={() => { setEmail(a.email); setPassword(a.pwd) }}
                className="border text-zinc-400 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                <div className="font-medium">{a.role}</div>
                <div className="text-zinc-500 truncate">{a.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── FAQ ITEM ─────────────────────────────────────────────── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${open ? 'rgba(232,23,93,0.25)' : '#1e1e1e'}`, background: '#111', transition: 'border-color 0.2s' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/3">
        <span className="text-white font-semibold text-sm">{q}</span>
        <ChevronDown size={16} style={{ color: open ? '#e8175d' : '#555', flexShrink: 0, marginLeft: '16px', transition: 'transform 0.3s, color 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && <div className="px-5 pb-5" style={{ color: '#666', fontSize: '13px', lineHeight: 1.7 }}>{a}</div>}
    </div>
  )
}

/* ─── MAIN COMPONENT ──────────────────────────────────────── */
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [slideIndex, setSlideIndex] = useState(0)

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
  const G = {
    backgroundImage: 'linear-gradient(90deg, #ff9a3c, #e8175d, #c879ff, #38d9f5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontStyle: 'italic',
    fontWeight: 900,
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}

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
            border:       scrolled ? '1px solid rgba(232,23,93,0.25)' : undefined,
            borderRadius: scrolled ? '999px' : '0px',
            boxShadow:    scrolled ? '0 8px 40px rgba(0,0,0,0.8)' : 'none',
            transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{
              height:       scrolled ? '60px' : '78px',
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
                src="/logo-brand.jpg"
                alt="Level Studios"
                className="object-contain rounded-lg"
                style={{
                  height: scrolled ? '36px' : '44px',
                  width:  scrolled ? '36px' : '44px',
                  mixBlendMode: 'screen',
                  filter: 'drop-shadow(0 0 8px rgba(232,23,93,0.5))',
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
                  className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                  Connexion
                </button>
              )}
              <button
                onClick={user ? handleDashboard : () => navigate(createPageUrl('Reservation'))}
                className="font-semibold text-white text-sm transition-all hover:opacity-85"
                style={{
                  background: 'linear-gradient(135deg, #e8175d, #ff4d8d)',
                  borderRadius: '999px',
                  padding: '10px 28px',
                  boxShadow: '0 4px 20px rgba(232,23,93,0.4)',
                }}
              >
                {user ? 'Mon espace' : 'Réserver'}
              </button>
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
            style={{ background: '#111', borderColor: 'rgba(232,23,93,0.2)' }}>
            {[['#studios','Studios'],['#tarifs','Services'],['#materiel','Matériel'],['#avis','Avis']].map(([href, label]) => (
              <a key={href} href={href} className="block text-zinc-300 py-2 text-sm font-medium" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <button onClick={() => { setMenuOpen(false); setLoginOpen(true) }} className="block w-full text-left text-zinc-400 py-2 text-sm">Connexion</button>
            <button
              onClick={() => { setMenuOpen(false); navigate(createPageUrl('Reservation')) }}
              className="block w-full text-white font-bold rounded-xl py-3 text-center text-sm"
              style={{ background: 'linear-gradient(135deg, #e8175d, #ff4d8d)' }}
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
      `}</style>

      <section style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

        {/* Glow de fond */}
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(232,23,93,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Contenu centré */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 60px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>

          {/* Badge */}
          <div className="fade-up-1 inline-flex items-center gap-2 rounded-full mb-8"
            style={{ background: 'rgba(232,23,93,0.1)', border: '1px solid rgba(232,23,93,0.3)', color: '#e8175d', padding: '8px 18px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e8175d', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Studios disponibles maintenant
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
                style={{ borderRadius: '999px', border: 'none', cursor: 'pointer', transition: 'all 0.3s', width: i === slideIndex ? '24px' : '6px', height: '6px', background: i === slideIndex ? '#e8175d' : 'rgba(255,255,255,0.3)' }}
              />
            ))}
          </div>
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
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e8175d', marginBottom: '16px' }}>Nos Studios</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', margin: 0 }}>
                À votre <span style={G}>image.</span><br />
                <span style={{ fontStyle: 'italic', color: '#333' }}>Vos studios.</span>
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
                <div className="studio-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(232,23,93,0.07)', opacity: 0, transition: 'opacity 0.3s' }} />

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

          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e8175d', marginBottom: '16px' }}>Nos Services</p>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '16px' }}>
              Le point commun entre<br />
              <span style={G}>Beyoncé</span>{' '}
              <span style={{ fontStyle: 'italic', color: '#333' }}>et vous ?</span>
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#555' }}>C'est vous ! — Choisissez votre formule.</p>
          </div>

          {/* 3-column pricing cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', alignItems: 'stretch' }}>

            {/* ── ARGENT ── */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', background: '#f0f0f0', borderRadius: '999px', padding: '4px 14px', marginBottom: '16px' }}>Argent</span>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>La référence pour vos productions.</p>
              </div>

              <button onClick={() => navigate(createPageUrl('Reservation'))}
                style={{ width: '100%', border: '1.5px solid rgba(232,23,93,0.35)', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#e8175d', background: 'rgba(232,23,93,0.04)', cursor: 'pointer', marginBottom: '28px', transition: 'all 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,23,93,0.09)'; e.currentTarget.style.borderColor = '#e8175d' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(232,23,93,0.04)'; e.currentTarget.style.borderColor = 'rgba(232,23,93,0.35)' }}
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
                    { text: 'Introduction dynamique', ok: false },
                    { text: 'Motion design', ok: false },
                  ]},
                  { label: 'Livraison', items: [
                    { text: 'Fichiers bruts livrés sous 24h', ok: true },
                    { text: 'Export WAV qualité studio', ok: true },
                    { text: 'Sauvegarde 14 jours', ok: true },
                    { text: 'Montage finalisé', ok: false },
                  ]},
                ].map(group => (
                  <div key={group.label}>
                    <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ccc', marginBottom: '10px' }}>{group.label}</p>
                    {group.items.map(item => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '8px' }}>
                        {item.ok
                          ? <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(232,23,93,0.1)', border: '1px solid rgba(232,23,93,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                              <Check size={9} style={{ color: '#e8175d' }} />
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

            {/* ── GOLD (featured) ── */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 8px 60px rgba(232,23,93,0.18)', border: '1.5px solid rgba(232,23,93,0.25)' }}>
              {/* Rainbow badge */}
              <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', borderRadius: '0 0 14px 14px', padding: '7px 22px', fontSize: '10px', fontWeight: 800, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                background: 'linear-gradient(90deg, #ff0040, #ff6a00, #ffe000, #00e676, #00b0ff, #7c4dff, #e91e63, #ff4d8d, #ff0040)',
                backgroundSize: '400% 100%', animation: 'rainbow-drift 15s linear infinite' }}>
                ✦ Recommandé
              </div>

              <div style={{ marginBottom: '24px', marginTop: '20px' }}>
                <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8175d', background: 'rgba(232,23,93,0.08)', borderRadius: '999px', padding: '4px 14px', marginBottom: '16px', border: '1px solid rgba(232,23,93,0.2)' }}>Gold</span>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>Comme une star à Hollywood.</p>
              </div>

              <button onClick={() => navigate(createPageUrl('Reservation'))}
                style={{ width: '100%', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#e8175d,#ff4d8d)', border: 'none', cursor: 'pointer', marginBottom: '28px', transition: 'opacity 0.2s', textAlign: 'left', boxShadow: '0 4px 20px rgba(232,23,93,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
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
                    { text: 'Introduction dynamique' },
                    { text: 'Motion design' },
                  ]},
                  { label: 'Livraison', items: [
                    { text: 'Fichiers bruts livrés sous 24h' },
                    { text: 'Export WAV qualité studio' },
                    { text: 'Sauvegarde 14 jours' },
                    { text: 'Montage finalisé + 1 révision' },
                  ]},
                ].map(group => (
                  <div key={group.label}>
                    <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(232,23,93,0.4)', marginBottom: '10px' }}>{group.label}</p>
                    {group.items.map(item => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '8px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(232,23,93,0.1)', border: '1px solid rgba(232,23,93,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                          <Check size={9} style={{ color: '#e8175d' }} />
                        </span>
                        <span style={{ fontSize: '12.5px', color: '#222', lineHeight: 1.5 }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* ── SUR-MESURE ── */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', background: '#f0f0f0', borderRadius: '999px', padding: '4px 14px', marginBottom: '16px' }}>Sur-Mesure</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.03em', lineHeight: 1 }}>Sur devis</span>
                </div>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>Un projet unique, une production unique.</p>
              </div>

              <button onClick={() => navigate(createPageUrl('Reservation'))}
                style={{ width: '100%', border: '1.5px solid rgba(232,23,93,0.35)', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#e8175d', background: 'rgba(232,23,93,0.04)', cursor: 'pointer', marginBottom: '28px', transition: 'all 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,23,93,0.09)'; e.currentTarget.style.borderColor = '#e8175d' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(232,23,93,0.04)'; e.currentTarget.style.borderColor = 'rgba(232,23,93,0.35)' }}
              >
                Construire mon projet sur-mesure →
              </button>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {[
                  { label: 'Création et univers visuel', items: [
                    { text: 'Direction artistique personnalisée' },
                    { text: 'Scénographie et décor sur mesure' },
                    { text: 'Identité visuelle et branding' },
                  ]},
                  { label: 'Tournage et réalisation', items: [
                    { text: 'Équipe de tournage dédiée' },
                    { text: 'Réalisation multi-caméras 4K' },
                    { text: 'Son et lumière professionnels' },
                    { text: 'Drone et prises de vues créatives' },
                  ]},
                  { label: 'Accompagnement', items: [
                    { text: 'Community manager inclus' },
                    { text: 'Coaching prise de parole' },
                    { text: 'Suivi post-production complet' },
                  ]},
                ].map(group => (
                  <div key={group.label}>
                    <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ccc', marginBottom: '10px' }}>{group.label}</p>
                    {group.items.map(item => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '8px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(232,23,93,0.1)', border: '1px solid rgba(232,23,93,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                          <Check size={9} style={{ color: '#e8175d' }} />
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
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '28px 32px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Zap size={15} style={{ color: '#e8175d' }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Options supplémentaires</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
              {[
                { label: 'Contenu', items: ['Photo', 'Short vidéo', 'Miniature'] },
                { label: 'Live', items: ['Live stream', 'Briefing live', 'Replay'] },
                { label: 'Accompagnement', items: ['Community manager', 'Coaching'] },
              ].map(g => (
                <div key={g.label}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: '10px' }}>{g.label}</p>
                  {g.items.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#e8175d', flexShrink: 0 }} />
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
          <div style={{ marginBottom: '56px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e8175d', marginBottom: '16px' }}>Équipement</p>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              Comme une <span style={G}>star</span><br />
              <span style={{ fontStyle: 'italic', color: '#333' }}>à Hollywood.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {equipment.map((item, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,23,93,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
              >
                <div style={{ aspectRatio: '16/7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#0d0d0d' }}>
                  <item.icon size={36} style={{ color: '#e8175d', opacity: 0.5 }} />
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.15em', color: '#fff', opacity: 0.1 }}>{item.brand}</span>
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>{item.name}</h3>
                  <p style={{ color: '#555', fontSize: '13px', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {[
              { icon: Shield, title: 'Studio acoustique', desc: 'Isolation phonique professionnelle.' },
              { icon: Zap, title: 'Livraison 24h', desc: 'Fichiers montés dans les 24h suivant la session.' },
              { icon: Award, title: 'Opérateur dédié', desc: 'Un expert présent à chaque session.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(232,23,93,0.1)', border: '1px solid rgba(232,23,93,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: '#e8175d' }} />
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
          <div style={{ marginBottom: '60px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e8175d', marginBottom: '16px' }}>Témoignages clients</p>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              Ils ont <span style={G}>choisi</span><br />
              <span style={{ fontStyle: 'italic', color: '#333' }}>Level Studios.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,23,93,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
              >
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} size={14} style={{ fill: '#e8175d', color: '#e8175d' }} />
                  ))}
                </div>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.7, flex: 1 }}>"{r.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#e8175d,#ff4d8d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e8175d', marginBottom: '16px' }}>FAQ</p>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>Vos questions.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 100px', background: '#0d0d0d' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ position: 'relative', borderRadius: '24px', padding: 'clamp(48px,6vw,80px) 40px', textAlign: 'center', overflow: 'hidden', border: '1px solid rgba(232,23,93,0.2)', background: 'linear-gradient(135deg, rgba(232,23,93,0.08) 0%, rgba(8,8,8,0.95) 60%)' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(232,23,93,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e8175d', marginBottom: '20px' }}>Prêt à tourner ?</p>
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
                style={{ background: 'linear-gradient(135deg,#e8175d,#ff4d8d)', borderRadius: '999px', padding: '18px 48px', fontSize: '16px', boxShadow: '0 10px 40px rgba(232,23,93,0.4)', border: 'none', cursor: 'pointer' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpg" style={{ height: '28px', width: '28px', objectFit: 'contain', borderRadius: '6px' }} alt="Level Studios" />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px' }}>Level Studios</span>
          </div>
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
