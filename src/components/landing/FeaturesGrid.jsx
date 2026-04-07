import React from 'react'
import { Mic, Camera, Wifi, Users, Clock, Award } from 'lucide-react'

const features = [
  { icon: Mic, title: 'Équipement Pro', desc: 'Microphones Shure SM7B, interfaces audio Focusrite, moniteurs de studio calibrés.' },
  { icon: Camera, title: 'Vidéo 4K', desc: 'Caméras Sony FX3, éclairages LED professionnels, fond vert disponible.' },
  { icon: Wifi, title: 'Connectivité', desc: 'Internet fibre 1 Gbit/s, streaming en direct possible, partage de fichiers rapide.' },
  { icon: Users, title: 'Jusqu\'à 6 personnes', desc: 'Studios conçus pour accueillir plusieurs invités simultanément.' },
  { icon: Clock, title: 'Flexible', desc: 'Réservation à l\'heure, demi-journée ou journée complète, 7j/7.' },
  { icon: Award, title: 'Support PM', desc: 'Un Project Manager dédié pour vous accompagner de l\'enregistrement à la livraison.' },
]

export default function FeaturesGrid() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">Tout ce dont vous avez besoin</h2>
          <p className="text-zinc-500 mt-3 text-lg">Des studios entièrement équipés pour des productions professionnelles</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-zinc-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                <Icon size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-zinc-900 text-lg mb-2">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
