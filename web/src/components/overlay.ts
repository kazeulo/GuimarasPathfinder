export interface Segment {
  a: number
  b: number
  cls: string
}

// What a page wants drawn on top of the base map.
export interface Overlay {
  nodeClass?: Record<number, string>
  segments?: Segment[]
  badges?: Record<number, string>
  labels?: number[]
}
