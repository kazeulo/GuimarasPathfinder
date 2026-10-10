import type { Dist, Engine, FwEvent, FwResult, Graph, TourResult, TourStep } from './types'

const INF = Infinity

export const tsEngine: Engine = {
  name: 'TypeScript',

  floydWarshall(graph: Graph): FwResult {
    const n = graph.length
    const initial: Dist = graph.map((row) => row.map((w) => (w === null ? INF : w)))
    const dist = initial.map((row) => row.slice())
    const prev: (number | null)[][] = initial.map((row, i) =>
      row.map((w, j) => (i === j || w === INF ? null : i)),
    )
    const events: FwEvent[] = []

    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const via = dist[i][k] + dist[k][j]
          if (dist[i][j] > via) {
            events.push({ k, i, j, old: dist[i][j], val: via })
            dist[i][j] = via
            prev[i][j] = prev[k][j]
          }
        }
      }
    }
    return { initial, dist, prev, events }
  },

  nearestNeighbor(dist, start, stops, returnToStart): TourResult {
    const unvisited = new Set(stops.filter((s) => s !== start))
    const order = [start]
    const steps: TourStep[] = []

    while (unvisited.size) {
      const from = order[order.length - 1]
      const candidates = [...unvisited]
        .map((v) => ({ v, d: dist[from][v] }))
        .sort((a, b) => a.d - b.d)
      if (candidates[0].d === INF) break
      steps.push({ from, to: candidates[0].v, d: candidates[0].d, candidates, isReturn: false })
      order.push(candidates[0].v)
      unvisited.delete(candidates[0].v)
    }

    const complete = unvisited.size === 0
    if (returnToStart && complete && order.length > 1) {
      const from = order[order.length - 1]
      steps.push({ from, to: start, d: dist[from][start], candidates: [], isReturn: true })
      order.push(start)
    }
    const total = steps.reduce((sum, s) => sum + s.d, 0)
    return { order, steps, total, complete }
  },
}
