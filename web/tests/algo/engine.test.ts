import { describe, expect, it } from 'vitest'
import { ENTRIES, PLACES } from '../../src/data'
import { formatMinutes, reconstructPath, toMinutes } from '../../src/algo/helpers'
import { engine } from '../../src/algo/index'

const all = Array.from({ length: 15 }, (_, i) => i)
const r2 = (x: number) => Math.round(x * 100) / 100

describe('Floyd-Warshall (Jordan Wharf)', () => {
  const fw = engine.floydWarshall(ENTRIES.wharf.graph)

  it('reproduces values from Table 4.1', () => {
    expect(r2(fw.dist[0][6])).toBe(31.15) // port -> Bikers' Hill
    expect(r2(fw.dist[5][12])).toBe(2.55) // Landmark -> Trappist
    expect(r2(fw.dist[10][1])).toBe(35.3) // Playa -> Alobijod
  })

  it('is symmetric and has a zero diagonal', () => {
    for (const i of all) {
      expect(fw.dist[i][i]).toBe(0)
      for (const j of all) expect(fw.dist[i][j]).toBeCloseTo(fw.dist[j][i], 9)
    }
  })

  it('rebuilds the return path 11 -> 8 -> 5 -> port', () => {
    expect(reconstructPath(fw.prev, 10, 0).map((x) => x + 1)).toEqual([11, 8, 5, 1])
  })

  it('logs events that replay to the final matrix', () => {
    const d = fw.initial.map((r) => r.slice())
    for (const e of fw.events) d[e.i][e.j] = e.val
    expect(d).toEqual(fw.dist)
  })
})

describe('Nearest Neighbor tour', () => {
  it('matches the paper for Jordan Wharf: 118.85 km, 2 h 58.28 min', () => {
    const fw = engine.floydWarshall(ENTRIES.wharf.graph)
    const t = engine.nearestNeighbor(fw.dist, 0, all, true)
    expect(t.order.map((x) => x + 1)).toEqual([1, 5, 8, 6, 15, 13, 12, 2, 9, 3, 7, 14, 4, 10, 11, 1])
    expect(r2(t.total)).toBe(118.85)
    expect(formatMinutes(toMinutes(t.total, 40))).toBe('2 h 58.28 min')
  })

  it('gives 119.05 km for RoRo (the paper reports 118.95, which disagrees with its own Table 4.2)', () => {
    const fw = engine.floydWarshall(ENTRIES.roro.graph)
    const t = engine.nearestNeighbor(fw.dist, 0, all, true)
    expect(r2(t.total)).toBe(119.05)
  })

  it('stay times sum to 19 h, not the total stated in the paper conclusion', () => {
    expect(PLACES.reduce((s, p) => s + p.stay, 0)).toBe(1140)
  })

  it('flags an incomplete tour when a stop is unreachable', () => {
    const g = ENTRIES.wharf.graph.map((r) => r.slice())
    for (let j = 0; j < 15; j++) if (j !== 2) g[2][j] = g[j][2] = null // isolate node 3
    const fw = engine.floydWarshall(g)
    expect(engine.nearestNeighbor(fw.dist, 0, all, true).complete).toBe(false)
  })
})
