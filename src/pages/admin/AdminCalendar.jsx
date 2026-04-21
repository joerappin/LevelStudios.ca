import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ExternalLink, Copy, Check } from 'lucide-react'
import Layout from '../../components/Layout'
import { ADMIN_NAV } from './Dashboard'
import { Store } from '../../data/store'
import StudioCalendar from '../../components/StudioCalendar'
import { useReservations } from '../../hooks/useReservations'
import { useAuth } from '../../contexts/AuthContext'

const GOOGLE_CALENDAR_ID = 'f199f2899b15df6880648254217b1598362bf1c9bb9949f3acc3aef3404c999e@group.calendar.google.com'
const GOOGLE_EMBED_SRC   = encodeURIComponent(GOOGLE_CALENDAR_ID)
const GOOGLE_EMBED_URL   = `https://calendar.google.com/calendar/embed?src=${GOOGLE_EMBED_SRC}&ctz=America%2FToronto&hl=fr&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&mode=MONTH`
const GOOGLE_OPEN_URL    = `https://calendar.google.com/calendar/r?cid=${GOOGLE_EMBED_SRC}`

function GoogleAgendaView() {
  const icsUrl = `${window.location.origin}/api/calendar.ics.php`
  const [copied, setCopied] = useState(false)

  const copyICS = () => {
    navigator.clipboard.writeText(icsUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Embedded Google Calendar */}
      <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 600 }}>
        <iframe
          src={GOOGLE_EMBED_URL}
          style={{ border: 0, width: '100%', height: '100%' }}
          frameBorder="0"
          scrolling="no"
          title="Google Agenda Level Studios"
        />
      </div>

      {/* Actions + ICS subscription */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Open in Google Calendar */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-white font-medium text-sm">Ouvrir dans Google Agenda</p>
          <p className="text-white/50 text-xs">Accéder directement au calendrier partagé Level Studios.</p>
          <a
            href={GOOGLE_OPEN_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-fit"
          >
            <ExternalLink size={14} />
            Ouvrir Google Agenda
          </a>
        </div>

        {/* ICS Feed */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-white font-medium text-sm">Synchronisation automatique</p>
          <p className="text-white/50 text-xs">
            Abonnez ce lien dans Google Agenda pour que toutes les réservations y apparaissent automatiquement.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 truncate">
              {icsUrl}
            </code>
            <button
              onClick={copyICS}
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
              title="Copier le lien"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-white/30 text-xs">
            Dans Google Agenda → Autres agendas → ＋ → Via une URL → coller le lien ci-dessus.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminCalendar() {
  const { user } = useAuth()
  const { reservations, reload } = useReservations()
  const navigate = useNavigate()
  const [view, setView] = useState('internal')

  const handleDelete = (id) => {
    Store.updateReservation(id, { trashed: true })
    reload()
  }

  const handleUpdate = (id, patch) => {
    Store.updateReservation(id, { ...patch, modified_by: user?.email || 'admin' })
    reload()
  }

  return (
    <Layout navItems={ADMIN_NAV} title="Calendrier">
      {/* Tab switcher */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setView('internal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'internal'
              ? 'bg-blue-600 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Calendar size={14} />
          Calendrier interne
        </button>
        <button
          onClick={() => setView('google')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'google'
              ? 'bg-blue-600 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <ExternalLink size={14} />
          Google Agenda
        </button>
      </div>

      {view === 'internal' ? (
        <StudioCalendar
          reservations={reservations}
          showClientDetails={true}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onDayDoubleClick={(date) => navigate('/admin/reservations', { state: { openCreate: true, date } })}
        />
      ) : (
        <GoogleAgendaView />
      )}
    </Layout>
  )
}
