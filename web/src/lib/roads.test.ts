import { describe, expect, it } from 'vitest'
import { COORDS, ENTRIES } from '../data'
import { roadCount, roadPath } from './roads'

const km = ([la1, lo1]: [number, number], [la2, lo2]: [number, number]) => {
  const rad = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(rad(la2 - la1) / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}
const pos = (i: number) => (i === 0 ? ENTRIES.wharf.latlng : COORDS[i])
const g = ENTRIES.wharf.graph

describe('road shapes for the map', () => {
  const edges: [number, number][] = []
  for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) if (g[i][j] !== null) edges.push([i, j])

  it('has a shape for every direct road in the SP network, and no extras', () => {
    expect(roadCount).toBe(edges.length)
    for (const [a, b] of edges) expect(roadPath(a, b), `road ${a + 1}-${b + 1}`).not.toBeNull()
  })

  it('has no shape for places with no direct road', () => {
    expect(roadPath(0, 14)).toBeNull() // port to Pitstop: not a direct road in the SP
  })

  it('every road starts and ends next to its two places', () => {
    // Roads are snapped to the nearest street. SEAFDEC's Igang station sits on islets and a pier, so its nearest street is
    // about 1.2 km away; every other pin is within 0.3 km of a street.
    const SEAFDEC = 8
    const allowed = (i: number) => (i === SEAFDEC ? 1.5 : 0.5)
    for (const [a, b] of edges) {
      const road = roadPath(a, b)!
      expect(road.length).toBeGreaterThanOrEqual(2)
      expect(km(road[0], pos(a)), `road ${a + 1}-${b + 1} start`).toBeLessThan(allowed(a))
      expect(km(road[road.length - 1], pos(b)), `road ${a + 1}-${b + 1} end`).toBeLessThan(allowed(b))
    }
  })

  it('can be read in either direction', () => {
    expect(roadPath(4, 0)).toEqual([...roadPath(0, 4)!].reverse()) // Smallest Plaza <-> port
  })
})
