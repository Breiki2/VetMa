import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { IconButton, MenuItem } from './ui'

const STORAGE_KEY = 'vetma-theme'
type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage unavailable */
  }
  try {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {
    /* matchMedia unavailable */
  }
  return 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* storage unavailable */
  }
}

export function applyInitialTheme() {
  applyTheme(initialTheme())
}

export function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'menu' }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )
  const next = theme === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  if (variant === 'menu') {
    return (
      <MenuItem onSelect={() => setTheme(next)}>
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      </MenuItem>
    )
  }

  return (
    <IconButton
      label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      onClick={() => setTheme(next)}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </IconButton>
  )
}
