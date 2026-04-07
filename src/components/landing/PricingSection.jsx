import React from 'react'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Alpha',
    price: '120€',
    unit: '/ heure',
    studio: 'Cambridge & Nook',
    features: ['Enregistrement audio', 'Mixage basique inclus', 'Fichiers livrés sous 48h', 'Jusqu\'à 2 personnes'],
    color: 'border-zinc-700',
  },
  {
    name: 'Beta',
    price: '149€',
    unit: '/ heure',
    studio: 'Cambridge & Nook',
    features: ['Enregistrement audio + vidéo', 'Montage inclus', 'Livraison 24h', 'Jusqu\'à 4 personnes', 'Clips courts (Shorts)'],
    color: 'border-blue-600',
    highlight: true,
    badge: 'Populaire',
  },
  {
    name: 'Charlie',
    price: '449€',
    unit: '/ session',
    studio: 'Cambridge uniquement',
    features: ['Production complète', 'Direction artistique', 'Équipe dédiée', 'Jusqu\'à 6 personnes', 'Maquillage & stylisme', 'Téléprompter'],
    color: 'border-zinc-700',
  },
]

export default function PricingSection() {
  return (
    <section className="bg-white py-20 px-6" id="tarifs">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">Nos tarifs</h2>
          <p className="text-zinc-500 mt-3">Des formules adaptées à tous vos projets</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.name} className={`relative rounded-2xl border-2 p-6 flex flex-col ${plan.color} ${plan.highlight ? 'shadow-xl shadow-blue-100' : ''}`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
              )}
              <div className="mb-6">
                <p className="text-sm font-medium text-blue-600">{plan.studio}</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-black text-zinc-900">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">{plan.unit}</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-zinc-600 text-sm">
                    <Check size={16} className="text-blue-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
