import { useEffect, useMemo, useState } from 'react'
import { fmtNum } from '../algo/helpers'
import { placeName } from '../data'
import type { Model } from '../model'
import { MapView, type Overlay } from './MapView'
import { Matrix } from './Matrix'

const SPEEDS = [
  { label: 'Slow', perSec: 3 },
  { label: 'Normal', perSec: 10 },
  { label: 'Fast', perSec: 40 },
]

// Step 1 in plain words: the computer hunts for shortcuts through other places.
export function FloydDemo({ model }: { model: Model }) {
  const { entry, fw } = model
  const { events } = fw
  const n = fw.initial.length

  const [pos, setPos] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const dist = useMemo(() => {
    const d = fw.initial.map((row) => row.slice())
    for (let e = 0; e < pos; e++) d[events[e].i][events[e].j] = events[e].val
    return d
  }, [fw, events, pos])

  const done = pos >= events.length
  const last = pos > 0 ? events[pos - 1] : null

  const changed = useMemo(() => {
    const set = new Set<string>()
    if (!last) return set
    for (let e = pos - 1; e >= 0 && events[e].k === last.k; e--) set.add(`${events[e].i},${events[e].j}`)
    return set
  }, [events, pos, last])

  useEffect(() => {
    if (!playing) return
    if (done) {
      setPlaying(false)
      return
    }
    const id = setTimeout(() => setPos((p) => Math.min(p + 1, events.length)), 1000 / SPEEDS[speed].perSec)
    return () => clearTimeout(id)
  }, [playing, pos, done, speed, events.length])

  const overlay: Overlay = {}
  if (last) {
    const { i, j, k } = last
    overlay.nodeClass = { [k]: 'pivot', [i]: 'src', [j]: 'dst' }
    overlay.labels = [i, k, j]
    overlay.segments = [
      { a: i, b: k, cls: 'seg-via' },
      { a: k, b: j, cls: 'seg-via' },
      { a: i, b: j, cls: 'seg-new' },
    ]
  }

  let headline: string
  let detail: string
  if (!last) {
    headline = 'Press play to watch it work.'
    detail = 'The computer tries each place in turn as a stop-over and asks: would going through here make any trip shorter?'
  } else if (done) {
    headline = `Done — ${events.length} shortcuts found.`
    detail = 'Now it knows the shortest way between every pair of places, even pairs with no direct road.'
  } else {
    const [A, B, K] = [placeName(last.i, entry), placeName(last.j, entry), placeName(last.k, entry)]
    headline = `Trying ${K} as a stop-over (${last.k + 1} of ${n})`
    const a = fmtNum(dist[last.i][last.k])
    const b = fmtNum(dist[last.k][last.j])
    detail = `${A} → ${K} → ${B} is ${a} + ${b} = ${fmtNum(last.val)} km. ${
      last.old === Infinity ? 'Until now, no route between these two was known.' : `That beats the ${fmtNum(last.old)} km found so far.`
    }`
  }

  return (
    <div className="split demo">
      <MapView graph={entry.graph} entry={entry} overlay={overlay} />
      <div className="stack">
        <div className="card">
          <p className="demo-head" aria-live="polite">{headline}</p>
          <p className="demo-detail">{detail}</p>

          <div className="player">
            <button type="button" className="btn primary" onClick={() => (done ? (setPos(0), setPlaying(true)) : setPlaying((p) => !p))}>
              {done ? 'Watch again' : playing ? 'Pause' : 'Play'}
            </button>
            <input
              type="range"
              min={0}
              max={events.length}
              value={pos}
              onChange={(e) => { setPlaying(false); setPos(Number(e.target.value)) }}
              aria-label="Progress through the shortcut search"
            />
            <div className="seg-control" role="group" aria-label="Speed">
              {SPEEDS.map((s, idx) => (
                <button key={s.label} type="button" className={speed === idx ? 'on' : ''} onClick={() => setSpeed(idx)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <p className="muted small">Shortcut {pos} of {events.length}. <span className="key"><i className="dot a" /> start <i className="dot b" /> end <i className="dot c" /> stop-over</span></p>
        </div>

        <details className="card fold">
          <summary>Show the full distance table</summary>
          <p className="muted small">
            Each row and column is a place (numbered as on the map; hover for names). Each cell is the shortest known distance in km, and
            &infin; means no route known yet.
          </p>
          <Matrix values={dist} entry={entry} pivot={last ? last.k : null} changed={changed} last={last ? { i: last.i, j: last.j } : null} />
        </details>
      </div>
    </div>
  )
}
