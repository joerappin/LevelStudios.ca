import React from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { Instagram, Youtube, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-white text-xs font-bold">L</span>
              </div>
              <span className="text-white font-bold">Level Studio</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">Votre studio de podcast professionnel à Paris.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Studios</h4>
            <ul className="space-y-2 text-zinc-500 text-sm">
              <li>Studio Cambridge</li>
              <li>Studio Nook</li>
              <li>Tarifs</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Liens</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to={createPageUrl('Home')} className="text-zinc-500 hover:text-white transition-colors">Accueil</Link></li>
              <li><Link to={createPageUrl('Contact')} className="text-zinc-500 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to={createPageUrl('NewReservation')} className="text-zinc-500 hover:text-white transition-colors">Réserver</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Réseaux sociaux</h4>
            <div className="flex gap-3">
              <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Youtube size={20} /></a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Twitter size={20} /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs">© 2026 Level Studio. Tous droits réservés.</p>
          <div className="flex gap-4 text-zinc-600 text-xs">
            <a href="#" className="hover:text-zinc-400 transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">CGV</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
