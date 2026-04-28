import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Play, ArrowRight,
  Camera, Mic, Film, Package, Star, Check,
  Headphones, Clock, Zap, ChevronDown, Menu, X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const GOLD = '#F5C518'
const DARK = '#06060A'
const NAVY = '#0A0E1A'

// ── Horizontal scroll row ─────────────────────────────────────────────────────
function ScrollRow({ title, link, linkLabel, children }) {
  const ref = useRef(null)
  const scroll = dir => ref.current?.scrollBy({ left: dir * 600, behavior: 'smooth' })
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h2>
        {link && (
          <a href={link} style={{ fontSize: 13, fontWeight: 600, color: GOLD, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            {linkLabel || 'Voir tout'} <ArrowRight size={13} />
          </a>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <button onClick={() => scroll(-1)} style={{
          position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)',
          zIndex: 2, width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(20,20,28,0.9)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          <ChevronLeft size={16} />
        </button>
        <div ref={ref} style={{
          display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 4,
        }}>
          {children}
        </div>
        <button onClick={() => scroll(1)} style={{
          position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)',
          zIndex: 2, width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(20,20,28,0.9)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  )
}

// ── Studio card ───────────────────────────────────────────────────────────────
function StudioCard({ name, subtitle, img, badge }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 280, borderRadius: 8, overflow: 'hidden',
        position: 'relative', cursor: 'pointer', scrollSnapAlign: 'start',
        transform: hov ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.25s ease',
        boxShadow: hov ? '0 12px 32px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <img src={img} alt={name} style={{ width: '100%', height: 168, objectFit: 'cover', display: 'block' }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
      }} />
      {badge && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: GOLD, color: '#000', fontSize: 10, fontWeight: 800,
          padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em',
        }}>
          {badge}
        </span>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{subtitle}</div>
        {hov && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, background: GOLD, color: '#000',
              padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
            }}>
              Réserver
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Pack card ─────────────────────────────────────────────────────────────────
function PackCard({ label, price, description, features, accent, highlight }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 260, borderRadius: 10,
        border: `1.5px solid ${hov || highlight ? accent : 'rgba(255,255,255,0.08)'}`,
        background: highlight ? `rgba(${accent === GOLD ? '245,197,24' : '255,255,255'},0.04)` : 'rgba(255,255,255,0.03)',
        padding: '20px 18px', scrollSnapAlign: 'start', cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.2s',
        transform: hov ? 'translateY(-4px)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {highlight && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: accent,
        }} />
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.1em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
        {price}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}> CAD/h</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.4 }}>
        {description}
      </div>
      {features.map(f => (
        <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 8 }}>
          <Check size={13} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{f}</span>
        </div>
      ))}
    </div>
  )
}

// ── Service chip ──────────────────────────────────────────────────────────────
function ServiceCard({ icon: Icon, label, price }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 160, borderRadius: 10, padding: '18px 16px',
        border: `1.5px solid ${hov ? 'rgba(245,197,24,0.3)' : 'rgba(255,255,255,0.07)'}`,
        background: hov ? 'rgba(245,197,24,0.05)' : 'rgba(255,255,255,0.02)',
        cursor: 'pointer', scrollSnapAlign: 'start',
        transition: 'all 0.2s',
        transform: hov ? 'translateY(-3px)' : 'none',
      }}
    >
      <Icon size={22} style={{ color: GOLD, marginBottom: 10 }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{price}</div>
    </div>
  )
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '18px 0',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', textAlign: 'left' }}>{q}</span>
        <ChevronDown size={18} style={{
          color: GOLD, flexShrink: 0, marginLeft: 16,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }} />
      </button>
      {open && (
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 12, lineHeight: 1.65, marginBottom: 0 }}>
          {a}
        </p>
      )}
    </div>
  )
}

