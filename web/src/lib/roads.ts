import data from '../data/roads.json'

export type LatLng = [number, number]

// Road shapes from OpenStreetMap (see scripts/fetch-roads.mjs), keyed "a-b" with a < b.
const roads = data.roads as unknown as Record<string, LatLng[]>

// The shape of the direct road between two places, in the direction a -> b.
// Null if there is no direct road in the network.
export function roadPath(a: number, b: number): LatLng[] | null {
  const pts = roads[a < b ? `${a}-${b}` : `${b}-${a}`]
  if (!pts) return null
  return a < b ? pts : [...pts].reverse()
}

export const roadCount = Object.keys(roads).length
