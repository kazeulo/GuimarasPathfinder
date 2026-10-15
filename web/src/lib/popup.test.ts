// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { ENTRIES } from '../data'
import { buildPopup } from './popup'

const entry = ENTRIES.wharf

describe('pin popup', () => {
  it('shows the photo, name, type and typical stay of a place', () => {
    const el = buildPopup(4, entry, { chosen: false })
    const img = el.querySelector('img')!
    expect(img.getAttribute('src')).toContain('images/places/smallest-plaza.webp')
    expect(img.alt).toBe('Smallest Plaza')
    expect(el.textContent).toContain('Smallest Plaza')
    expect(el.textContent).toContain('Culture & food · about 45 min')
  })

  it('writes long stays in hours', () => {
    expect(buildPopup(1, entry, { chosen: false }).textContent).toContain('about 2 h')
    expect(buildPopup(8, entry, { chosen: false }).textContent).toContain('about 1.5 h')
  })

  it('has no button when the page is only for viewing', () => {
    expect(buildPopup(4, entry, { chosen: false }).querySelector('button')).toBeNull()
  })

  it('offers "Add to trip" for a place that is not chosen, and "Remove from trip" for one that is', () => {
    const add = buildPopup(4, entry, { chosen: false, onToggle: () => {} }).querySelector('button')!
    const remove = buildPopup(4, entry, { chosen: true, onToggle: () => {} }).querySelector('button')!
    expect(add.textContent).toBe('Add to trip')
    expect(remove.textContent).toBe('Remove from trip')
  })

  it('runs the toggle when the button is pressed', () => {
    const onToggle = vi.fn()
    buildPopup(4, entry, { chosen: false, onToggle }).querySelector('button')!.click()
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('the port has a name but no photo, type or button', () => {
    const el = buildPopup(0, entry, { chosen: false, onToggle: () => {} })
    expect(el.textContent).toBe('Jordan Wharf')
    expect(el.querySelector('img')).toBeNull()
    expect(el.querySelector('button')).toBeNull()
  })

  it('uses plain text for names, so a name can never inject markup', () => {
    const el = buildPopup(6, entry, { chosen: false }) // Bikers' Hill, contains an apostrophe
    expect(el.querySelector('.pop-name')!.textContent).toBe("Bikers' Hill")
  })
})
