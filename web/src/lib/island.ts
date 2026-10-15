import data from '../data/island.json'

export type LatLng = [number, number]

// The coastline of Guimaras Island from OpenStreetMap (see scripts/fetch-island.mjs). The first ring is the main island.
export const islandRings = data.rings as unknown as LatLng[][]

// [south-west, north-east] corners of the island
export const islandBounds: [LatLng, LatLng] = [
  [data.bounds.minlat, data.bounds.minlon],
  [data.bounds.maxlat, data.bounds.maxlon],
]

// How far past the island (in degrees, about 11 km) the map may be dragged before it stops.
export const PAN_LIMIT = 0.1