export default function HomeNeo() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const STUDIOS = [
    { name: 'Studio A', subtitle: 'Podcast & Entretiens — jusqu\'à 4 micros', img: '/studios/studio-a.jpg', badge: 'DISPONIBLE' },
    { name: 'Studio B', subtitle: 'Production vidéo — éclairage Godox SL300', img: '/studios/studio-b.jpg' },
    { name: 'Studio C', subtitle: 'Post-production & Montage avancé', img: '/studios/studio-c.png', badge: 'POPULAIRE' },
  ]

  const PACKS = [
    {
      label: 'BRONZE', price: 149,
      description: 'Enregistrement clé en main, équipement inclus, livraison 24h.',
      accent: '#cd7f32',
      features: ['Opérateur dédié', '3 caméras Sony FX30 4K', '4 micros Shure SM7B', 'Export WAV + vidéo brute'],
    },
    {
      label: 'ARGENT', price: 199, highlight: true,
      description: 'Bronze + post-production complète, synchronisation multicaméra.',
      accent: '#C0C0C0',
      features: ['Tout du Bronze', 'Pré-montage inclus', 'Suppression silences', 'Sauvegarde 14 jours'],
    },
    {
      label: 'OR', price: 499,
      description: 'Prestation premium avec motion design, sound design & révision.',
      accent: GOLD,
      features: ['Tout de l\'Argent', 'Motion design', 'Sound design', '1 révision incluse', 'Sauvegarde 2 mois'],
    },
  ]

  const SERVICES = [
    { icon: Camera,     label: 'Photo',           price: '44 CAD' },
    { icon: Film,       label: 'Short vidéo',      price: '44 CAD' },
    { icon: Star,       label: 'Miniature',        price: '44 CAD' },
    { icon: Zap,        label: 'Live stream',       price: '662 CAD' },
    { icon: Package,    label: 'Replay',           price: '74 CAD' },
    { icon: Mic,        label: 'Coaching',         price: '588 CAD' },
    { icon: Headphones, label: 'Comm. Manager',    price: '147 CAD' },
  ]

  const FAQ = [
    { q: 'Comment se déroule une session d\'enregistrement ?', a: 'Vous arrivez au studio, notre opérateur vous accueille et configure l\'ensemble du plateau selon vos besoins. La session débute dès que vous êtes prêt. Les fichiers vous sont envoyés sous 24h après la fin de session.' },
    { q: 'Puis-je annuler ou reprogrammer ma réservation ?', a: 'Oui. Toute annulation effectuée plus de 48h avant la session est intégralement remboursée. Entre 24h et 48h, 50% sont retenus. Moins de 24h avant, la session est due en totalité.' },
    { q: 'Quels formats de fichiers livrez-vous ?', a: 'Vidéo en MP4 (H.264/H.265), audio en WAV 48kHz 24bit et MP3 320kbps selon la formule. Sur demande, nous pouvons exporter dans d\'autres formats standard.' },
    { q: 'Proposez-vous des packs d\'heures ?', a: 'Oui, des packs de 4h, 10h et 20h sont disponibles avec des remises allant de 10% à 20%. Idéal pour les créateurs réguliers.' },
    { q: 'Est-il possible de visiter le studio avant de réserver ?', a: 'Absolument. Contactez-nous pour planifier une visite. Nous sommes disponibles du lundi au vendredi de 9h à 18h.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: DARK, color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 60,
        background: scrolled ? 'rgba(6,6,10,0.97)' : 'linear-gradient(to bottom, rgba(6,6,10,0.9) 0%, transparent)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s',
        display: 'flex', alignItems: 'center', padding: '0 5%', gap: 32,
      }}>
        {/* Logo */}
        <div onClick={() => navigate('/neo')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
          <img src="/logo.png" alt="Level" style={{ height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontWeight: 900, fontSize: 15, color: '#fff', letterSpacing: '-0.01em' }}>Level Studios</span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          {[
            { label: 'Studios', href: '#studios' },
            { label: 'Formules', href: '#formules' },
            { label: 'Services', href: '#services' },
            { label: 'FAQ', href: '#faq' },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{
              padding: '5px 12px', fontSize: 13, fontWeight: 500,
              color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
              borderRadius: 6, transition: 'color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right CTA */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <button onClick={() => navigate('/clienttest/dashboard')} style={{
              padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700,
              background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
            }}>
              Mon espace
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/clienttest')} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                background: 'transparent', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
              }}>
                Se connecter
              </button>
              <button onClick={() => navigate('/reservation')} style={{
                padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700,
                background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
              }}>
                Réserver
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', height: '88vh', minHeight: 520,
        display: 'flex', alignItems: 'center',
        overflow: 'hidden',
      }}>
        <img
          src="/studios/studio-a.jpg"
          alt="Studio A"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', filter: 'brightness(0.35)',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(6,6,10,0.92) 0%, rgba(6,6,10,0.4) 60%, transparent 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 5%', maxWidth: 680 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `rgba(245,197,24,0.12)`, border: `1px solid rgba(245,197,24,0.3)`,
            borderRadius: 20, padding: '4px 12px', marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.08em' }}>STUDIOS DISPONIBLES</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.08,
            margin: '0 0 20px', color: '#fff', letterSpacing: '-0.02em',
          }}>
            Votre studio<br /><span style={{ color: GOLD }}>professionnel</span><br />à Montréal
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 32, maxWidth: 520 }}>
            Studios podcast, vidéo et post-production entièrement équipés. Opérateur dédié, livraison sous 24h.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/reservation')} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 800,
              background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
              boxShadow: `0 8px 24px rgba(245,197,24,0.35)`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(245,197,24,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,197,24,0.35)' }}
            >
              Réserver un studio
            </button>
            <button onClick={() => { document.getElementById('studios')?.scrollIntoView({ behavior: 'smooth' }) }} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600,
              background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}>
              <Play size={16} fill="#fff" /> Découvrir les studios
            </button>
          </div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
            {[
              { value: '3', label: 'Studios équipés' },
              { value: '24h', label: 'Délai de livraison' },
              { value: '4K', label: 'Qualité vidéo' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>{value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '56px 5%' }}>

        {/* Studios row */}
        <div id="studios">
          <ScrollRow title="Nos studios" link="/reservation" linkLabel="Réserver maintenant">
            {STUDIOS.map(s => (
              <StudioCard key={s.name} {...s} />
            ))}
            {/* Extra info card */}
            <div style={{
              flexShrink: 0, width: 280, borderRadius: 8,
              background: 'rgba(245,197,24,0.06)', border: `1.5px solid rgba(245,197,24,0.18)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '24px 20px', cursor: 'pointer', scrollSnapAlign: 'start',
            }}
              onClick={() => navigate('/contact')}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎙</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Besoin d'un studio sur mesure ?</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.5 }}>Contactez-nous pour adapter un espace à votre projet.</div>
              <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: GOLD, display: 'flex', alignItems: 'center', gap: 4 }}>
                Nous contacter <ArrowRight size={12} />
              </div>
            </div>
          </ScrollRow>
        </div>

        {/* Formules row */}
        <div id="formules">
          <ScrollRow title="Nos formules">
            {PACKS.map(p => <PackCard key={p.label} {...p} />)}
            {/* Pack hours promo */}
            <div style={{
              flexShrink: 0, width: 260, borderRadius: 10,
              background: `linear-gradient(135deg, rgba(245,197,24,0.12) 0%, rgba(245,197,24,0.04) 100%)`,
              border: `1.5px solid rgba(245,197,24,0.25)`,
              padding: '20px 18px', scrollSnapAlign: 'start',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', marginBottom: 10 }}>PACKS D'HEURES</div>
              {[
                { h: '4h', disc: '-10%' }, { h: '10h', disc: '-15%' }, { h: '20h', disc: '-20%' },
              ].map(({ h, disc }) => (
                <div key={h} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{h}</span>
                  <span style={{ fontSize: 12, color: GOLD, fontWeight: 700, background: 'rgba(245,197,24,0.12)', padding: '2px 8px', borderRadius: 4 }}>{disc}</span>
                </div>
              ))}
              <button onClick={() => navigate('/clienttest/subscription')} style={{
                marginTop: 16, padding: '9px 0', borderRadius: 6, fontSize: 12, fontWeight: 700,
                background: GOLD, color: '#000', border: 'none', cursor: 'pointer',
              }}>
                Acheter un pack
              </button>
            </div>
          </ScrollRow>
        </div>

        {/* Yellow promo banner */}
        <section style={{
          background: GOLD,
          borderRadius: 12,
          padding: '36px 40px',
          marginBottom: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#000', marginBottom: 6 }}>
              Prolongez votre expérience Level Studios avec un pack d'heures
            </div>
            <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>
              Jusqu'à 20% de remise sur vos sessions. Valables sur toutes nos formules.
            </div>
          </div>
          <button onClick={() => navigate('/reservation')} style={{
            padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 800,
            background: '#000', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Réserver maintenant →
          </button>
        </section>

        {/* Services row */}
        <div id="services">
          <ScrollRow title="Options & services complémentaires">
            {SERVICES.map(s => <ServiceCard key={s.label} {...s} />)}
          </ScrollRow>
        </div>

        {/* Équipement highlight */}
        <section style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '40px', marginBottom: 48,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', marginBottom: 12 }}>ÉQUIPEMENT INCLUS</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 16px', lineHeight: 1.2 }}>
              Tout le matériel dont vous avez besoin
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
              Chaque studio est équipé avec du matériel professionnel haut de gamme, prêt à l'emploi dès votre arrivée. Aucun équipement à apporter.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: Camera, label: '3× Sony FX30 4K' },
              { icon: Mic,    label: '4× Shure SM7B' },
              { icon: Zap,    label: 'Godox SL300III-K2' },
              { icon: Clock,  label: 'Livraison sous 24h' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <Icon size={16} style={{ color: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ maxWidth: 720, margin: '0 auto 64px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', marginBottom: 10 }}>FAQ</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>Vous avez une question ?</h2>
          </div>
          {FAQ.map(item => <FaqItem key={item.q} {...item} />)}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button onClick={() => navigate('/contact')} style={{
              padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
              background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
            }}>
              Accéder au centre d'aide →
            </button>
          </div>
        </section>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.01)',
        padding: '48px 5% 32px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <img src="/logo.png" alt="Level" style={{ height: 26, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>Level Studios</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              Studios de production audiovisuelle professionnels à Montréal.
            </p>
          </div>
          {[
            { title: 'Studios', items: ['Studio A — Podcast', 'Studio B — Vidéo', 'Studio C — Post-prod', 'Tous les studios'] },
            { title: 'Formules', items: ['Bronze — 149 CAD/h', 'Argent — 199 CAD/h', 'Or — 499 CAD/h', 'Packs d\'heures'] },
            { title: 'À propos', items: ['Contact', 'Conditions générales', 'Politique de confidentialité', 'Plan du site'] },
          ].map(({ title, items }) => (
            <div key={title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{title}</div>
              {items.map(item => (
                <div key={item} style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginBottom: 8, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.38)'}
                >
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
            © {new Date().getFullYear()} Level Studios inc. Tous droits réservés.
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {['FR', 'EN'].map(lang => (
              <button key={lang} style={{
                fontSize: 11, fontWeight: 700, color: lang === 'FR' ? GOLD : 'rgba(255,255,255,0.35)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                {lang}
              </button>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }
        ::-webkit-scrollbar { display: none }
      `}</style>
    </div>
  )
}
