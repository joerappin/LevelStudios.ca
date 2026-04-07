import React from 'react'
import { cn } from '@/utils'

const variants = {
  default: 'bg-zinc-700 text-zinc-300',
  blue: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  green: 'bg-green-900/50 text-green-300 border border-green-800',
  red: 'bg-red-900/50 text-red-300 border border-red-800',
  yellow: 'bg-yellow-900/50 text-yellow-300 border border-yellow-800',
  purple: 'bg-purple-900/50 text-purple-300 border border-purple-800',
  violet: 'bg-violet-900/50 text-violet-300 border border-violet-800',
}

export function Badge({ variant = 'default', className, children }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const config = {
    validee: { variant: 'blue', label: 'Validée' },
    tournee: { variant: 'purple', label: 'Tournée' },
    'post-prod': { variant: 'violet', label: 'Post-prod' },
    livree: { variant: 'green', label: 'Livrée' },
    a_payer: { variant: 'yellow', label: 'À payer' },
    annulee: { variant: 'red', label: 'Annulée' },
    pending: { variant: 'yellow', label: 'En attente' },
    approved: { variant: 'green', label: 'Approuvé' },
    rejected: { variant: 'red', label: 'Refusé' },
  }
  const c = config[status] || { variant: 'default', label: status }
  return <Badge variant={c.variant}>{c.label}</Badge>
}
