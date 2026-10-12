import { render } from 'svelte/server'
import { describe, expect, it } from 'vitest'
import ThemeToggle from '../components/ThemeToggle.svelte'
import { nextTheme, resolveTheme } from './theme'

describe('choosing the theme', () => {
  it('follows the device when nothing has been saved', () => {
    expect(resolveTheme(null, true)).toBe('dark')
    expect(resolveTheme(null, false)).toBe('light')
  })

  it('a saved choice beats the device setting', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('ignores a saved value it does not recognise', () => {
    expect(resolveTheme('sepia', true)).toBe('dark')
    expect(resolveTheme('', false)).toBe('light')
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
