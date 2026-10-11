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

describe('Plan page help for visitors', () => {
  const plan = (key: EntryKey) =>
    render(PlanPage, {
      props: { model: model(key), setEntryKey: noop, selected: selectionOf(PRESETS[0].nodes), setSelected: noop },
    }).body

  it('helps people who are not sure which starting point to pick', () => {
    expect(plan('wharf')).toContain('Not sure which?')
  })

  it('shows vehicle hire prices next to the trip total when starting from Jordan Wharf', () => {
    const body = plan('wharf')
    expect(body).toContain('Hiring a vehicle for the day')
    expect(body).toContain('₱1,800')
    expect(body).toContain('₱4,000')
    expect(body).toContain('₱4,500')
  })

  it('does not show hire prices for visitors bringing their own vehicle', () => {
    expect(plan('roro')).not.toContain('Hiring a vehicle for the day')
  })

  it('does not show hire prices when there is no trip yet', () => {
    const body = render(PlanPage, {
      props: { model: model('wharf'), setEntryKey: noop, selected: selectionOf([]), setSelected: noop },
    }).body
    expect(body).not.toContain('Hiring a vehicle for the day')
  })
})

describe('About page', () => {
  it('states plainly that the calculations are verified but the website is not', () => {
    const { body } = render(AboutPage, { props: {} })
    expect(body).toContain('The calculations are verified.')
    expect(body).toContain('This website is not verified.')
  })
})
