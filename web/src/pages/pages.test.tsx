import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { engine } from '../algo'
import { ENTRIES, PRESETS, selectionOf, type EntryKey } from '../data'
import type { Model } from '../model'
import { AboutPage } from './AboutPage'
import { HowPage } from './HowPage'
import { PlanPage } from './PlanPage'

const model = (entryKey: EntryKey): Model => ({
  entryKey,
  entry: ENTRIES[entryKey],
  fw: engine.floydWarshall(ENTRIES[entryKey].graph),
})
const noop = () => {}

describe.each(['wharf', 'roro'] as const)('pages render without crashing (%s)', (key) => {
  it('Plan page shows the three steps, a timetable and the verdict', () => {
    const html = renderToString(
      <PlanPage model={model(key)} setEntryKey={noop} selected={selectionOf(PRESETS[0].nodes)} setSelected={noop} />,
    )
    expect(html).toContain('Where does your trip start?')
    expect(html).toContain('What would you like to see?')
    expect(html).toContain('Your trip')
    expect(html).toContain('This fits')
    expect(html).toContain('Back at')
  })

  it('Plan page with nothing chosen guides the user instead of showing an empty result', () => {
    const html = renderToString(<PlanPage model={model(key)} setEntryKey={noop} selected={selectionOf([])} setSelected={noop} />)
    expect(html).toContain('Choose at least one place')
  })

  it('How it works page has both demos and the technical section', () => {
    const html = renderToString(<HowPage model={model(key)} selected={selectionOf(PRESETS[4].nodes)} setSelected={noop} />)
    expect(html).toContain('Press play to watch it work')
    expect(html).toContain('closest place not yet visited')
    expect(html).toContain('For technical readers')
  })
})

describe('About page', () => {
  it('shows the live check, flagging the two totals that differ from the SP', () => {
    const html = renderToString(<AboutPage />)
    expect(html).toContain('118.85 km')
    expect(html).toContain('Matches')
    expect(html).toContain('Differs')
    expect(html).toContain('21 h 58.28 min')
  })

  it('states plainly that the algorithm is verified but the website is not', () => {
    const html = renderToString(<AboutPage />)
    expect(html).toContain('The algorithm is verified.')
    expect(html).toContain('This website is not verified.')
  })
})
