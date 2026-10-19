import { describe, expect, it } from 'vitest'
import { COORDS, ENTRIES } from '../../src/data'
import { PAN_LIMIT, islandBounds, islandRings, type LatLng } from '../../src/lib/island'

const insideRing = ([lat, lng]: LatLng, ring: LatLng[]) => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [y1, x1] = ring[i]
    const [y2, x2] = ring[j]
    if (y1 > lat !== y2 > lat && lng < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) inside = !inside
  }
  return inside
}

// Distance in km from a point to the nearest vertex of the coastline (the outline is dense enough for this to be a good measure).
const kmToCoast = ([lat, lng]: LatLng) => {
  let best = Infinity
  for (const ring of islandRings)
    for (const [y, x] of ring) {
      const dy = (lat - y) * 110.54
      const dx = (lng - x) * 111.32 * Math.cos((lat * Math.PI) / 180)
      best = Math.min(best, Math.hypot(dx, dy))
    }
  return best
}

const pins: [string, LatLng][] = COORDS.map((c, i): [string, LatLng] => (i === 0 ? ['Jordan Wharf', ENTRIES.wharf.latlng] : [`place ${i + 1}`, c]))

describe('the island outline', () => {
  it('is made of closed rings, with the main island first and far the largest', () => {
    for (const ring of islandRings) expect(ring[0]).toEqual(ring[ring.length - 1])
    expect(islandRings[0].length).toBeGreaterThan(500)
    expect(islandRings[0].length).toBeGreaterThan(islandRings[1]?.length ?? 0)
  })

  it('has bounds that match the outline', () => {
    const lats = islandRings.flat().map((p) => p[0])
    const lngs = islandRings.flat().map((p) => p[1])
    expect(Math.min(...lats)).toBeCloseTo(islandBounds[0][0], 2)
    expect(Math.max(...lats)).toBeCloseTo(islandBounds[1][0], 2)
    expect(Math.min(...lngs)).toBeCloseTo(islandBounds[0][1], 2)
    expect(Math.max(...lngs)).toBeCloseTo(islandBounds[1][1], 2)
  })

  // The wharf, some beaches and SEAFDEC's pier sit right on the shore, so a pin may land a few metres into the sea.
  it.each(pins)('%s is on the island, or right on its coast', (_name, pin) => {
    const onIsland = islandRings.some((r) => insideRing(pin, r))
    expect(onIsland || kmToCoast(pin) < 0.5).toBe(true)
  })

  it('leaves room to pan a little past the coast, but not far', () => {
    expect(PAN_LIMIT).toBeGreaterThan(0.03)
    expect(PAN_LIMIT).toBeLessThan(0.3)
  })
})
