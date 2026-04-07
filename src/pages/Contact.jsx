import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle, Sun, Moon } from 'lucide-react'
import { Store } from '../data/store'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { cn } from '../utils'

export default function Contact() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useApp()
  const isDark = theme === 'dark'

  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    Store.addMessage({
      from_email: form.email,
      from_name: form.name,
      subject: form.subject,
      body: form.message,
      type: 'contact',
    })
    setSent(true)
  }

  const input = cn(
    'w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors',
    isDark
      ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
  )

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900')}>

      {/* Nav */}
      <nav className={cn('border-b h-16 px-4 sm:px-6 flex items-center justify-between', isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200')}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className={cn('transition-colors', isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-900')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/logo.jpg" className="w-7 h-7 object-contain rounded-lg" alt="Level Studios" />
          <span className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}>Level Studios</span>
        </div>
        <button onClick={toggleTheme} className={cn('p-2 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-12">
          <h1 className={cn('text-4xl font-black mb-3', isDark ? 'text-white' : 'text-gray-900')}>Nous contacter</h1>
          <p className={cn('text-lg', isDark ? 'text-zinc-400' : 'text-gray-500')}>Une question ? Un projet ? Notre équipe vous répond rapidement.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-10">
          {/* Contact info cards */}
          <div className="md:col-span-2 space-y-4">
            {[
              { icon: Mail,  title: 'Email',    lines: ['contact@levelstudio.fr'] },
              { icon: Phone, title: 'Téléphone', lines: ['+1 514 123-4567', 'Lun–Ven 9h–18h'] },
              { icon: MapPin,title: 'Adresse',   lines: ['123 Rue Saint-Laurent', 'Montréal, QC H2Y 1N7'] },
            ].map(({ icon: Icon, title, lines }) => (
              <div key={title} className={cn('rounded-2xl p-5 border flex items-start gap-4', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm')}>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-zinc-800' : 'bg-violet-50')}>
                  <Icon className={cn('w-5 h-5', isDark ? 'text-zinc-300' : 'text-violet-600')} />
                </div>
                <div>
                  <div className={cn('font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>{title}</div>
                  {lines.map((l, i) => (
                    <div key={i} className={cn('text-sm', i === 0 ? (isDark ? 'text-zinc-400' : 'text-gray-600') : (isDark ? 'text-zinc-500' : 'text-gray-400'))}>{l}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className={cn('rounded-2xl p-10 text-center border', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm')}>
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className={cn('text-xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>Message envoyé !</h2>
                <p className={cn('mb-6 text-sm', isDark ? 'text-zinc-400' : 'text-gray-500')}>Nous vous répondrons dans les plus brefs délais.</p>
                <button onClick={() => navigate('/')} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
                  Retour à l'accueil
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={cn('rounded-2xl p-8 space-y-5 border', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm')}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-zinc-400' : 'text-gray-600')}>Nom complet</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} placeholder="" required />
                  </div>
                  <div>
                    <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-zinc-400' : 'text-gray-600')}>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={input} placeholder="" required />
                  </div>
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-zinc-400' : 'text-gray-600')}>Sujet</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={input} placeholder="Demande d'information..." required />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-zinc-400' : 'text-gray-600')}>Message</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} className={cn(input, 'resize-none')} placeholder="Votre message..." required />
                </div>
                <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20">
                  <Send className="w-4 h-4" /> Envoyer le message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
