import { render } from 'svelte/server'
import { describe, expect, it } from 'vitest'
import ThemeToggle from '../../src/components/ThemeToggle.svelte'
import { nextTheme, resolveTheme } from '../../src/lib/theme'

describe('choosing the theme', () => {
  it('opens in light mode when nothing has been saved', () => {
    expect(resolveTheme(null)).toBe('light')
  })

  it('a saved choice is kept, light or dark', () => {
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('ignores a saved value it does not recognise', () => {
    expect(resolveTheme('sepia')).toBe('light')
    expect(resolveTheme('')).toBe('light')
  })

  it('toggles between the two', () => {
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('light')
  })
})

describe('theme toggle button', () => {
  it('renders an accessible button that says what it will do', () => {
    const { body } = render(ThemeToggle, { props: {} })
    expect(body).toContain('<button')
    expect(body).toContain('aria-label="Switch to dark mode"')
  })
})
