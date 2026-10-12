export type Theme = 'light' | 'dark'

const KEY = 'theme'

// A saved choice wins; otherwise follow the device setting.
// (index.html runs the same rule before the page paints, so keep the two in step.)
export const resolveTheme = (stored: string | null, systemDark: boolean): Theme =>
  stored === 'light' || stored === 'dark' ? stored : systemDark ? 'dark' : 'light'

export const nextTheme = (t: Theme): Theme => (t === 'dark' ? 'light' : 'dark')

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

// Reading or writing storage can throw (private browsing, blocked cookies), so it must never break the page.
export function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

export function saveTheme(t: Theme): void {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* the choice just won't be remembered */
  }
}

export const applyTheme = (t: Theme): void => {
  document.documentElement.dataset.theme = t
}

export const currentTheme = (): Theme => resolveTheme(document.documentElement.dataset.theme ?? storedTheme(), systemQuery().matches)

export const watchSystemTheme = (onChange: (t: Theme) => void): (() => void) => {
  const mq = systemQuery()
  const handler = (e: MediaQueryListEvent) => {
    if (storedTheme() === null) onChange(e.matches ? 'dark' : 'light') // only until the visitor chooses
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
