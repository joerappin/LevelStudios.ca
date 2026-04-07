import React from 'react'
import { cn } from '@/utils'

const variants = {
  default: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700',
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  outline: 'bg-transparent border border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white',
  white: 'bg-white hover:bg-zinc-100 text-zinc-900',
}
const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
  icon: 'p-2',
}

export const Button = React.forwardRef(({
  variant = 'default', size = 'md', className, disabled, children, ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer select-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900',
      variants[variant] || variants.default,
      sizes[size] || sizes.md,
      className
    )}
    {...props}
  >
    {children}
  </button>
))
Button.displayName = 'Button'
