import { render } from 'svelte/server'
import { describe, expect, it } from 'vitest'
import { engine } from '../../src/algo'
import { ENTRIES, PRESETS, selectionOf, type EntryKey } from '../../src/data'
import type { Model } from '../../src/model'
import AboutPage from '../../src/pages/AboutPage.svelte'
import HowPage from '../../src/pages/HowPage.svelte'
import PlanPage from '../../src/pages/PlanPage.svelte'

const model = (entryKey: EntryKey): Model => ({
  entryKey,
  entry: ENTRIES[entryKey],
  fw: engine.floydWarshall(ENTRIES[entryKey].graph),
})
const noop = () => {}

describe.each(['wharf', 'roro'] as const)('pages render without crashing (%s)', (key) => {
  it('Plan page shows the place picker, a timetable and the verdict', () => {
    const { body } = render(PlanPage, {
      props: { model: model(key), selected: selectionOf(PRESETS[0].nodes), setSelected: noop },
    })
    expect(body).toContain('What would you like to see?')
    expect(body).toContain('Your trip')
    expect(body).toContain('This fits')
    expect(body).toContain('Back at')
  })

  it('Plan page with nothing chosen guides the user instead of showing an empty result', () => {
    const { body } = render(PlanPage, {
      props: { model: model(key), selected: selectionOf([]), setSelected: noop },
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

describe('Plan page for visitors', () => {
  const plan = (selected: boolean[]) =>
    render(PlanPage, { props: { model: model('wharf'), selected, setSelected: noop } }).body
  const photoBody = () => plan(selectionOf(PRESETS[0].nodes))
  it('keeps the list and timeline free of photos (they appear when a pin is clicked)', () => {
    const body = photoBody()
    expect(body).not.toContain('pthumb')
    expect(body).not.toContain('tl-thumb')
    expect(body).not.toContain('images/places/')
  })

  it('opens with the headline and one-line explanation', () => {
    const body = plan(selectionOf(PRESETS[0].nodes))
    expect(body).toContain('Plan a day in Guimaras')
    expect(body).toContain('Pick the places you want to see.')
    expect(body).toContain('tell you how long it takes.')
  })

  it('goes straight to choosing places, with no starting-point question', () => {
    const body = plan(selectionOf(PRESETS[0].nodes))
    expect(body).toContain('What would you like to see?')
    expect(body).not.toContain('Do you have your own vehicle?')
    expect(body).not.toContain('Not sure which?')
    expect(body).toContain('Leave Jordan Wharf at')
  })

  it('lists destinations from nearest to farthest from the port, with the distance', () => {
    const body = plan(selectionOf(PRESETS[0].nodes))
    const list = body.slice(body.indexOf('class="places"'))
    const order = ['Smallest Plaza', 'Guimaras Mountain Resort', 'Guimaras Landmark', 'Pitstop Restaurant', 'Trappist', 'Camp Alfredo',
      'Wind Farm', 'Playa de Paraiso', 'Sunrise Valley', 'Alobijod', 'Reyley', 'SEAFDEC', 'Tahi Beach', 'Bikers']
    const positions = order.map((name) => list.indexOf(name))
    expect(positions.every((x) => x > -1)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(list).toContain('1.2 km away') // Smallest Plaza
    expect(list).toContain('31.15 km away') // Bikers' Hill, the farthest
    expect(body).toContain('Listed from nearest to farthest from Jordan Wharf')
  })

  it('shows vehicle hire prices next to the trip total', () => {
    const body = plan(selectionOf(PRESETS[0].nodes))
    expect(body).toContain('Hiring a vehicle for the day')
    expect(body).toContain('₱1,800')
    expect(body).toContain('₱4,000')
    expect(body).toContain('₱4,500')
  })

  it('summarises the trip at the top of the panel (what a phone shows while the sheet is closed)', () => {
    const body = plan(selectionOf(PRESETS[0].nodes))
    expect(body).toContain('5 places')
    expect(body).toContain('fits your day')
    expect(plan(selectionOf([4]))).toContain('1 place')
    expect(plan(selectionOf([]))).toContain('Choose places to plan your day')
  })

  it('does not show hire prices when there is no trip yet', () => {
    expect(plan(selectionOf([]))).not.toContain('Hiring a vehicle for the day')
  })
})

describe('About page', () => {
  it('states plainly that the calculations are verified but the website is not', () => {
    const { body } = render(AboutPage, { props: {} })
    expect(body).toContain('The calculations are verified.')
    expect(body).toContain('This website is not verified.')
  })

  it('tells the story of the SP: why, what it set out to do, how, what it found', () => {
    const { body } = render(AboutPage, { props: {} })
    for (const heading of ['Why it was done', 'What it set out to do', 'How it was done', 'What it found']) expect(body).toContain(heading)
    expect(body).toContain('about 165,000') // visitors in 2021
    expect(body).toContain('118.85 km')
    expect(body).toContain('clearly not possible for a same-day visitor')
  })

  it('credits the authors and advisers, and says the site follows the SP’s own recommendation', () => {
    const { body } = render(AboutPage, { props: {} })
    expect(body).toContain('Bernardo')
    expect(body).toContain('Marierose R. Chavez')
    expect(body).toContain('This site follows that recommendation')
    expect(body).toContain('suits a small number of places')
  })

  it('explains why every trip starts at Jordan Wharf', () => {
    const { body } = render(AboutPage, { props: {} })
    expect(body).toContain('Where trips start')
    expect(body).toContain('Jordan Wharf')
  })
})
