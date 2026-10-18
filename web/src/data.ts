// Data from "Application of Floyd-Warshall Algorithm in Optimizing Tour Route for
// Selected Tourist Destinations in Guimaras Province" (UPV, 2023).
// Node 0 is the entry port; nodes 1..14 are the paper's v2..v15.
import type { Graph } from './algo/types'

const GRAPH_WHARF: Graph = [
  [0, null, null, null, 1.2, null, null, null, null, null, null, null, null, null, null],
  [null, 0, null, 26.3, null, null, 15.3, null, 7, null, null, 7.3, null, 24.1, null],
  [null, null, 0, null, null, null, 13.8, null, 3.9, null, null, null, null, null, null],
  [null, 26.3, null, 0, null, 16.3, 28.5, null, 28.9, 7.4, 11.6, 21.9, 17.7, 4.5, 15.9],
  [1.2, null, null, null, 0, 7.6, null, 4.1, null, null, null, null, null, 18.9, null],
  [null, null, null, 16.3, 7.6, 0, null, 8.9, null, null, 21.4, null, null, null, 0.35],
  [null, 15.3, 13.8, 28.5, null, null, 0, null, 11.3, 34.1, 39.3, 14.6, null, 26.3, null],
  [null, null, null, null, 4.1, 8.9, null, 0, null, 11.5, 14.4, null, null, 15.2, null],
  [null, 7, 3.9, 28.9, null, null, 11.3, null, 0, null, null, 10.1, null, 26.8, null],
  [null, null, null, 7.4, null, null, 34.1, 11.5, null, 0, 7, null, 19, 7.9, 17.2],
  [null, null, null, 11.6, null, 21.4, 39.3, 14.4, null, 7, 0, null, 22.8, 13.1, 21],
  [null, 7.3, null, 21.9, null, null, 14.6, null, 10.1, null, null, 0, 5.2, 18.4, null],
  [null, null, null, 17.7, null, null, null, null, null, 19, 22.8, 5.2, 0, 13.8, 2.2],
  [null, 24.1, null, 4.5, 18.9, null, 26.3, 15.2, 26.8, 7.9, 13.1, 18.4, 13.8, 0, 12.1],
  [null, null, null, 15.9, null, 0.35, null, null, null, 17.2, 21, null, 2.2, 12.1, 0],
]

// Jordan RoRo Port differs only in the port <-> Smallest Plaza edge (1.3 km, Table 3.3).
const GRAPH_RORO: Graph = GRAPH_WHARF.map((row) => row.slice())
GRAPH_RORO[0][4] = GRAPH_RORO[4][0] = 1.3

export type EntryKey = 'wharf' | 'roro'

export interface Entry {
  label: string
  latlng: [number, number] // where the port is on the map
  sub: string
  graph: Graph
  paperKm: number
  paperTravel: string
  note?: string
}

export const ENTRIES: Record<EntryKey, Entry> = {
  wharf: {
    label: 'Jordan Wharf',
    latlng: [10.667391, 122.588523], // OpenStreetMap ferry terminal
    sub: 'commuters',
    graph: GRAPH_WHARF,
    paperKm: 118.85,
    paperTravel: '2 h 58.28 min',
  },
  roro: {
    label: 'Jordan RoRo Port',
    latlng: [10.665828, 122.584754], // OpenStreetMap ferry terminal
    sub: 'own vehicle',
    graph: GRAPH_RORO,
    paperKm: 118.95,
    paperTravel: '2 h 58.43 min',
    note: 'The paper reports 118.95 km, but its own Table 4.2 (1.3 km out + 19.8 km back) adds up to 119.05 km, which is what is computed here.',
  },
}

export interface Place {
  n: number // the number shown on the map (the paper's v-number)
  name: string | null // null for the entry port; depends on the chosen entry
  cat: string
  stay: number // minutes (Tables 3.4 / 3.5)
}

// Photo file for a place (index into PLACES), or null for the port, which has none.
export const photoOf = (i: number): string | null =>
  i === 0
    ? null
    : `${import.meta.env.BASE_URL}images/places/${(PLACES[i].name as string)
        .toLowerCase()
        .replace(/'/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}.webp`

