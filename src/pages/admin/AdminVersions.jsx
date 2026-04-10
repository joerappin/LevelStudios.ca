import React from 'react'
import { GitBranch } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { useApp } from '../../contexts/AppContext'

const VERSIONS = [
  { version: 'V1.0', major: true,  commit: '9dbc4d2', label: 'Lancement initial de l\'app Level Studios' },
  { version: 'V1.1', major: false, commit: '9715e25', label: 'Suppression des comptes démo' },
  { version: 'V1.2', major: false, commit: 'a7e8338', label: 'Reset comptes + réservations (seed v7)' },
  { version: 'V1.3', major: false, commit: '662da19', label: 'Fix chargement/sauvegarde comptes clients' },
  { version: 'V2.0', major: true,  commit: '436e6ec', label: 'Mise en place CI/CD GitHub Actions' },
  { version: 'V2.1', major: false, commit: 'd4895c6', label: 'Seed v8 — reset forcé' },
  { version: 'V2.2', major: false, commit: '4a361c3', label: 'Retrait credentials démo des écrans de login' },
  { version: 'V2.3', major: false, commit: 'd3f0880', label: 'Retrait onglet réservation pour chef de projet' },
  { version: 'V2.4', major: false, commit: '1e073de', label: 'Routing comptes vers bons dossiers' },
  { version: 'V3.0', major: true,  commit: '0ded2e5', label: 'Déploiement production — domaine levelstudios.ca' },
  { version: 'V3.1', major: false, commit: '34154ad', label: 'Migration hébergement GitHub Pages → Hostinger FTP' },
  { version: 'V3.2', major: false, commit: 'c91b3fe', label: 'Fix 404 au rafraîchissement de page' },
  { version: 'V3.3', major: false, commit: null,      label: 'Création de comptes Admin depuis l\'interface + page Versions' },
]

export default function AdminVersions() {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const card      = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
  const textPrimary   = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500'
  const rowBorder  = isDark ? 'border-zinc-800/60' : 'border-gray-100'

  return (
    <Layout navItems={ADMIN_NAV} title="Versions">
      <div className="space-y-6">

        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className={`px-5 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-gray-100'} flex items-center gap-2`}>
            <GitBranch className="w-4 h-4 text-violet-400" />
            <span className={`text-sm font-semibold ${textPrimary}`}>Historique des versions</span>
          </div>

          <table className="w-full">
            <thead>
              <tr className={`border-b text-xs font-semibold ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-200'}`}>
                <th className="text-left px-5 py-3 w-24">Version</th>
                <th className="text-left px-5 py-3">Changement</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell w-28">Commit</th>
              </tr>
            </thead>
            <tbody>
              {[...VERSIONS].reverse().map((v) => (
                <tr key={v.version} className={`border-b ${rowBorder}`}>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md font-mono ${
                      v.major
                        ? 'bg-violet-500/15 text-violet-400'
                        : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {v.version}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-sm ${textPrimary}`}>{v.label}</td>
                  <td className={`px-5 py-3.5 hidden sm:table-cell font-mono text-xs ${textSecondary}`}>
                    {v.commit ?? <span className="italic text-violet-400">en cours</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </Layout>
  )
}
