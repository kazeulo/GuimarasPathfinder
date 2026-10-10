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
  sub: string
  graph: Graph
  paperKm: number
  paperTravel: string
  note?: string
}

export const ENTRIES: Record<EntryKey, Entry> = {
  wharf: {
    label: 'Jordan Wharf',
    sub: 'commuters',
    graph: GRAPH_WHARF,
    paperKm: 118.85,
    paperTravel: '2 h 58.28 min',
  },
  roro: {
    label: 'Jordan RoRo Port',
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

// Approximate map positions traced from the paper's Figure 3.1 (SVG units).
// The tight cluster around the port is nudged apart so the markers stay readable.
export const POS: [number, number][] = [
  [497, 146], [396, 325], [343, 390], [620, 301], [490, 168], [484, 238], [430, 455], [537, 170],
  [378, 368], [625, 238], [662, 182], [452, 312], [470, 266], [588, 282], [500, 252],
]

export const SPEED_KMH = 40

export const REPO_URL = 'https://github.com/kazeulo/GuimarasPathfinder'

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
