import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { useApp } from '../../contexts/AppContext'

const MANUAL_SECTIONS = [
  {
    title: 'Guide de démarrage',
    icon: '🚀',
    articles: [
      { title: 'Présentation du studio', content: "Level Studio est un studio de podcast professionnel situé à Montréal. Nous disposons de 4 salles d'enregistrement (Cambridge, Nook, Loft, Rooftop) équipées de matériel haut de gamme.\n\nNotre mission : permettre à chaque créateur de produire du contenu audio et vidéo professionnel, quel que soit son niveau d'expérience." },
      { title: "Accueil d'un client", content: "Lors de l'arrivée d'un client :\n1. Vérifier sa réservation dans le système\n2. L'accueillir chaleureusement et lui remettre son badge temporaire\n3. Lui faire visiter l'espace réservé\n4. Lui présenter le matériel disponible\n5. Rester disponible pour toute question technique" },
      { title: "Procédure d'ouverture", content: "Chaque matin :\n• Arriver 15 min avant le premier client\n• Allumer les équipements de chaque studio\n• Vérifier le planning du jour sur l'application\n• Préparer les studios selon les réservations\n• Vérifier le stock de consommables (câbles, pop-filters...)" },
    ]
  },
  {
    title: 'Matériel & Équipements',
    icon: '🎙️',
    articles: [
      { title: 'Studio Cambridge — Équipements', content: 'Microphones : Shure SM7B (x4)\nCaméras : Sony FX30 (x3)\nÉclairage : Godox SL300III-K2\nInterface audio : Universal Audio Apollo Twin\nCasques : Sony MDR-7506 (x4)' },
      { title: 'Studio Nook — Équipements', content: 'Microphone : Neumann U87 Ai\nInterface : Apogee Duet\nCasques : Beyerdynamic DT 770 Pro (x2)\nTraitement acoustique renforcé\nIdéal pour voix solo et interviews intimes' },
      { title: 'Maintenance préventive', content: 'Hebdomadaire :\n• Nettoyage des microphones (capsules)\n• Vérification des câbles XLR\n• Test de tous les équipements\n\nMensuelle :\n• Mise à jour des logiciels\n• Vérification et remplacement des filtres pop\n• Rapport de maintenance à envoyer à Joe' },
    ]
  },
  {
    title: 'Procédures & Protocoles',
    icon: '📋',
    articles: [
      { title: "Gestion d'un incident", content: "En cas d'incident technique :\n1. Rester calme et rassurer le client\n2. Identifier le problème\n3. Tenter une résolution basique (redémarrage, remplacement de câble)\n4. Si non résolu : contacter le responsable technique\n5. Proposer une compensation au client (extension de session, rabais)\n6. Remplir le rapport d'incident dans l'application" },
      { title: "Politique d'annulation", content: 'Annulation > 48h avant : remboursement complet\nAnnulation 24-48h avant : 50% de remboursement\nAnnulation < 24h : aucun remboursement\nCas de force majeure : traitement au cas par cas par Joe\n\nToujours documenter les annulations dans le système.' },
      { title: 'Confidentialité des projets', content: "Tous les projets clients sont strictement confidentiels.\n\n• Ne jamais discuter des projets en dehors du studio\n• Les fichiers clients ne doivent pas être partagés sans autorisation\n• Les accès au serveur sont personnels et non partagés\n• En cas de doute, consulter Joe avant toute communication externe" },
    ]
  },
]

export default function AdminManual() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [openSection, setOpenSection] = useState(0)
  const [openArticle, setOpenArticle] = useState(null)

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100'
  const sectionHover = isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'
  const articleHover = isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-gray-50'
  const articleDivide = isDark ? 'border-zinc-800/50' : 'border-gray-100'
  const contentBg = isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-50 text-gray-700'

  return (
    <Layout navItems={ADMIN_NAV} title="Manuel interne">
      <div className="max-w-3xl space-y-4">
        <div className={`border rounded-2xl p-6 mb-6 ${card}`}>
          <h2 className={`font-bold text-lg mb-1 ${textPrimary}`}>Manuel de l'équipe Level Studio</h2>
          <p className={`text-sm ${textSecondary}`}>Retrouvez toutes les procédures, guides et informations utiles pour l'équipe.</p>
        </div>

        {MANUAL_SECTIONS.map((section, si) => (
          <div key={si} className={`border rounded-2xl overflow-hidden ${card}`}>
            <button
              onClick={() => setOpenSection(openSection === si ? null : si)}
              className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${sectionHover}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                <h3 className={`font-semibold ${textPrimary}`}>{section.title}</h3>
                <span className={`text-xs ${textSecondary}`}>{section.articles.length} articles</span>
              </div>
              {openSection === si
                ? <ChevronDown className={`w-4 h-4 ${textSecondary}`} />
                : <ChevronRight className={`w-4 h-4 ${textSecondary}`} />}
            </button>
            {openSection === si && (
              <div className={`border-t ${divider}`}>
                {section.articles.map((article, ai) => {
                  const key = `${si}-${ai}`
                  return (
                    <div key={ai} className={`border-b last:border-0 ${articleDivide}`}>
                      <button
                        onClick={() => setOpenArticle(openArticle === key ? null : key)}
                        className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors text-left ${articleHover}`}
                      >
                        <span className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>{article.title}</span>
                        {openArticle === key
                          ? <ChevronDown className={`w-3.5 h-3.5 ${textSecondary}`} />
                          : <ChevronRight className={`w-3.5 h-3.5 ${textSecondary}`} />}
                      </button>
                      {openArticle === key && (
                        <div className="px-5 pb-4">
                          <div className={`rounded-xl p-4 text-sm whitespace-pre-line leading-relaxed ${contentBg}`}>{article.content}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  )
}
