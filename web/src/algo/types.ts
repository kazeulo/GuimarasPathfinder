// The contract between the UI and whatever computes the algorithms.
// `ts-engine.ts` implements it in TypeScript; a Rust/WASM engine can implement
// the same interface and be swapped in from `index.ts` without touching the UI.

export type Graph = (number | null)[][] // null = no direct road (INF)
export type Dist = number[][] // Infinity = unreachable

export interface FwEvent {
  k: number
  i: number
  j: number
  old: number
  val: number
}

export interface FwResult {
  initial: Dist
  dist: Dist
  prev: (number | null)[][]
  events: FwEvent[] // every strict improvement, in the order the algorithm made it
}

export interface TourStep {
  from: number
  to: number
  d: number
  candidates: { v: number; d: number }[] // unvisited nodes, nearest first
  isReturn: boolean
}

export interface TourResult {
  order: number[]
  steps: TourStep[]
  total: number
  complete: boolean // false if some stop was unreachable
}

export interface Engine {
  name: string
  floydWarshall(graph: Graph): FwResult
  nearestNeighbor(dist: Dist, start: number, stops: number[], returnToStart: boolean): TourResult
}
