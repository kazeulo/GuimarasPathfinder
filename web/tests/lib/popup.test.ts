// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { ENTRIES, INFO, PLACES } from '../../src/data'
import { buildPopup } from '../../src/lib/popup'

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

  it('tells you where the place is and what it is', () => {
    const el = buildPopup(12, entry, { chosen: false }) // the Trappist abbey
    expect(el.querySelector('.pop-where')!.textContent).toBe('San Miguel, Jordan')
    expect(el.querySelector('.pop-about')!.textContent).toContain('Trappist Abbey')
  })

  it('warns that SEAFDEC has been closed to tourists', () => {
    const el = buildPopup(8, entry, { chosen: false })
    expect(el.querySelector('.pop-note')!.textContent).toContain('closed to tourists')
  })

  it('gives every place the barangay and town from the SP, and a warning only where one is needed', () => {
    for (let i = 1; i < PLACES.length; i++) expect(INFO[i].where, PLACES[i].name!).toMatch(/, /)
    expect(INFO[13].where).toBe('Cabano, San Lorenzo') // Sunrise Valley
    expect(INFO[3].where).toBe('Cabano, San Lorenzo') // Reyley
    const el = buildPopup(13, entry, { chosen: false })
    expect(el.querySelector('.pop-where')!.textContent).toBe('Cabano, San Lorenzo')
    expect(el.querySelector('.pop-note')).toBeNull()
    expect(el.querySelector('.pop-about')!.textContent).toContain('check locally')
  })
})

describe('place information', () => {
  it('every destination has a description, and the port has none', () => {
    expect(INFO[0]).toBeUndefined()
    for (let i = 1; i < PLACES.length; i++) expect(INFO[i]?.about.length, PLACES[i].name!).toBeGreaterThan(30)
  })

  it('only describes places that exist', () => {
    for (const key of Object.keys(INFO)) expect(Number(key)).toBeLessThan(PLACES.length)
  })
})
