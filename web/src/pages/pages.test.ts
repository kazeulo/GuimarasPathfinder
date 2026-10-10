import { render } from 'svelte/server'
import { describe, expect, it } from 'vitest'
import { engine } from '../algo'
import { ENTRIES, PRESETS, selectionOf, type EntryKey } from '../data'
import type { Model } from '../model'
import AboutPage from './AboutPage.svelte'
import HowPage from './HowPage.svelte'
import PlanPage from './PlanPage.svelte'

const model = (entryKey: EntryKey): Model => ({
  entryKey,
  entry: ENTRIES[entryKey],
  fw: engine.floydWarshall(ENTRIES[entryKey].graph),
})
const noop = () => {}

describe.each(['wharf', 'roro'] as const)('pages render without crashing (%s)', (key) => {
  it('Plan page shows the three steps, a timetable and the verdict', () => {
    const { body } = render(PlanPage, {
      props: { model: model(key), setEntryKey: noop, selected: selectionOf(PRESETS[0].nodes), setSelected: noop },
    })
    expect(body).toContain('Where does your trip start?')
    expect(body).toContain('What would you like to see?')
    expect(body).toContain('Your trip')
    expect(body).toContain('This fits')
    expect(body).toContain('Back at')
  })

  it('Plan page with nothing chosen guides the user instead of showing an empty result', () => {
    const { body } = render(PlanPage, {
      props: { model: model(key), setEntryKey: noop, selected: selectionOf([]), setSelected: noop },
    })
    expect(body).toContain('Choose at least one place')
  })

  it('How it works page has both demos and the technical section', () => {
    const { body } = render(HowPage, { props: { model: model(key), selected: selectionOf(PRESETS[4].nodes), setSelected: noop } })
    expect(body).toContain('Press play to watch it work')
    expect(body).toContain('closest place not yet visited')
    expect(body).toContain('For technical readers')
  })
})

describe('About page', () => {
  it('states plainly that the calculations are verified but the website is not', () => {
    const { body } = render(AboutPage, { props: {} })
    expect(body).toContain('The calculations are verified.')
    expect(body).toContain('This website is not verified.')
  })
})
