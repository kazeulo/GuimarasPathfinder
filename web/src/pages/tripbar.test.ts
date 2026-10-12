// @vitest-environment happy-dom
import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { engine } from '../algo'
import { ENTRIES, PRESETS, selectionOf } from '../data'
import { setMapMode } from '../lib/mapMode.svelte'
import type { Model } from '../model'
import PlanPage from './PlanPage.svelte'

const model: Model = { entryKey: 'wharf', entry: ENTRIES.wharf, fw: engine.floydWarshall(ENTRIES.wharf.graph) }

// A stand-in for the browser's "is this element on screen?" signal that the test can fire by hand.
type Watcher = { callback: IntersectionObserverCallback; disconnected: boolean }
let watchers: Watcher[] = []
const scrollIntoView = vi.fn()

let target: HTMLElement
let app: ReturnType<typeof mount> | undefined

beforeEach(() => {
  setMapMode('diagram') // the real map needs a real browser
  watchers = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      watcher: Watcher
      constructor(callback: IntersectionObserverCallback) {
        this.watcher = { callback, disconnected: false }
        watchers.push(this.watcher)
      }
      observe() {}
      disconnect() {
        this.watcher.disconnected = true
      }
    },
  )
  Element.prototype.scrollIntoView = scrollIntoView
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
  scrollIntoView.mockClear()
  target = document.createElement('div')
  document.body.append(target)
})

afterEach(() => {
  if (app) unmount(app)
  app = undefined
  target.remove()
  vi.unstubAllGlobals()
})

const mountPlan = (selected: boolean[]) => {
  app = mount(PlanPage, { target, props: { model, selected, setSelected: () => {} } })
  flushSync()
}
const screenSays = (onScreen: boolean) => {
  const live = watchers.filter((w) => !w.disconnected).at(-1)!
  live.callback([{ isIntersecting: onScreen } as IntersectionObserverEntry], {} as IntersectionObserver)
  flushSync()
}
const bar = () => target.querySelector('.trip-bar')

describe('trip summary bar for phones', () => {
  it('shows while the trip is off-screen, and hides once the trip is on screen', () => {
    mountPlan(selectionOf(PRESETS[0].nodes))
    expect(bar()).not.toBeNull()
    expect(bar()!.textContent).toContain('5 places')

    screenSays(true) // the visitor scrolled down to the trip
    expect(bar()).toBeNull()

    screenSays(false) // and back up
    expect(bar()).not.toBeNull()
  })

  it('"See trip" scrolls to the trip', () => {
    mountPlan(selectionOf(PRESETS[0].nodes))
    ;[...target.querySelectorAll('.trip-bar button')].find((b) => b.textContent?.trim() === 'See trip')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    expect(scrollIntoView).toHaveBeenCalledOnce()
  })

  it('is never shown when there is no trip to summarise', () => {
    mountPlan(selectionOf([]))
    expect(bar()).toBeNull()
  })

  it('says "too long" when the trip does not fit the time available', () => {
    mountPlan(selectionOf(PRESETS.find((p) => p.id === 'all')!.nodes)) // 22 hours of trip against a 10 hour day
    expect(bar()!.textContent).toContain('too long')
  })

  it('stops watching the page when it goes away', () => {
    mountPlan(selectionOf(PRESETS[0].nodes))
    unmount(app!)
    app = undefined
    expect(watchers.every((w) => w.disconnected)).toBe(true)
  })
})
