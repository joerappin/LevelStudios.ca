import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, ChevronDown, Bot, Phone, Mail, User } from 'lucide-react'
import { Store } from '../data/store'

const FORMULAS = [
  { id: 'BRONZE', label: '🥉 BRONZE', desc: 'Enregistrement clé en main' },
  { id: 'ARGENT', label: '🎙️ ARGENT', desc: 'Bronze + post-production incluse' },
  { id: 'GOLD',   label: '🥇 OR',     desc: 'Premium — accompagnement renforcé' },
]

const WELCOME_MSG = {
  from: 'bot',
  body: 'Bonjour ! 👋 Bienvenue chez **Level Studios**. Je suis votre agent d\'accueil.\n\nNous proposons 3 formules de studio d\'enregistrement professionnel. Quelle formule vous intéresse, ou avez-vous une question ?',
}

function BotText({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
      {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-white">{p}</strong> : p)}
    </p>
  )
}

export default function VisitorChatBot() {
  const [open,     setOpen]     = useState(false)
  const [step,     setStep]     = useState(0)   // 0=welcome 1=collect 2=confirm
  const [msgs,     setMsgs]     = useState([WELCOME_MSG])
  const [formula,  setFormula]  = useState(null)
  const [input,    setInput]    = useState('')
  const [form,     setForm]     = useState({ name: '', email: '', phone: '' })
  const [formErr,  setFormErr]  = useState({})
  const [sending,  setSending]  = useState(false)
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    if (open && step === 0) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  function addMsg(msg) {
    setMsgs(prev => [...prev, { ...msg, created_at: new Date().toISOString() }])
  }

  function addBotDelay(text, delay = 700) {
    setTimeout(() => addMsg({ from: 'bot', body: text }), delay)
  }

  function handleFormulaClick(f) {
    setFormula(f)
    addMsg({ from: 'visitor', body: `Je suis intéressé par la formule ${f.label}` })
    setTimeout(() => {
      addMsg({ from: 'bot', body: `Excellent choix ! 🎬 La formule **${f.label}** inclut : ${f.desc}.\n\nPour vous recontacter rapidement, j'ai besoin de quelques informations 👇` })
      setStep(1)
    }, 700)
  }

  function handleFreeQuestion() {
    const body = input.trim()
    if (!body) return
    addMsg({ from: 'visitor', body })
    setInput('')
    addBotDelay('Merci pour votre question ! Pour pouvoir vous répondre personnellement, j\'ai besoin de quelques informations 👇')
    setTimeout(() => setStep(1), 900)
  }

  function validateForm() {
    const err = {}
    if (!form.name.trim())  err.name  = 'Requis'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) err.email = 'Email invalide'
    if (!form.phone.trim()) err.phone = 'Requis'
    setFormErr(err)
    return Object.keys(err).length === 0
  }

  function submitLead() {
    if (!validateForm()) return
    setSending(true)
    setTimeout(() => {
      Store.addLead({
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim(),
        formula: formula?.id || null,
        message: `[VISITOR_INFO: ${form.name.trim()}|${form.email.trim()}|${form.phone.trim()}] Formule: ${formula?.label || 'Non précisée'}`,
        subject: `Lead visiteur — ${form.name.trim()}`,
        column:  'Pool Leads',
      })
      addMsg({ from: 'visitor', body: `Nom: ${form.name}\nEmail: ${form.email}\nTél: ${form.phone}` })
      addBotDelay(`Merci **${form.name}** ! 🎬\n\nVos informations ont bien été transmises à notre équipe. Un conseiller Level Studios vous contactera très prochainement.\n\nÀ très bientôt !`, 800)
      setSending(false)
      setStep(2)
    }, 400)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-3">

      {open && (
        <div className="w-80 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/60 flex flex-col"
          style={{ height: 520, background: '#18181b' }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0f172a]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Agent d'accueil</p>
              <p className="text-[10px] text-white/50 mt-0.5">Level Studios — en ligne</p>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {msgs.map((msg, i) => {
              const isBot = msg.from === 'bot'
              return (
                <div key={i} className={`flex items-start gap-2 ${!isBot ? 'flex-row-reverse' : ''}`}>
                  {isBot && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 ${!isBot ? 'flex flex-col items-end' : ''}`}>
                    <div className={`rounded-xl px-3 py-2 max-w-[88%] inline-block ${
                      isBot ? 'bg-zinc-800 rounded-tl-sm' : 'bg-blue-700 rounded-tr-sm'
                    }`}>
                      {isBot
                        ? <BotText text={msg.body} />
                        : <p className="text-xs text-white leading-relaxed whitespace-pre-line">{msg.body}</p>
                      }
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Formulas (step 0) */}
            {step === 0 && (
              <div className="space-y-1.5 pl-8">
                {FORMULAS.map(f => (
                  <button key={f.id} onClick={() => handleFormulaClick(f)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 hover:border-blue-500/50 transition-colors group">
                    <span className="text-xs font-semibold text-white group-hover:text-blue-300">{f.label}</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Lead form (step 1) */}
            {step === 1 && (
              <div className="pl-8 space-y-2">
                {[
                  { key: 'name',  label: 'Votre nom',     icon: User,  type: 'text',  placeholder: 'Jean Dupont' },
                  { key: 'email', label: 'Votre email',   icon: Mail,  type: 'email', placeholder: 'jean@email.com' },
                  { key: 'phone', label: 'Votre téléphone', icon: Phone, type: 'tel',   placeholder: '+1 514 000 0000' },
                ].map(({ key, label, icon: Icon, type, placeholder }) => (
                  <div key={key}>
                    <div className={`flex items-center gap-2 bg-zinc-800 border rounded-xl px-3 py-2 ${
                      formErr[key] ? 'border-red-500/60' : 'border-zinc-700/60 focus-within:border-blue-500/60'
                    }`}>
                      <Icon className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={form[key]}
                        onChange={e => { setForm(prev => ({ ...prev, [key]: e.target.value })); setFormErr(prev => ({ ...prev, [key]: '' })) }}
                        className="flex-1 bg-transparent text-xs text-white placeholder-zinc-600 outline-none"
                      />
                    </div>
                    {formErr[key] && <p className="text-[10px] text-red-400 mt-0.5 ml-1">{formErr[key]}</p>}
                  </div>
                ))}
                <button onClick={submitLead} disabled={sending}
                  className="w-full py-2 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold transition-colors mt-1">
                  {sending ? 'Envoi…' : 'Transmettre mes informations →'}
                </button>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input libre (step 0 uniquement) */}
          {step === 0 && (
            <div className="flex-shrink-0 p-3 border-t border-zinc-800">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFreeQuestion() } }}
                  placeholder="Posez votre question…"
                  rows={2}
                  className="flex-1 bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <button onClick={handleFreeQuestion} disabled={!input.trim()}
                  className="w-8 h-8 flex items-center justify-center bg-blue-700 hover:bg-blue-600 disabled:opacity-30 rounded-xl transition-colors flex-shrink-0 mb-0.5">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-shrink-0 p-3 border-t border-zinc-800 text-center">
              <p className="text-[10px] text-zinc-500">Un conseiller vous contacte très prochainement ✅</p>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <div className="relative">
        {!open && <span className="absolute inset-0 rounded-full bg-blue-700 opacity-20 animate-ping" />}
        <button onClick={() => setOpen(v => !v)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-700/40"
          style={{ background: open ? '#3f3f46' : 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)' }}
          title="Parlez à notre agent d'accueil">
          {open ? <X className="w-5 h-5 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  )
}
