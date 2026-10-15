// @vitest-environment happy-dom
import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { engine } from '../algo'
import { ENTRIES, PRESETS, selectionOf } from '../data'
import { setMapMode } from '../lib/mapMode.svelte'
import type { Model } from '../model'
import PlanPage from './PlanPage.svelte'

const model: Model = { entryKey: 'wharf', entry: ENTRIES.wharf, fw: engine.floydWarshall(ENTRIES.wharf.graph) }

let target: HTMLElement
let app: ReturnType<typeof mount> | undefined

beforeEach(() => {
  setMapMode('diagram') // the real map needs a real browser
  // pretend to be a phone
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  target = document.createElement('div')
  document.body.append(target)
  app = mount(PlanPage, {
    target,
    props: { model, selected: selectionOf(PRESETS[0].nodes), setSelected: () => {} },
  })
  flushSync()
})

afterEach(() => {
  if (app) unmount(app)
  app = undefined
  target.remove()
})

const find = <T extends Element>(sel: string) => target.querySelector<T>(sel)!
const click = (el: Element) => {
  ;(el as HTMLElement).click()
  flushSync()
}
const type = (el: HTMLInputElement, value: string) => {
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}
const names = () => [...target.querySelectorAll('.places .pname')].map((e) => e.textContent)
const sheetPx = () => parseFloat(find<HTMLElement>('.plan-panel').style.getPropertyValue('--sheet-h'))

describe('the floating panel', () => {
  it('starts on Places, with the Trip tab present but hidden', () => {
    expect(find('#pane-places').hasAttribute('hidden')).toBe(false)
    expect(find('#pane-trip').hasAttribute('hidden')).toBe(true)
    expect(find('#tab-places').getAttribute('aria-selected')).toBe('true')
  })

  it('switches to the Trip tab, and shows how many places are in it', () => {
    expect(find('#tab-trip').textContent).toContain('5')
    click(find('#tab-trip'))
    expect(find('#pane-trip').hasAttribute('hidden')).toBe(false)
    expect(find('#pane-places').hasAttribute('hidden')).toBe(true)
    expect(find('#pane-trip').textContent).toContain('This fits')
  })

  it('searches places by name or type', () => {
    const search = find<HTMLInputElement>('.search')
    type(search, 'beach')
    expect([...names()].sort()).toEqual(['Alobijod Beach Cove', 'Playa de Paraiso', 'Tahi Beach'])
    type(search, 'wind')
    expect(names()).toEqual(['Wind Farm'])
    type(search, 'zzz')
    expect(names()).toEqual([])
    expect(find('.places').textContent).toContain('No places match')
    type(search, '')
    expect(names()).toHaveLength(14)
  })

  it('hides and shows the panel on desktop', () => {
    click(find('.collapse'))
    expect(find('.plan-panel').classList.contains('collapsed')).toBe(true)
    click(find('.panel-open'))
    expect(find('.plan-panel').classList.contains('collapsed')).toBe(false)
    expect(target.querySelector('.panel-open')).toBeNull()
  })

  it('has a GitHub link inside the panel, since the Plan page has no footer', () => {
    expect(find<HTMLAnchorElement>('.panel-foot a').href).toContain('github.com/kazeulo/GuimarasPathfinder')
  })
})

describe('the phone bottom sheet', () => {
  it('opens step by step when the handle is tapped, and closes after the last step', () => {
    const grab = find<HTMLElement>('.sheet-grab')
    grab.setPointerCapture = () => {}
    const tap = () => {
      grab.dispatchEvent(new PointerEvent('pointerdown', { clientY: 500, pointerId: 1, bubbles: true }))
      grab.dispatchEvent(new PointerEvent('pointerup', { clientY: 500, pointerId: 1, bubbles: true }))
      flushSync()
    }
    const peek = sheetPx()
    tap()
    const half = sheetPx()
    expect(half).toBeGreaterThan(peek)
    tap()
    expect(sheetPx()).toBeGreaterThan(half)
    tap()
    expect(sheetPx()).toBe(peek)
  })

  it('opens with the arrow keys', () => {
    const peek = sheetPx()
    find('.sheet-grab').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    flushSync()
    expect(sheetPx()).toBeGreaterThan(peek)
  })

  it('choosing a tab on a phone opens the sheet so you can see it', () => {
    const peek = sheetPx()
    click(find('#tab-trip'))
    expect(sheetPx()).toBeGreaterThan(peek)
  })
})
