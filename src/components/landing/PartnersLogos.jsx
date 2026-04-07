import React from 'react'

const partners = ['Spotify', 'Apple Podcasts', 'YouTube', 'Deezer', 'Ausha', 'Acast']

export default function PartnersLogos() {
  return (
    <section className="bg-zinc-950 border-y border-zinc-800 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-zinc-500 text-sm mb-6 uppercase tracking-wider">Nos partenaires &amp; plateformes</p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {partners.map(p => (
            <span key={p} className="text-zinc-400 font-semibold text-lg hover:text-white transition-colors cursor-default">{p}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
