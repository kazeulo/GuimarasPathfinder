// One-time script: fetches the shape of every direct road in the SP's network from the public OSRM
// demo server (OpenStreetMap data) and saves them to src/data/roads.json, so the website never has to
// call a routing service itself.
//
//   node scripts/fetch-roads.mjs
//
// The SP's distances (Google Maps) stay the source of truth for every figure shown on the site; these
// shapes are only for drawing the roads on the map. The OSRM distance is printed next to the SP's so
// you can see where the two disagree.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ts from 'typescript'

// data.ts is TypeScript: transpile it to a temporary module so this script reuses the real graph and positions.
const src = await readFile(new URL('../src/data.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const tmp = join(tmpdir(), `guimaras-data-${Date.now()}.mjs`)
await writeFile(tmp, js)
const { ENTRIES, COORDS } = await import(pathToFileURL(tmp).href)

const graph = ENTRIES.wharf.graph
const pos = (i) => (i === 0 ? ENTRIES.wharf.latlng : COORDS[i])

// Douglas–Peucker: drop points that don't change the shape by more than `tolMeters`.
const toXY = ([lat, lng], lat0) => [lng * 111320 * Math.cos((lat0 * Math.PI) / 180), lat * 110540]
function simplify(points, tolMeters) {
  if (points.length < 3) return points
  const lat0 = points[0][0]
  const xy = points.map((p) => toXY(p, lat0))
  const keep = new Array(points.length).fill(false)
  keep[0] = keep[points.length - 1] = true
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = xy[a]
    const [bx, by] = xy[b]
    const len = Math.hypot(bx - ax, by - ay) || 1
    let max = 0
    let idx = -1
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((by - ay) * xy[i][0] - (bx - ax) * xy[i][1] + bx * ay - by * ax) / len
      if (d > max) [max, idx] = [d, i]
    }
    if (max > tolMeters && idx > -1) {
      keep[idx] = true
      stack.push([a, idx], [idx, b])
    }
  }
  return points.filter((_, i) => keep[i])
}

const round = (n) => Math.round(n * 1e5) / 1e5
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const edges = []
for (let i = 0; i < graph.length; i++) for (let j = i + 1; j < graph.length; j++) if (graph[i][j] !== null) edges.push([i, j])
console.log(`Fetching ${edges.length} roads from the OSRM demo server (about ${Math.ceil(edges.length * 1.2)} s)...\n`)

const roads = {}
const report = []
for (const [i, j] of edges) {
  const [la1, lo1] = pos(i)
  const [la2, lo2] = pos(j)
  const url = `https://router.project-osrm.org/route/v1/driving/${lo1},${la1};${lo2},${la2}?overview=full&geometries=geojson`
  let line = null
  let osrmKm = null
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'GuimarasPathfinder-student-project (one-time road shape fetch)' } })
    const data = await res.json()
    if (data.code === 'Ok') {
      const pts = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
      line = simplify(pts, 8).map(([la, lo]) => [round(la), round(lo)])
      osrmKm = data.routes[0].distance / 1000
    }
  } catch (e) {
    /* leave null: the map falls back to a straight line for this road */
  }
  if (line) roads[`${i}-${j}`] = line
  report.push({ i, j, sp: graph[i][j], osrm: osrmKm, pts: line ? line.length : 0 })
  console.log(`${String(i + 1).padStart(2)}-${String(j + 1).padEnd(2)} SP ${String(graph[i][j]).padStart(5)} km | OSRM ${osrmKm === null ? '  --  ' : osrmKm.toFixed(2).padStart(6)} km | ${line ? line.length + ' points' : 'NOT FOUND'}`)
  await sleep(1100)
}

const outDir = new URL('../src/data/', import.meta.url)
await mkdir(outDir, { recursive: true })
await writeFile(
  new URL('roads.json', outDir),
  JSON.stringify({ source: 'OSRM demo server (router.project-osrm.org), OpenStreetMap data', fetched: new Date().toISOString().slice(0, 10), roads }),
)

const missing = report.filter((r) => !r.pts)
const far = report.filter((r) => r.osrm !== null && Math.abs(r.osrm - r.sp) / r.sp > 0.3)
console.log(`\nSaved ${Object.keys(roads).length} of ${edges.length} roads to src/data/roads.json`)
if (missing.length) console.log(`Not found (will be drawn straight): ${missing.map((r) => `${r.i + 1}-${r.j + 1}`).join(', ')}`)
if (far.length) console.log(`OSRM differs from the SP by more than 30%: ${far.map((r) => `${r.i + 1}-${r.j + 1}`).join(', ')}`)