// What a visitor wants to know about each place. The SP gives only a category and a typical stay, so these short descriptions
// were compiled in October 2026 from public sources (travel sites, Wikipedia, the operators' own pages). Where little is
// published, the text says so instead of guessing. Keyed by index into PLACES.
export interface PlaceInfo {
  where?: string // town or barangay
  about: string
  note?: string // something to check before going
}

export const INFO: Record<number, PlaceInfo> = {
  1: {
    where: 'Alubihod, Nueva Valencia',
    about:
      'A small sandy cove on the southwest coast, with a few resorts along the shore. One of the best-known beaches on the island, and busy with locals on weekends and holidays. Often spelled Alubihod on maps.',
  },
  2: {
    where: 'Nueva Valencia',
    about: 'A beach on the southwest coast, next to Tahi Beach Resort. Very little is published about it, so check locally for what is available.',
  },
  3: {
    where: 'San Lorenzo',
    about: 'A farm stop in San Lorenzo. Very little is published about it, so check locally for what is on offer.',
  },
  4: {
    where: 'Jordan',
    about:
      'A tiny town plaza right by Jordan Wharf, where ferry passengers from Iloilo arrive. It is billed as one of the smallest plazas in the world, and has a small monument of José Rizal.',
  },
  5: {
    where: 'Near Jordan',
    about: 'The big GUIMARAS sign beside the road, a quick stop for a photo.',
  },
  6: {
    where: 'Nueva Valencia',
    about: 'A hilltop resort with a swimming pool and wide views over the sea.',
  },
  7: {
    where: 'Piña, Buenavista',
    about: 'A resort with rooms, beside the island’s ring road (the Guimaras Circumferential Road).',
  },
  8: {
    where: 'Igang, Nueva Valencia',
    about:
      'The Igang Marine Station of SEAFDEC’s Aquaculture Department: a research and training station for fish farming, built on small islets and floating cages joined by walkways.',
    note: 'Reported closed to tourists since 2018, to protect the breeding fish. Check before you go.',
  },
  9: {
    where: 'San Lorenzo',
    about:
      'A working wind farm of 27 turbines, each about 80 m tall. It started operating in 2014 and was the first wind farm in the Visayas.',
  },
  10: {
    where: 'San Enrique, San Lorenzo',
    about: 'A beach resort with a private beach, snorkelling and hiking trails.',
  },
  11: {
    where: 'Sibunag',
    about: 'A nature stop listed as a resort, also known as the Rogate Center of Pastoral Care for Vocations.',
  },
  12: {
    where: 'San Miguel, Jordan',
    about:
      'Our Lady of the Philippines Trappist Abbey, a working monastery founded in 1972 on 75 hectares of donated land. It has a retreat house, and the gift shop sells local products, especially mango snacks.',
  },
  13: {
    about: 'A resort with ocean views. No independent listing was found when this site was made, so check locally before you go.',
  },
  14: {
    where: 'San Miguel, Jordan',
    about: 'The original Pitstop restaurant, known for its mango pizza and other mango dishes.',
  },
}

export const PLACES: Place[] = [
  { n: 1, name: null, cat: 'Entry point', stay: 0 },
  { n: 2, name: 'Alobijod Beach Cove', cat: 'Sun and Beach', stay: 120 },
  { n: 3, name: 'Tahi Beach', cat: 'Sun and Beach', stay: 120 },
  { n: 4, name: 'Reyley Fish and Farm Haven', cat: 'Nature', stay: 60 },
  { n: 5, name: 'Smallest Plaza', cat: 'Cultural', stay: 45 },
  { n: 6, name: 'Guimaras Landmark', cat: 'Cultural', stay: 45 },
  { n: 7, name: "Bikers' Hill", cat: 'Leisure & Entertainment', stay: 120 },
  { n: 8, name: 'Guimaras Mountain Resort', cat: 'Leisure & Entertainment', stay: 120 },
  { n: 9, name: 'SEAFDEC', cat: 'Education', stay: 90 },
  { n: 10, name: 'Wind Farm', cat: 'Industrial', stay: 30 },
  { n: 11, name: 'Playa de Paraiso', cat: 'Sun and Beach', stay: 120 },
  { n: 12, name: 'Camp Alfredo', cat: 'Nature', stay: 60 },
  { n: 13, name: 'OLP Trappist Monastery', cat: 'Cultural', stay: 45 },
  { n: 14, name: 'Sunrise Valley Ocean View Resort', cat: 'Leisure & Entertainment', stay: 120 },
  { n: 15, name: 'Pitstop Restaurant', cat: 'Cultural', stay: 45 },
]

