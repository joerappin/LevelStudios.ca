import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '../utils'

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR   = ['L','M','M','J','V','S','D']

function buildCells(year, month) {
  const first   = new Date(year, month, 1)
  const last    = new Date(year, month + 1, 0)
  const startDow = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function toYMD(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function DatePicker({ value, onChange, isDark }) {
  const parseYM = (v) => {
    if (v) {
      const parts = v.split('-')
      return { y: parseInt(parts[0]), m: parseInt(parts[1]) - 1 }
    }
    const now = new Date()
    return { y: now.getFullYear(), m: now.getMonth() }
  }

  const [open, setOpen]       = useState(false)
  const [viewYear, setViewYear] = useState(() => parseYM(value).y)
  const [viewMonth, setViewMonth] = useState(() => parseYM(value).m)
  const ref = useRef(null)

  // Sync view with value when it changes externally
  useEffect(() => {
    const { y, m } = parseYM(value)
    setViewYear(y)
    setViewMonth(m)
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const select = (day) => {
    if (!day) return
    onChange(toYMD(viewYear, viewMonth, day))
    setOpen(false)
  }

  const today = new Date().toISOString().split('T')[0]
  const cells = buildCells(viewYear, viewMonth)

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Choisir une date"
        className={cn(
          'h-full px-2.5 rounded-xl border transition-colors flex items-center',
          open
            ? 'bg-violet-600 border-violet-600 text-white'
            : isDark
              ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-violet-500 hover:text-violet-400'
              : 'bg-white border-gray-300 text-gray-500 hover:border-violet-400 hover:text-violet-500'
        )}
      >
        <CalendarDays size={15} />
      </button>

      {open && (
        <div className={cn(
          'absolute top-full mt-2 right-0 z-50 rounded-2xl border shadow-2xl p-3 w-64',
          isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
        )}>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className={cn('p-1 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100')}>
              <ChevronLeft size={14} />
            </button>
            <span className={cn('text-xs font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              {MONTHS_FR[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth}
              className={cn('p-1 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100')}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map((d, i) => (
              <div key={i} className={cn('text-center text-[10px] font-bold py-0.5', isDark ? 'text-zinc-500' : 'text-gray-400')}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="h-8" />
              const ymd = toYMD(viewYear, viewMonth, day)
              const isSelected = ymd === value
              const isToday    = ymd === today
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(day)}
                  className={cn(
                    'h-8 w-full flex items-center justify-center text-xs rounded-lg font-medium transition-colors',
                    isSelected
                      ? 'bg-violet-600 text-white font-bold'
                      : isToday
                        ? isDark ? 'ring-1 ring-violet-500 text-violet-400 font-bold' : 'ring-1 ring-violet-400 text-violet-600 font-bold'
                        : isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
