import { useMemo, useState } from 'react'
import { reconstructPath, fmtNum } from '../algo/helpers'
import { Directions } from '../components/Directions'
import { MapView, type Overlay, type Segment } from '../components/MapView'
import { ENTRIES, PLACES, PRESETS, kindOf, placeName, selectionOf, type EntryKey } from '../data'
import { buildSchedule, clock, duration, planTour } from '../lib/trip'
import type { Model } from '../model'

interface Props {
  model: Model
  setEntryKey: (k: EntryKey) => void
  selected: boolean[]
  setSelected: (s: boolean[]) => void
}

const ENTRY_COPY: Record<EntryKey, string> = {
  wharf: 'Arriving by ferry on foot, without a vehicle.',
  roro: 'Bringing your own car or motorbike on the RoRo ferry.',
}

const HOURS = [
  { h: 6, label: 'Half day' },
  { h: 10, label: 'Full day' },
  { h: 20, label: 'Two days' },
]

const START_TIMES = Array.from({ length: 13 }, (_, i) => 5 * 60 + i * 60) // 5 AM .. 5 PM

export function PlanPage({ model, setEntryKey, selected, setSelected }: Props) {
  const { entry, fw } = model
  const [hours, setHours] = useState(10)
  const [startMin, setStartMin] = useState(8 * 60)

  const tour = useMemo(() => planTour(fw, selected), [fw, selected])
  const schedule = useMemo(() => buildSchedule(tour, startMin), [tour, startMin])
  const count = selected.slice(1).filter(Boolean).length
  const budget = hours * 60
  const ready = count > 0 && tour.complete

  const toggle = (i: number) => {
    if (i === 0) return
    setSelected(selected.map((s, k) => (k === i ? !s : s)))
  }

  // ---- map ----
  const segments: Segment[] = []
  const badges: Record<number, string> = {}
  const nodeClass: Record<number, string> = { 0: 'src' }
  for (let i = 1; i < PLACES.length; i++) nodeClass[i] = selected[i] ? 'sel' : 'off'
  let n = 0
  for (const leg of schedule.legs) {
    const p = reconstructPath(fw.prev, leg.from, leg.to)
    for (let q = 1; q < p.length; q++) {
      segments.push({ a: p[q - 1], b: p[q], cls: leg.isReturn ? 'seg-leg seg-return' : 'seg-leg' })
    }
    if (!leg.isReturn) {
      n += 1
      badges[leg.to] = String(n)
      nodeClass[leg.to] = 'visited'
    }
  }
  const overlay: Overlay = {
    segments,
    badges,
    nodeClass,
    labels: Array.from({ length: PLACES.length }, (_, i) => i).filter((i) => i === 0 || selected[i]),
  }

  return (
    <div className="split">
      <MapView graph={entry.graph} entry={entry} overlay={overlay} onNodeClick={toggle} />

      <div className="stack">
        <section className="card">
          <h2><span className="stepno">1</span> Where does your trip start?</h2>
          <div className="choice-grid" role="radiogroup" aria-label="Starting point">
            {(Object.keys(ENTRIES) as EntryKey[]).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={model.entryKey === key}
                className={`choice ${model.entryKey === key ? 'on' : ''}`}
                onClick={() => setEntryKey(key)}
              >
                <strong>{ENTRIES[key].label}</strong>
                <span>{ENTRY_COPY[key]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2><span className="stepno">2</span> What would you like to see?</h2>
          <p className="muted">Tap places on the map or in the list. Not sure? Start with an idea:</p>
          <div className="chips">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className="chip" onClick={() => setSelected(selectionOf(p.nodes))}>
                {p.label}
              </button>
            ))}
            <button type="button" className="chip ghost" onClick={() => setSelected(selectionOf([]))} disabled={count === 0}>
              Clear
            </button>
          </div>

          <ul className="places">
            {PLACES.slice(1).map((p, k) => {
              const i = k + 1
              return (
                <li key={i}>
                  <label className={selected[i] ? 'on' : ''}>
                    <input type="checkbox" checked={selected[i]} onChange={() => toggle(i)} />
                    <span className="pname">{p.name}</span>
                    <span className="pmeta">{kindOf(p)} · about {duration(p.stay)}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card">
          <h2><span className="stepno">3</span> Your trip</h2>

          {!ready ? (
            <p className="muted">
              {count === 0
                ? 'Choose at least one place above and your route will appear here.'
                : 'Some of the chosen places cannot be reached by road from the port.'}
            </p>
          ) : (
            <>
              <div className="when">
                <label>
                  Leave {entry.label} at
                  <select value={startMin} onChange={(e) => setStartMin(Number(e.target.value))}>
                    {START_TIMES.map((t) => (
                      <option key={t} value={t}>{clock(t)}</option>
                    ))}
                  </select>
                </label>
                <div className="hours">
                  <span>Time you have</span>
                  <div className="chips tight">
                    {HOURS.map((o) => (
                      <button key={o.h} type="button" className={`chip ${hours === o.h ? 'on' : ''}`} onClick={() => setHours(o.h)}>
                        {o.label} · {o.h} h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`verdict ${schedule.totalMin <= budget ? 'ok' : 'over'}`} aria-live="polite">
                {schedule.totalMin <= budget ? (
                  <>
                    <strong>This fits.</strong> The trip takes {duration(schedule.totalMin)}, leaving {duration(budget - schedule.totalMin)} to spare.
                  </>
                ) : (
                  <>
                    <strong>Too long for {hours} h.</strong> The trip takes {duration(schedule.totalMin)}, which is {duration(schedule.totalMin - budget)} over.
                    Remove a place or two, or allow more time.
                  </>
                )}
              </div>

              <ol className="timeline">
                <li className="tl-start">
                  <span className="tl-time">{clock(startMin)}</span>
                  <span className="tl-what">Leave {entry.label}</span>
                </li>
                {schedule.legs.map((leg, idx) => (
                  <li key={idx} className={leg.isReturn ? 'tl-end' : 'tl-stop'}>
                    <span className="tl-drive">
                      {duration(leg.driveMin)} drive · {fmtNum(leg.km)} km
                    </span>
                    <span className="tl-time">{clock(leg.arrive)}</span>
                    <span className="tl-what">
                      {leg.isReturn ? (
                        <>Back at {entry.label}</>
                      ) : (
                        <>
                          <b>{placeName(leg.to, entry)}</b>
                          <small>stay about {duration(leg.stayMin)}, leave {clock(leg.leave)}</small>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ol>

              <dl className="totals">
                <div><dt>Driving</dt><dd>{duration(schedule.driveMin)}</dd><dd className="sub">{fmtNum(schedule.km)} km</dd></div>
                <div><dt>At the places</dt><dd>{duration(schedule.stayMin)}</dd></div>
                <div><dt>Whole trip</dt><dd>{duration(schedule.totalMin)}</dd></div>
              </dl>

              <p className="muted small">
                The order is chosen by always driving to the closest place you haven&rsquo;t visited yet.{' '}
                <a href="#how">How was this worked out?</a>
              </p>
            </>
          )}
        </section>

        <details className="card fold">
          <summary>Directions between two places</summary>
          <Directions key={model.entryKey} model={model} />
        </details>

        {model.entryKey === 'wharf' && (
          <details className="card fold">
            <summary>Getting around without your own vehicle</summary>
            <p className="muted">
              The SP found that tourists usually hire a tricycle, jeepney or van for the day, and can visit as many places as fit
              in that day:
            </p>
            <ul className="plain">
              <li><strong>Tricycle</strong> — about ₱1,800 per day, for fewer than 5 people</li>
              <li><strong>Jeepney</strong> — about ₱4,000 per day, for 15 to 20 people</li>
              <li><strong>Van</strong> — about ₱4,500 per day, up to 15 people</li>
            </ul>
            <p className="muted small">Prices are from the 2023 SP and may have changed &mdash; confirm locally.</p>
          </details>
        )}
      </div>
    </div>
  )
}
