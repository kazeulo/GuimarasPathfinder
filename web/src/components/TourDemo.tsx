import { useEffect, useMemo, useState } from 'react'
import { fmtNum, formatMinutes, reconstructPath, toMinutes } from '../algo/helpers'
import { PRESETS, SPEED_KMH, placeName, selectionOf } from '../data'
import { planTour } from '../lib/trip'
import type { Model } from '../model'
import { MapView, type Overlay, type Segment } from './MapView'

const STEP_MS = 1100

interface Props {
  model: Model
  selected: boolean[]
  setSelected: (s: boolean[]) => void
}

// Step 2 in plain words: always go to the closest place not yet visited.
export function TourDemo({ model, selected, setSelected }: Props) {
  const { entry, fw } = model
  const tour = useMemo(() => planTour(fw, selected), [fw, selected])
  const [shown, setShown] = useState(0)
  const [playing, setPlaying] = useState(false)

  const total = tour.steps.length
  const finished = total > 0 && shown >= total
  const revealed = tour.steps.slice(0, shown)
  const next = !finished && total > 0 ? tour.steps[shown] : null
  const count = selected.slice(1).filter(Boolean).length
  const allPlaces = count === selected.length - 1

  useEffect(() => {
    if (!playing) return
    if (finished) {
      setPlaying(false)
      return
    }
    const id = setTimeout(() => setShown((s) => s + 1), STEP_MS)
    return () => clearTimeout(id)
  }, [playing, shown, finished])

  const restart = () => {
    setPlaying(false)
    setShown(0)
  }
  const pick = (nodes: number[]) => {
    setSelected(selectionOf(nodes))
    restart()
  }

  const km = revealed.reduce((s, st) => s + st.d, 0)

  // ---- map ----
  const segments: Segment[] = []
  const badges: Record<number, string> = {}
  const nodeClass: Record<number, string> = { 0: 'src' }
  for (let i = 1; i < selected.length; i++) nodeClass[i] = selected[i] ? 'sel' : 'off'
  let visit = 0
  for (const st of revealed) {
    const p = reconstructPath(fw.prev, st.from, st.to)
    for (let q = 1; q < p.length; q++) segments.push({ a: p[q - 1], b: p[q], cls: st.isReturn ? 'seg-leg seg-return' : 'seg-leg' })
    if (!st.isReturn) {
      visit += 1
      badges[st.to] = String(visit)
      nodeClass[st.to] = 'visited'
    }
  }
  const here = revealed.length ? revealed[revealed.length - 1].to : 0
  if (!finished && revealed.length) nodeClass[here] = 'current'
  const labels = [here]
  if (next) {
    labels.push(next.to)
    for (const c of next.candidates) segments.push({ a: next.from, b: c.v, cls: c.v === next.to ? 'seg-cand best' : 'seg-cand' })
  }
  const overlay: Overlay = { segments, badges, nodeClass, labels }

  return (
    <div className="split demo">
      <MapView graph={entry.graph} entry={entry} overlay={overlay} />
      <div className="stack">
        <div className="card">
          {total === 0 ? (
            <>
              <p className="demo-head">Choose some places first.</p>
              <p className="demo-detail">Pick a ready-made trip below, or choose your own on the <a href="#plan">Plan a trip</a> page.</p>
            </>
          ) : next ? (
            next.isReturn ? (
              <>
                <p className="demo-head" aria-live="polite">Every place has been visited.</p>
                <p className="demo-detail">
                  Time to head back to {entry.label}: {fmtNum(next.d)} km along the shortest road.
                </p>
              </>
            ) : (
              <>
                <p className="demo-head" aria-live="polite">Next stop: the closest place not yet visited</p>
                <p className="demo-detail">
                  From <strong>{placeName(next.from, entry)}</strong>, the places still to visit are, nearest first:
                </p>
                <ol className="cands">
                  {next.candidates.slice(0, 5).map((c, idx) => (
                    <li key={c.v} className={idx === 0 ? 'best' : ''}>
                      {placeName(c.v, entry)} <span>{fmtNum(c.d)} km</span>
                    </li>
                  ))}
                  {next.candidates.length > 5 && <li className="more">and {next.candidates.length - 5} farther away</li>}
                </ol>
              </>
            )
          ) : (
            <>
              <p className="demo-head" aria-live="polite">Tour complete.</p>
              <p className="demo-detail">
                {fmtNum(km)} km of driving, about {formatMinutes(toMinutes(km, SPEED_KMH))}.
                {allPlaces && ' This is the SP route for all 14 places.'}
              </p>
            </>
          )}

          <div className="player">
            <button
              type="button"
              className="btn primary"
              disabled={total === 0}
              onClick={() => (finished ? (setShown(0), setPlaying(true)) : setPlaying((p) => !p))}
            >
              {finished ? 'Watch again' : playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="btn" disabled={finished || total === 0} onClick={() => setShown((s) => s + 1)}>
              Next stop
            </button>
            <button type="button" className="btn ghost" disabled={shown === 0} onClick={restart}>
              Start over
            </button>
          </div>
        </div>

        {revealed.length > 0 && (
          <div className="card">
            <h3 className="mini">Route so far</h3>
            <ol className="visited-list">
              <li className="port">Start: {entry.label}</li>
              {revealed.map((st, idx) => (
                <li key={idx} className={st.isReturn ? 'back' : ''}>
                  {st.isReturn ? `Back to ${entry.label}` : placeName(st.to, entry)} <span>{fmtNum(st.d)} km</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="card">
          <p className="muted small">Try it with a different set of places:</p>
          <div className="chips">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className="chip" onClick={() => pick(p.nodes)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
