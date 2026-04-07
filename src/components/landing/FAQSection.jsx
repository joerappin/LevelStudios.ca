import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  { q: 'Comment réserver un studio ?', a: 'Cliquez sur "Réserver", choisissez votre studio, votre service, la date et l\'heure. Connectez-vous ou créez un compte pour finaliser la réservation.' },
  { q: 'Puis-je annuler ma réservation ?', a: 'Oui, jusqu\'à 48h avant la session. Passé ce délai, 50% du montant est retenu. Contactez-nous via le SAV.' },
  { q: 'Que comprend le service Alpha ?', a: 'L\'enregistrement audio en haute qualité, le mixage basique et la livraison de vos fichiers sous 48h.' },
  { q: 'Y a-t-il un technicien sur place ?', a: 'Oui, un technicien et/ou un Project Manager est présent lors de chaque session pour vous accompagner.' },
  { q: 'Puis-je apporter mon propre matériel ?', a: 'Oui, vous pouvez apporter votre matériel en complément de celui du studio. Contactez-nous à l\'avance pour vérifier la compatibilité.' },
  { q: 'Comment fonctionne le Pack d\'heures ?', a: 'Achetez un pack et déduisez vos heures à chaque session. Les packs Argent et Gold offrent des réductions de 10 à 20%.' },
]

export default function FAQSection() {
  const [open, setOpen] = useState(null)
  return (
    <section className="bg-zinc-50 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">Questions fréquentes</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50 transition-colors"
              >
                <span className="font-medium text-zinc-900">{faq.q}</span>
                <ChevronDown size={18} className={`text-zinc-400 transition-transform flex-shrink-0 ml-4 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-zinc-600 text-sm leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
