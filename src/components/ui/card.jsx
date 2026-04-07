import React from 'react'
import { cn } from '@/utils'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('bg-zinc-900 border border-zinc-800 rounded-xl', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return <div className={cn('p-4 border-b border-zinc-800', className)}>{children}</div>
}

export function CardBody({ className, children }) {
  return <div className={cn('p-4', className)}>{children}</div>
}

export function StatCard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'text-blue-400 bg-blue-900/20',
    green: 'text-green-400 bg-green-900/20',
    yellow: 'text-yellow-400 bg-yellow-900/20',
    red: 'text-red-400 bg-red-900/20',
    purple: 'text-purple-400 bg-purple-900/20',
  }
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-4">
      {Icon && (
        <div className={cn('p-2 rounded-lg flex-shrink-0', colors[color])}>
          <Icon size={20} className={colors[color].split(' ')[0]} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-zinc-400 text-xs font-medium">{label}</p>
        <p className="text-white text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  )
}
