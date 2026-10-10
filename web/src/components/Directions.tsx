import { useState } from 'react'
import { fmtNum, reconstructPath } from '../algo/helpers'
import { PLACES, SPEED_KMH, placeName } from '../data'
import { duration } from '../lib/trip'
import type { Model } from '../model'

// "How do I get from A to B?" — the shortest route from the finished distance table.
export function Directions({ model }: { model: Model }) {
  const { entry, fw } = model
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(10)

  const path = reconstructPath(fw.prev, from, to)
  const km = fw.dist[from][to]
  const options = PLACES.map((_, i) => (
    <option key={i} value={i}>
      {placeName(i, entry)}
    </option>
  ))

  return (
    <div className="directions">
      <div className="pickers">
        <label>
          From
          <select value={from} onChange={(e) => setFrom(Number(e.target.value))}>{options}</select>
        </label>
        <button type="button" className="swap" onClick={() => { setFrom(to); setTo(from) }} aria-label="Swap start and destination">
          ⇄
        </button>
        <label>
          To
          <select value={to} onChange={(e) => setTo(Number(e.target.value))}>{options}</select>
        </label>
      </div>

      {from === to ? (
        <p className="muted">Pick two different places.</p>
      ) : path.length === 0 ? (
        <p className="muted">There is no road connection between these two places.</p>
      ) : (
        <div className="route-card">
          <ol className="route-list">
            {path.map((v) => (
              <li key={v}>{placeName(v, entry)}</li>
            ))}
          </ol>
          <p className="route-total">
            <strong>{fmtNum(km)} km</strong> · about {duration((km / SPEED_KMH) * 60)} by road
          </p>
        </div>
      )}
    </div>
  )
}
