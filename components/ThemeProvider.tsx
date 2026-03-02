'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'dark' | 'light'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  mounted: boolean
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children, defaultTheme = 'dark' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    let saved: Theme | null = null
    try {
      saved = localStorage.getItem('theme') as Theme | null
    } catch {}

    const initial = saved === 'light' || saved === 'dark' ? saved : defaultTheme
    setThemeState(initial)

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(initial)
  }, [defaultTheme])

  function setTheme(next: Theme) {
    setThemeState(next)

    try {
      localStorage.setItem('theme', next)
    } catch {}

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(next)
  }

  const value = useMemo(
    () => ({ theme, setTheme, mounted }),
    [theme, mounted]
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeProviderContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}