import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, ChevronDown, ChevronUp, Zap, Bot } from 'lucide-react'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'

// ─── FAQ bot : questions → réponses automatiques ──────────────────────────────
const FAQ = [
  {
    label: 'Mes fichiers',
    q: 'Où puis-je récupérer mes fichiers ?',
    a: 'Vos fichiers livrés sont disponibles dans votre espace client, rubrique **Bibliothèque**. Vous recevrez également un lien de téléchargement par email.',
  },
  {
    label: 'Délai livraison',
    q: 'Quel est le délai de livraison ?',
    a: 'Vos rushes vous sont livrés dans les **24h** suivant votre session d\'enregistrement. Pour la post-production complète, comptez 48 à 72h.',
  },
  {
    label: 'Modifier une résa',
    q: 'Comment modifier ma réservation ?',
    a: 'Vous pouvez modifier votre réservation **jusqu\'à 48h avant** la session. Envoyez-nous un message via ce chat et notre équipe vous recontactera rapidement.',
  },
  {
    label: 'Annuler une résa',
    q: 'Comment annuler ma réservation ?',
    a: 'Toute annulation doit être effectuée **au moins 48h avant** la session. Passé ce délai, la session sera facturée. Contactez-nous via ce chat pour toute demande.',
  },
  {
    label: 'Infos studio',
    q: 'Qu\'est-ce qui est inclus dans le studio ?',
    a: 'Nos studios incluent : **3 caméras Sony FX30 4K**, jusqu\'à 4 micros **Shure SM7B**, éclairage Godox, acoustique traitée et un opérateur dédié pendant toute la session.',
  },
  {
    label: 'Mon pack heures',
    q: 'Comment fonctionne mon pack d\'heures ?',
    a: 'Votre pack d\'heures est visible dans la rubrique **Abonnement** de votre espace. Les heures se déduisent automatiquement à chaque réservation validée.',
  },
  {
    label: 'Tarifs',
    q: 'Quels sont vos tarifs ?',
    a: 'Offre **Argent** : 221 CAD/h — Offre **Gold** : 587 CAD/h. Des packs d\'heures avec remises allant jusqu\'à -20% sont disponibles dans votre espace Abonnement.',
  },
  {
    label: 'Live stream',
    q: 'Proposez-vous le live stream ?',
    a: 'Oui ! L\'option **Live stream** est disponible à 662 CAD, avec un briefing obligatoire (118 CAD) et une option replay (74 CAD). Contactez-nous pour planifier.',
  },
]

function BotText({ text }) {
  // Rend **gras** en <strong>
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <p className="text-xs text-zinc-200 leading-relaxed">
      {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-white">{p}</strong> : p)}
    </p>
  )
}

const WELCOME = {
  from: 'bot',
  body: 'Bonjour ! 👋 Je suis l\'assistant Level Studios. Choisissez une question fréquente ou écrivez-nous directement — notre équipe vous répondra dans les plus brefs délais.',
  created_at: new Date().toISOString(),
}

export default function ClientChatBot() {
  const { user } = useAuth()
  const [open,      setOpen]      = useState(false)
  const [messages,  setMessages]  = useState([WELCOME])
  const [input,     setInput]     = useState('')
  const [showFaq,   setShowFaq]   = useState(true)
  const [sent,      setSent]      = useState(false) // message manuel envoyé
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  // Clic sur une question FAQ → ajoute la question + réponse bot
  function askFaq(item) {
    const clientMsg = { from: 'client', body: item.q, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, clientMsg])
    setShowFaq(false)
    // Délai court pour simuler la frappe du bot
    setTimeout(() => {
      const botMsg = { from: 'bot', body: item.a, created_at: new Date().toISOString() }
      setMessages(prev => [...prev, botMsg])
    }, 600)
  }

  // Envoi manuel → crée un ticket SAV réel
  function sendManual() {
    const body = input.trim()
    if (!body) return

    const clientMsg = { from: 'client', body, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, clientMsg])
    setInput('')
    setSent(true)

    // Enregistre dans le Store (visible côté admin)
    Store.addMessage({
      from_email:   user?.email,
      from_name:    user?.name,
      from_user_id: user?.id,
      subject:      body.slice(0, 60),
      body,
      status:       'open',
    })

    // Réponse automatique de confirmation
    setTimeout(() => {
      setMessages(prev => [...prev, {
        from: 'bot',
        body: 'Votre message a bien été transmis à notre équipe ✅ Nous vous répondrons dans les plus brefs délais. En attendant, n\'hésitez pas à consulter votre espace client.',
        created_at: new Date().toISOString(),
      }])
    }, 700)
  }

  if (user?.type !== 'client') return null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">

      {/* Panel */}
      {open && (
        <div
          className="w-80 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/60 flex flex-col"
          style={{ height: 480, background: '#18181b' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#1e3a8a]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Level Studios</p>
              <p className="text-[10px] text-white/60 mt-0.5">Support client — en ligne</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => {
              const isBot = msg.from === 'bot'
              return (
                <div key={i} className={`flex items-start gap-2 ${!isBot ? 'flex-row-reverse' : ''}`}>
                  {isBot && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {!isBot && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
                      {(user?.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className={`flex-1 ${!isBot ? 'flex flex-col items-end' : ''}`}>
                    <div className={`rounded-xl px-3 py-2 max-w-[88%] inline-block ${
                      isBot ? 'bg-zinc-800 rounded-tl-sm' : 'bg-blue-600 rounded-tr-sm'
                    }`}>
                      {isBot
                        ? <BotText text={msg.body} />
                        : <p className="text-xs text-white leading-relaxed">{msg.body}</p>
                      }
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* FAQ chips */}
          <div className="flex-shrink-0 border-t border-zinc-800">
            <button
              onClick={() => setShowFaq(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800/40 transition-colors text-zinc-400 hover:text-white"
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-semibold">Questions fréquentes</span>
              </div>
              {showFaq ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            {showFaq && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {FAQ.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => askFaq(item)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 hover:border-blue-500/40 text-[10px] text-zinc-300 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input manuel */}
          <div className="flex-shrink-0 p-3 border-t border-zinc-800">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendManual() }
                }}
                placeholder="Votre message… (Entrée pour envoyer)"
                rows={2}
                className="flex-1 bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-blue-500 resize-none min-w-0"
              />
              <button
                onClick={sendManual}
                disabled={!input.trim()}
                className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-xl transition-colors flex-shrink-0 mb-0.5"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="relative">
        {!open && <span className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />}
        <button
          onClick={() => setOpen(v => !v)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500/40"
          style={{ background: open ? '#3f3f46' : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
          title="Support Level Studios"
        >
          {open
            ? <X className="w-5 h-5 text-white" />
            : <MessageSquare className="w-6 h-6 text-white" />
          }
        </button>
      </div>
    </div>
  )
}
