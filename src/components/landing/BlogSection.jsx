import React from 'react'

const posts = [
  { title: 'Comment préparer son premier podcast', cat: 'Conseils', date: '15 mars 2026', img: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80' },
  { title: 'Les meilleurs micros pour studio en 2026', cat: 'Équipement', date: '8 mars 2026', img: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&q=80' },
  { title: 'Tendances podcast : ce qui va cartonner', cat: 'Tendances', date: '1 mars 2026', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80' },
]

export default function BlogSection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">Le blog Level Studio</h2>
          <p className="text-zinc-500 mt-3">Conseils, tutoriels et actualités du monde du podcast</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map(post => (
            <article key={post.title} className="rounded-2xl overflow-hidden border border-zinc-100 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="overflow-hidden">
                <img src={post.img} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-5">
                <span className="text-blue-600 text-xs font-semibold uppercase tracking-wider">{post.cat}</span>
                <h3 className="text-zinc-900 font-semibold mt-2 mb-3 leading-snug">{post.title}</h3>
                <p className="text-zinc-400 text-xs">{post.date}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
