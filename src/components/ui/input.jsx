import React from 'react'
import { cn } from '@/utils'

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm',
      'placeholder:text-zinc-500',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm',
      'placeholder:text-zinc-500 resize-none',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      className
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'disabled:opacity-50 cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

export const Label = ({ className, children, ...props }) => (
  <label className={cn('block text-sm font-medium text-zinc-300 mb-1', className)} {...props}>
    {children}
  </label>
)
