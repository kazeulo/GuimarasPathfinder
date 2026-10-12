// @vitest-environment happy-dom
import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { engine } from '../algo'
import { ENTRIES, PRESETS, selectionOf } from '../data'
import type { Model } from '../model'
import FloydDemo from './FloydDemo.svelte'
import TourDemo from './TourDemo.svelte'

const model: Model = { entryKey: 'wharf', entry: ENTRIES.wharf, fw: engine.floydWarshall(ENTRIES.wharf.graph) }

let target: HTMLElement
let app: ReturnType<typeof mount> | undefined

beforeEach(() => {
  vi.useFakeTimers()
  target = document.createElement('div')
  document.body.append(target)
})

afterEach(() => {
  if (app) unmount(app)
  app = undefined
  target.remove()
  vi.useRealTimers()
})

const click = (label: string) => {
  const b = [...target.querySelectorAll('button')].find((el) => el.textContent?.trim() === label)
  if (!b) throw new Error(`no "${label}" button`)
  b.click()
  flushSync()
}

// Pressing Play must keep going on its own, not advance once and stall.
describe('the animated demos play by themselves', () => {
  it('Floyd–Warshall demo keeps stepping after Play', async () => {
    app = mount(FloydDemo, { target, props: { model } })
    flushSync()
    expect(target.textContent).toContain('Shortcut 0 of')

    click('Play')
    await vi.advanceTimersByTimeAsync(1000) // "Normal" speed: about 10 shortcuts a second
    flushSync()

    const shown = Number(target.textContent?.match(/Shortcut (\d+) of/)?.[1])
    expect(shown).toBeGreaterThan(5)
    expect(target.textContent).toContain('as a stop-over') // the sentence is describing the current step
  })

  it('Floyd–Warshall demo stops at the end and offers to watch again', async () => {
    app = mount(FloydDemo, { target, props: { model } })
    flushSync()
    click('Fast')
    click('Play')
    await vi.advanceTimersByTimeAsync(60_000)
    flushSync()
    expect(target.textContent).toContain('shortcuts found')
    expect(target.textContent).toContain('Watch again')
  })

  it('Floyd–Warshall demo pauses', async () => {
    app = mount(FloydDemo, { target, props: { model } })
    flushSync()
    click('Play')
    await vi.advanceTimersByTimeAsync(500)
    flushSync()
    click('Pause')
    const at = target.textContent?.match(/Shortcut (\d+) of/)?.[1]
    await vi.advanceTimersByTimeAsync(2000)
    flushSync()
    expect(target.textContent?.match(/Shortcut (\d+) of/)?.[1]).toBe(at)
  })

  it('Nearest Neighbor demo keeps visiting stops after Play', async () => {
    app = mount(TourDemo, { target, props: { model, selected: selectionOf(PRESETS[0].nodes), setSelected: () => {} } })
    flushSync()
    expect(target.querySelectorAll('.visited-list li').length).toBe(0)

    click('Play')
    await vi.advanceTimersByTimeAsync(1100 * 4 + 50)
    flushSync()

    // "Start:" line plus several stops revealed one after another
    expect(target.querySelectorAll('.visited-list li').length).toBeGreaterThan(3)
  })

  it('Nearest Neighbor demo finishes and offers to watch again', async () => {
    app = mount(TourDemo, { target, props: { model, selected: selectionOf(PRESETS[0].nodes), setSelected: () => {} } })
    flushSync()
    click('Play')
    await vi.advanceTimersByTimeAsync(1100 * 20)
    flushSync()
    expect(target.textContent).toContain('Tour complete.')
    expect(target.textContent).toContain('Watch again')
  })
})
