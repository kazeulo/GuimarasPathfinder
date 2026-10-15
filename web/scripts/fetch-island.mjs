// One-time script: fetches the outline (coastline) of Guimaras Island from OpenStreetMap through the public
// Overpass API and saves a simplified version to src/data/island.json, so the website never has to ask for it.
//
//   node scripts/fetch-island.mjs
import { mkdir, writeFile } from 'node:fs/promises'

const query = '[out:json][timeout:60];relation["place"="island"]["name"="Guimaras Island"];out geom;'
const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'User-Agent': 'GuimarasPathfinder-student-project (one-time island outline fetch)', 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'data=' + encodeURIComponent(query),
})
if (!res.ok) throw new Error(`Overpass answered ${res.status}`)
const data = await res.json()
const relation = data.elements?.[0]
if (!relation) throw new Error('Guimaras Island was not found')

// An island outline arrives as many pieces of coastline. Join them end to end into closed rings.
const pieces = relation.members.filter((m) => m.type === 'way' && m.role === 'outer' && m.geometry?.length > 1).map((m) => m.geometry.map((p) => [p.lat, p.lon]))
const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9
const rings = []
while (pieces.length) {
  const ring = pieces.shift()
  let grew = true
  while (grew && !same(ring[0], ring[ring.length - 1])) {
    grew = false
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i]
      if (same(ring[ring.length - 1], p[0])) ring.push(...p.slice(1))
      else if (same(ring[ring.length - 1], p[p.length - 1])) ring.push(...[...p].reverse().slice(1))
      else if (same(ring[0], p[p.length - 1])) ring.unshift(...p.slice(0, -1))
      else if (same(ring[0], p[0])) ring.unshift(...[...p].reverse().slice(1))
      else continue
      pieces.splice(i, 1)
      grew = true
      break
    }
  }
  rings.push(ring)
}

// Douglas–Peucker: drop points that change the shape by less than `tolMeters`.
const toXY = ([lat, lng], lat0) => [lng * 111320 * Math.cos((lat0 * Math.PI) / 180), lat * 110540]
function simplify(points, tolMeters) {
  if (points.length < 4) return points
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
const out = rings
  .filter((r) => r.length > 8) // ignore slivers
  .map((r) => {
    // a closed ring starts and ends on the same point, so simplify it as two halves
    const mid = Math.floor(r.length / 2)
    const merged = [...simplify(r.slice(0, mid + 1), 30), ...simplify(r.slice(mid), 30).slice(1)]
    return merged.map(([la, lo]) => [round(la), round(lo)])
  })
  .sort((a, b) => b.length - a.length) // the main island first

const closed = out.filter((r) => same(r[0], r[r.length - 1])).length
console.log(`Joined ${relation.members.length} pieces into ${out.length} ring(s) (${closed} closed): ${out.map((r) => r.length + ' points').join(', ')}`)
console.log('Bounds:', JSON.stringify(relation.bounds))

const dir = new URL('../src/data/', import.meta.url)
await mkdir(dir, { recursive: true })
await writeFile(
  new URL('island.json', dir),
  JSON.stringify({ source: 'OpenStreetMap via the Overpass API (relation 3512054, Guimaras Island)', fetched: new Date().toISOString().slice(0, 10), bounds: relation.bounds, rings: out }),
)
