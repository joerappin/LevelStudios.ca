import React, { useState } from 'react'
import { FlaskConical, CreditCard, BookOpen, CalendarCheck, Tag, Megaphone, Clock, Layers, ShoppingBag } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils'

const FEATURES = [
  {
    key: 'subscription_tab',
    icon: CreditCard,
    label: 'Onglet Abonnement',
    desc: 'Affiche ou masque l\'onglet "Abonnement" (packs d\'heures) dans les comptes clients.',
    section: 'Comptes clients',
  },
  {
    key: 'library_tab',
    icon: BookOpen,
    label: 'Onglet Médiathèque',
    desc: 'Affiche ou masque l\'onglet "Médiathèque" dans les comptes clients.',
    section: 'Comptes clients',
  },
  {
    key: 'dashboard_pack_hours',
    icon: Layers,
    label: 'Bloc pack d\'heures (accueil)',
    desc: 'Affiche ou masque le compteur d\'heures restantes sur l\'accueil client.',
    section: 'Comptes clients',
  },
  {
    key: 'dashboard_buy_pack',
    icon: ShoppingBag,
    label: 'Bloc acheter un pack (accueil)',
    desc: 'Affiche ou masque le bouton d\'achat de pack d\'heures sur l\'accueil client.',
    section: 'Comptes clients',
  },
  {
    key: 'online_booking',
    icon: CalendarCheck,
    label: 'Réservation en ligne',
    desc: 'Active ou désactive le tunnel de réservation public (/reservation).',
    section: 'Réservations',
  },
  {
    key: 'promo_codes',
    icon: Tag,
    label: 'Codes promo',
    desc: 'Permet aux clients d\'utiliser des codes promotionnels lors de la réservation.',
    section: 'Réservations',
  },
  {
    key: 'popup_communication',
    icon: Megaphone,
    label: 'Popups de communication',
    desc: 'Active l\'affichage des messages popup créés dans l\'onglet Communication.',
    section: 'Communication',
  },
  {
    key: 'employee_checkin',
    icon: Clock,
    label: 'Pointage employés',
    desc: 'Active le module de pointage entrée/sortie pour les employés.',
    section: 'Employés',
  },
]

const SECTIONS = [...new Set(FEATURES.map(f => f.section))]

export default function AdminBeta() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  const [flags, setFlags] = useState(Store.getFeatureFlags())

  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const sectionLabel = isDark ? 'text-zinc-500' : 'text-gray-400'

  const toggle = (key) => {
    const next = !flags[key]
    Store.setFeatureFlag(key, next)
    setFlags(Store.getFeatureFlags())
  }

  const activeCount = Object.values(flags).filter(Boolean).length

  return (
    <Layout navItems={ADMIN_NAV} title="Beta">
      <div className="space-y-6 max-w-2xl">

        {/* Header */}
        <div className={cn('border rounded-2xl p-5 flex items-center gap-4', isDark ? 'bg-violet-950/30 border-violet-800/40' : 'bg-violet-50 border-violet-200')}>
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={cn('font-bold', textPrimary)}>Fonctionnalités Beta</h2>
            <p className={cn('text-sm mt-0.5', textSecondary)}>
              Activez ou désactivez les modules de la plateforme. {activeCount} fonctionnalité{activeCount !== 1 ? 's' : ''} active{activeCount !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>

        {/* Feature groups */}
        {SECTIONS.map(section => (
          <div key={section}>
            <p className={cn('text-xs font-bold uppercase tracking-widest mb-3', sectionLabel)}>{section}</p>
            <div className={cn('border rounded-2xl overflow-hidden', card)}>
              {FEATURES.filter(f => f.section === section).map((feature, i, arr) => {
                const Icon = feature.icon
                const enabled = flags[feature.key]
                return (
                  <div
                    key={feature.key}
                    className={cn(
                      'flex items-center gap-4 px-5 py-4 transition-colors',
                      i < arr.length - 1 && (isDark ? 'border-b border-zinc-800' : 'border-b border-gray-100'),
                      isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', enabled ? (isDark ? 'bg-violet-500/15' : 'bg-violet-50') : (isDark ? 'bg-zinc-800' : 'bg-gray-100'))}>
                      <Icon size={16} className={enabled ? 'text-violet-400' : (isDark ? 'text-zinc-500' : 'text-gray-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold', textPrimary)}>{feature.label}</p>
                      <p className={cn('text-xs mt-0.5', textSecondary)}>{feature.desc}</p>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => toggle(feature.key)}
                      className={cn(
                        'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
                        enabled ? 'bg-violet-600' : (isDark ? 'bg-zinc-700' : 'bg-gray-300')
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                        enabled ? 'translate-x-5' : 'translate-x-0'
                      )} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      </div>
    </Layout>
  )
}
