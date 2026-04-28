import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, UserPlus, Tag, Megaphone, Calendar, FolderOpen,
  Film, Receipt, DollarSign, HeadphonesIcon, Clock, BarChart3,
  Star, Bell,
} from 'lucide-react'

// Items fixes = boutons "Accès Rapide" du dashboard
const ITEMS = [
  { label:'+ Réservation',   icon:<Plus />,             color:'#22d3ee', path:'/admin/reservations', state:{ openCreate: true } },
  { label:'+ Compte',        icon:<UserPlus />,          color:'#60a5fa', path:'/admin/accounts',     state:{ openModal: 'choice' } },
  { label:'+ Code promo',    icon:<Tag />,               color:'#22c55e', path:'/admin/promo',         state:{ openAdd: true } },
  { label:'+ Communication', icon:<Megaphone />,         color:'#fb923c', path:'/admin/communication', state:{ openAdd: true } },
  { label:'Calendrier',      icon:<Calendar />,          color:'#a78bfa', path:'/admin/calendar' },
  { label:'Kanban',          icon:<FolderOpen />,        color:'#818cf8', path:'/admin/projects' },
  { label:'Rushes',          icon:<Film />,              color:'#f472b6', path:'/admin/rushes' },
  { label:'Facturation',     icon:<Receipt />,           color:'#34d399', path:'/admin/recette' },
  { label:'Tarifs',          icon:<DollarSign />,        color:'#fbbf24', path:'/admin/pricing' },
  { label:'SAV',             icon:<HeadphonesIcon />,    color:'#ef4444', path:'/admin/sav' },
  { label:'Pointage',        icon:<Clock />,             color:'#2dd4bf', path:'/admin/check' },
  { label:'Performances',    icon:<BarChart3 />,         color:'#f59e0b', path:'/admin/perf' },
  { label:'Satisfaction',    icon:<Star />,              color:'#fb7185', path:'/admin/satisfaction' },
  { label:'Alertes',         icon:<Bell />,              color:'#a1a1aa', path:'/admin/alerts' },
]

export default function Dock({ isDark }) {
  const navigate = useNavigate()
  const [hov, setHov] = useState(null)

  const glass = isDark
    ? { background:'rgba(5,5,8,0.88)', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 -1px 0 rgba(255,255,255,0.04) inset, 0 12px 48px rgba(0,0,0,0.75)' }
    : { background:'rgba(255,255,255,0.93)', border:'1px solid rgba(0,0,0,0.10)', boxShadow:'0 -1px 0 rgba(255,255,255,0.9) inset, 0 12px 40px rgba(0,0,0,0.12)' }

  return (
    <>
      <style>{`
        @keyframes dock-up{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes tip-in{from{opacity:0;transform:translateX(-50%) translateY(4px) scale(0.93)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
      `}</style>
      <div style={{
        position:'fixed', bottom:'14px', left:'50%', transform:'translateX(-50%)',
        zIndex:35, display:'flex', alignItems:'center', gap:'4px', padding:'7px 9px',
        borderRadius:'18px', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
        maxWidth:'calc(100vw - 24px)', overflowX:'auto', scrollbarWidth:'none',
        animation:'dock-up 0.42s cubic-bezier(0.34,1.56,0.64,1) both',
        ...glass,
      }}>
        {ITEMS.map((item, i) => {
          const isHov = hov === i
          const tileBg = isHov ? `${item.color}22` : `${item.color}14`
          const shadow = isHov
            ? `0 6px 22px ${item.color}70, inset 0 1px 0 rgba(255,255,255,0.12)`
            : isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.07)'

          return (
            <div key={i} style={{ position:'relative', flexShrink:0 }}>
              {/* Tooltip */}
              {isHov && (
                <div style={{
                  position:'absolute', bottom:'54px', left:'50%',
                  transform:'translateX(-50%)', whiteSpace:'nowrap',
                  padding:'5px 11px', borderRadius:'9px',
                  fontSize:'11px', fontWeight:600,
                  fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
                  letterSpacing:'0.01em',
                  background:'rgba(10,10,16,0.96)', color:'#ffffff',
                  border:'1px solid rgba(255,255,255,0.1)',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                  pointerEvents:'none', zIndex:300,
                  boxShadow:'0 6px 20px rgba(0,0,0,0.45)',
                  animation:'tip-in 0.14s ease both',
                }}>
                  {item.label}
                  <span style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', display:'block', width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'5px solid rgba(10,10,16,0.96)' }} />
                </div>
              )}
              {/* Tile */}
              <button
                onClick={() => navigate(item.path, item.state ? { state: item.state } : undefined)}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{
                  width:'42px', height:'42px', borderRadius:'11px',
                  border:`1.5px solid ${isHov ? `${item.color}35` : 'rgba(255,255,255,0)'}`,
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  transform: isHov ? 'scale(1.20) translateY(-5px)' : 'scale(1)',
                  background: tileBg,
                  color: item.color,
                  boxShadow: shadow,
                  outline:'none', padding:0,
                }}
              >
                {React.cloneElement(item.icon, { width:18, height:18, strokeWidth: isHov ? 2.2 : 1.8 })}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
