import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const studios = [
  { name: 'Studio A', desc: 'Élégant & Chaleureux — jusqu\'à 4 personnes', img: '/studios/studio-a.jpg' },
  { name: 'Studio B', desc: 'Sombre & Sophistiqué — jusqu\'à 4 personnes', img: '/studios/studio-b.jpg' },
  { name: 'Studio C', desc: 'Tech & Moderne — jusqu\'à 6 personnes',        img: '/studios/studio-c.png' },
]

export default function StudioCarousel() {
  const [idx, setIdx] = useState(0)
  const prev = () => setIdx((idx - 1 + studios.length) % studios.length)
  const next = () => setIdx((idx + 1) % studios.length)

  return (
    <section className="bg-zinc-900 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Nos studios</h2>
          <p className="text-zinc-400 mt-3">Découvrez nos espaces conçus pour l'excellence</p>
        </div>
        <div className="relative rounded-2xl overflow-hidden">
          <img src={studios[idx].img} alt={studios[idx].name} className="w-full h-64 md:h-96 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h3 className="text-white text-xl font-bold">{studios[idx].name}</h3>
            <p className="text-zinc-300 text-sm">{studios[idx].desc}</p>
          </div>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"><ChevronLeft size={24} /></button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"><ChevronRight size={24} /></button>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {studios.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-blue-500' : 'bg-zinc-600'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
