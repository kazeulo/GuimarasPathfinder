<script lang="ts">
  import { fmtNum } from '../algo/helpers'
  import { placeName } from '../data'
  import type { Model } from '../model'
  import MapView from './MapView.svelte'
  import Matrix from './Matrix.svelte'
  import type { Overlay } from './overlay'

  interface Props {
    model: Model
  }

  let { model }: Props = $props()

  const SPEEDS = [
    { label: 'Slow', perSec: 3 },
    { label: 'Normal', perSec: 10 },
    { label: 'Fast', perSec: 40 },
  ]

  const entry = $derived(model.entry)
  const fw = $derived(model.fw)
  const events = $derived(fw.events)
  const n = $derived(fw.initial.length)

  let pos = $state(0) // how many shortcuts have been applied
  let playing = $state(false)
  let speed = $state(1)

  const dist = $derived.by(() => {
    const d = fw.initial.map((row) => row.slice())
    for (let e = 0; e < pos; e++) d[events[e].i][events[e].j] = events[e].val
    return d
  })

  const done = $derived(pos >= events.length)
  const last = $derived(pos > 0 ? events[pos - 1] : null)

  const changed = $derived.by(() => {
    const set = new Set<string>()
    if (!last) return set
    for (let e = pos - 1; e >= 0 && events[e].k === last.k; e--) set.add(`${events[e].i},${events[e].j}`)
    return set
  })

  // While playing, add one shortcut per tick until they are all shown.
  // (A repeating timer started once: reading `pos` here would restart it on every step.)
  $effect(() => {
    if (!playing) return
    const id = setInterval(() => {
      if (pos >= events.length) playing = false
      else pos += 1
    }, 1000 / SPEEDS[speed].perSec)
    return () => clearInterval(id)
  })

  const overlay: Overlay = $derived.by(() => {
    if (!last) return {}
    const { i, j, k } = last
    return {
      nodeClass: { [k]: 'pivot', [i]: 'src', [j]: 'dst' },
      labels: [i, k, j],
      segments: [
        { a: i, b: k, cls: 'seg-via' },
        { a: k, b: j, cls: 'seg-via' },
        { a: i, b: j, cls: 'seg-new' },
      ],
    }
  })

  const text = $derived.by(() => {
    if (!last) {
      return {
        headline: 'Press play to watch it work.',
        detail: 'The computer tries each place in turn as a stop-over and asks: would going through here make any trip shorter?',
      }
    }
    if (done) {
      return {
        headline: `Done — ${events.length} shortcuts found.`,
        detail: 'Now it knows the shortest way between every pair of places, even pairs with no direct road.',
      }
    }
    const [A, B, K] = [placeName(last.i, entry), placeName(last.j, entry), placeName(last.k, entry)]
    const a = fmtNum(dist[last.i][last.k])
    const b = fmtNum(dist[last.k][last.j])
    const verdict =
      last.old === Infinity ? 'Until now, no route between these two was known.' : `That beats the ${fmtNum(last.old)} km found so far.`
    return {
      headline: `Trying ${K} as a stop-over (${last.k + 1} of ${n})`,
      detail: `${A} → ${K} → ${B} is ${a} + ${b} = ${fmtNum(last.val)} km. ${verdict}`,
    }
  })

  const toggle = () => {
    if (done) {
      pos = 0
      playing = true
    } else {
      playing = !playing
    }
  }
</script>

<div class="split demo">
  <MapView graph={entry.graph} {entry} {overlay} />
  <div class="stack">
    <div class="card">
      <p class="demo-head" aria-live="polite">{text.headline}</p>
      <p class="demo-detail">{text.detail}</p>

      <div class="player">
        <button type="button" class="btn primary" onclick={toggle}>
          {done ? 'Watch again' : playing ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min="0"
          max={events.length}
          value={pos}
          oninput={(e) => {
            playing = false
            pos = Number(e.currentTarget.value)
          }}
          aria-label="Progress through the shortcut search"
        />
        <div class="seg-control" role="group" aria-label="Speed">
          {#each SPEEDS as s, idx (s.label)}
            <button type="button" class={{ on: speed === idx }} onclick={() => (speed = idx)}>{s.label}</button>
          {/each}
        </div>
      </div>
      <p class="muted small">
        Shortcut {pos} of {events.length}.
        <span class="key"><i class="dot a"></i> start <i class="dot b"></i> end <i class="dot c"></i> stop-over</span>
      </p>
    </div>

    <details class="card fold">
      <summary>Show the full distance table</summary>
      <p class="muted small">
        Each row and column is a place (numbered as on the map; hover for names). Each cell is the shortest known distance in km, and
        &infin; means no route known yet.
      </p>
      <Matrix values={dist} {entry} pivot={last ? last.k : null} {changed} last={last ? { i: last.i, j: last.j } : null} />
    </details>
  </div>
</div>