// Real positions [latitude, longitude] of the destinations, index-aligned with PLACES.
// Index 0 is the starting port, whose position depends on the chosen entry (see Entry.latlng).
export const COORDS: [number, number][] = [
  [10.667391, 122.588523], // 1  Jordan Wharf (placeholder, use Entry.latlng)
  [10.53475145850103, 122.51702143211782], // 2  Alobijod Beach Cove
  [10.484477616663833, 122.47613460142452], // 3  Tahi Beach
  [10.578206776680215, 122.68842836791544], // 4  Reyley Fish and Farm Haven
  [10.658786405857995, 122.5920595395367], // 5  Smallest Plaza
  [10.600161744354452, 122.58875949404211], // 6  Guimaras Landmark
  [10.436297455221801, 122.54348020141725], // 7  Bikers' Hill
  [10.654518996325281, 122.62594147076464], // 8  Guimaras Mountain Resort
  [10.51142595741658, 122.49940610142858], // 9  SEAFDEC
  [10.601080481570506, 122.70203814186314], // 10 Wind Farm
  [10.643529341917883, 122.72306243213443], // 11 Playa de Paraiso
  [10.54537977316567, 122.5628260241765], // 12 Camp Alfredo
  [10.57982899692564, 122.57679144006778], // 13 OLP Trappist Monastery
  [10.566928185572804, 122.666565908294], // 14 Sunrise Valley Ocean View Resort
  [10.59774665004695, 122.58801270144167], // 15 Pitstop Restaurant
]

// Approximate map positions traced from the paper's Figure 3.1 (SVG units).
// The tight cluster around the port is nudged apart so the markers stay readable.
export const POS: [number, number][] = [
  [497, 146], [396, 325], [343, 390], [620, 301], [490, 168], [484, 238], [430, 455], [537, 170],
  [378, 368], [625, 238], [662, 182], [452, 312], [470, 266], [588, 282], [500, 252],
]

export const SPEED_KMH = 40

// Vehicle hire per day, as collected from local drivers for the SP (Section 5.1).
export interface Vehicle {
  name: string
  who: string
  perDay: number // pesos
}
export const VEHICLES: Vehicle[] = [
  { name: 'Tricycle', who: 'fewer than 5 people', perDay: 1800 },
  { name: 'Jeepney', who: '15 to 20 people', perDay: 4000 },
  { name: 'Van', who: 'up to 15 people', perDay: 4500 },
]

export const REPO_URL ='https://github.com/kazeulo/GuimarasPathfinder'

// Friendlier wording for the SP categories (Table 3.1).
const KIND: Record<string, string> = {
  'Sun and Beach': 'Beach',
  Cultural: 'Culture & food',
  Nature: 'Nature & farms',
  'Leisure & Entertainment': 'Resort & leisure',
  Education: 'Education',
  Industrial: 'Industrial site',
}
export const kindOf = (p: Place): string => KIND[p.cat] ?? p.cat

// Ready-made trips for the planner (indexes into PLACES).
export interface Preset {
  id: string
  label: string
  nodes: number[]
}
export const PRESETS: Preset[] = [
  { id: 'half', label: 'Half-day near the port', nodes: [4, 5, 7, 12, 14] },
  { id: 'beach', label: 'Beaches', nodes: [1, 2, 10] },
  { id: 'culture', label: 'Culture & food', nodes: [4, 5, 12, 14] },
  { id: 'leisure', label: 'Resorts & leisure', nodes: [6, 7, 13] },
  { id: 'all', label: 'All 14 places', nodes: Array.from({ length: PLACES.length - 1 }, (_, i) => i + 1) },
]

export const selectionOf = (nodes: number[]): boolean[] => PLACES.map((_, i) => nodes.includes(i))

export const placeName = (i: number, entry: Entry): string =>
  i === 0 ? entry.label : (PLACES[i].name as string)
