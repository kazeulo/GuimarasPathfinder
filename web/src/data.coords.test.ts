import { describe, expect, it } from 'vitest'
import { COORDS, ENTRIES, PLACES } from './data'

// Straight-line distance in km between two [lat, lng] points.
const km = ([la1, lo1]: [number, number], [la2, lo2]: [number, number]) => {
  const rad = (d: number) => (d * Math.PI) / 180
  const h =
    Math.sin(rad(la2 - la1) / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

describe('map positions agree with the SP road distances', () => {
  const g = ENTRIES.wharf.graph
  const pos = (i: number) => (i === 0 ? ENTRIES.wharf.latlng : COORDS[i])

  it('has a position for every place, all on Guimaras', () => {
    expect(COORDS).toHaveLength(PLACES.length)
    for (const [lat, lng] of COORDS) {
      expect(lat).toBeGreaterThan(10.35)
      expect(lat).toBeLessThan(10.85)
      expect(lng).toBeGreaterThan(122.35)
      expect(lng).toBeLessThan(122.8)
    }
  })

  // A road can never be shorter than the straight line between its ends. If this fails, a pin (or an SP distance) is wrong.
  it('no road in the SP is shorter than the straight line between its two places', () => {
    const impossible: string[] = []
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) {
        const road = g[i][j]
        if (road === null) continue
        const straight = km(pos(i), pos(j))
        if (straight > road * 1.03 + 0.1) impossible.push(`${i + 1}-${j + 1}: straight ${straight.toFixed(2)} > road ${road}`)
      }
    expect(impossible).toEqual([])
  })

  it('roads are plausibly winding, not absurdly longer than the straight line', () => {
    const odd: string[] = []
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) {
        const road = g[i][j]
        if (road === null) continue
        const ratio = road / km(pos(i), pos(j))
        if (ratio > 3) odd.push(`${i + 1}-${j + 1}: ratio ${ratio.toFixed(2)}`)
      }
    expect(odd).toEqual([])
  })
})
