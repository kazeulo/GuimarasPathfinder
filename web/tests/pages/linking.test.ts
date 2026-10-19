// @vitest-environment happy-dom
import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { engine } from '../../src/algo'
import { ENTRIES, PRESETS, selectionOf } from '../../src/data'
import { setMapMode } from '../../src/lib/mapMode.svelte'
import type { Model } from '../../src/model'
import PlanPage from '../../src/pages/PlanPage.svelte'

const model: Model = { entryKey: 'wharf', entry: ENTRIES.wharf, fw: engine.floydWarshall(ENTRIES.wharf.graph) }
const STARTER = selectionOf(PRESETS[0].nodes) // Smallest Plaza, Mountain Resort, Landmark, Pitstop, Trappist

let target: HTMLElement
let app: ReturnType<typeof mount> | undefined
const setSelected = vi.fn<(s: boolean[]) => void>()

beforeEach(() => {
  setMapMode('diagram') // the real map needs a real browser
  setSelected.mockClear()
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width'), // act like a phone
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  target = document.createElement('div')
  document.body.append(target)
  app = mount(PlanPage, { target, props: { model, selected: STARTER, setSelected } })
  flushSync()
})

afterEach(() => {
  if (app) unmount(app)
  app = undefined
  target.remove()
})

const all = <T extends Element>(sel: string) => [...target.querySelectorAll<T>(sel)]
const row = (name: string) => all<HTMLElement>('.places li').find((li) => li.querySelector('.pname')!.textContent === name)!
const click = (el: Element) => {
  ;(el as HTMLElement).click()
  flushSync()
}
const type = (el: HTMLInputElement, value: string) => {
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}
const sheetPx = () => parseFloat(target.querySelector<HTMLElement>('.plan-panel')!.style.getPropertyValue('--sheet-h'))
const chosenIn = (call: number) => setSelected.mock.calls[call][0].flatMap((on, i) => (on ? [i] : []))

describe('the list and the map are linked', () => {
  it('the checkbox adds or removes a place', () => {
    click(row('Camp Alfredo').querySelector('input')!) // not in the trip yet
    expect(chosenIn(0)).toContain(11)
    click(row('Smallest Plaza').querySelector('input')!) // already in
    expect(chosenIn(1)).not.toContain(4)
  })

  it('tapping a name does not change the trip', () => {
    click(row('Camp Alfredo').querySelector('.pbody')!)
    expect(setSelected).not.toHaveBeenCalled()
  })

  it('tapping a name on a phone tucks the sheet down so the map is in view', () => {
    target.querySelector('.sheet-grab')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    flushSync()
    const open = sheetPx()
    click(row('Camp Alfredo').querySelector('.pbody')!)
    expect(sheetPx()).toBeLessThan(open)
  })

  it('pointing at a place picks out its pin, and moving away puts it back', () => {
    const li = row('Smallest Plaza')
    li.dispatchEvent(new MouseEvent('mouseenter'))
    flushSync()
    const lit = all<SVGElement>('.node.hl')
    expect(lit).toHaveLength(1)
    expect(lit[0].querySelector('.num')!.textContent).toBe('5') // Smallest Plaza is number 5 on the map
    li.dispatchEvent(new MouseEvent('mouseleave'))
    flushSync()
    expect(all('.node.hl')).toHaveLength(0)
  })

  it('keyboard focus picks out the pin too', () => {
    const body = row('Wind Farm').querySelector('.pbody')!
    body.dispatchEvent(new FocusEvent('focus'))
    flushSync()
    expect(all('.node.hl')).toHaveLength(1)
    body.dispatchEvent(new FocusEvent('blur'))
    flushSync()
    expect(all('.node.hl')).toHaveLength(0)
  })
})

describe('fixing a trip that is too long, in place', () => {
  const stops = () => all<HTMLElement>('.tl-stop')

  it('every stop has a button to remove it, but the start and the return do not', () => {
    expect(stops()).toHaveLength(5)
    for (const s of stops()) expect(s.querySelector('.tl-x')).not.toBeNull()
    expect(target.querySelector('.tl-start .tl-x')).toBeNull()
    expect(target.querySelector('.tl-end .tl-x')).toBeNull()
  })

  it('the button names the place it removes', () => {
    const labels = all('.tl-x').map((b) => b.getAttribute('aria-label'))
    expect(labels).toContain('Remove Smallest Plaza from your trip')
    expect(labels).toContain('Remove OLP Trappist Monastery from your trip')
  })

  it('pressing it takes that place out of the trip and leaves the others', () => {
    const plaza = stops().find((s) => s.textContent!.includes('Smallest Plaza'))!
    click(plaza.querySelector('.tl-x')!)
    expect(chosenIn(0)).toEqual([5, 7, 12, 14]) // the other four stay
  })
})

describe('the hours you have', () => {
  const verdict = () => target.querySelector('.verdict')!.textContent!
  const field = () => target.querySelector<HTMLInputElement>('.hrs input')!

  it('starts at a full day, which the starter trip fits', () => {
    expect(field().value).toBe('10')
    expect(verdict()).toContain('This fits')
  })

  it('accepts any number of hours, not only the presets', () => {
    type(field(), '3')
    expect(verdict()).toContain('Too long for 3 h')
    type(field(), '3.5')
    expect(verdict()).toContain('Too long for 3.5 h')
    type(field(), '6')
    expect(verdict()).toContain('This fits') // the trip takes 5 h 42 min
  })

  it('a preset button fills the box', () => {
    const half = all<HTMLElement>('.hours .chip').find((b) => b.textContent!.startsWith('Half day'))!
    click(half)
    expect(field().value).toBe('6')
    expect(half.classList.contains('on')).toBe(true)
  })

  it('an empty or silly value falls back to a full day instead of breaking', () => {
    type(field(), '')
    expect(verdict()).toContain('This fits')
    type(field(), '-4')
    expect(verdict()).toContain('This fits')
  })

  it('caps very large values at 72 hours', () => {
    type(field(), '5000')
    expect(verdict()).toContain('This fits')
    expect(verdict()).toContain('leaving') // plenty to spare
  })
})
