export type Theme = 'light' | 'dark'

const KEY = 'theme'

// A saved choice wins; otherwise the site opens in light mode (whatever the device's own setting is).
// (index.html runs the same rule before the page paints, so keep the two in step.)
export const resolveTheme = (stored: string | null): Theme => (stored === 'light' || stored === 'dark' ? stored : 'light')

export const nextTheme = (t: Theme): Theme => (t === 'dark' ? 'light' : 'dark')

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

export const currentTheme = (): Theme => resolveTheme(document.documentElement.dataset.theme ?? storedTheme())
