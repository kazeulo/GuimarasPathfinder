<script lang="ts">
  import { fmtNum, formatMinutes, reconstructPath, toMinutes } from '../algo/helpers'
  import { PRESETS, SPEED_KMH, placeName, selectionOf } from '../data'
  import { planTour } from '../lib/trip'
  import type { Model } from '../model'
  import MapView from './MapView.svelte'
  import type { Overlay, Segment } from './overlay'

  interface Props {
    model: Model
    selected: boolean[]
    setSelected: (s: boolean[]) => void
  }

  let { model, selected, setSelected }: Props = $props()

  const STEP_MS = 1100

  const entry = $derived(model.entry)
  const fw = $derived(model.fw)
  const tour = $derived(planTour(fw, selected))

  let shown = $state(0) // how many steps of the tour are revealed
  let playing = $state(false)

  const total = $derived(tour.steps.length)
  const finished = $derived(total > 0 && shown >= total)
  const revealed = $derived(tour.steps.slice(0, shown))
  const next = $derived(!finished && total > 0 ? tour.steps[shown] : null)
  const allPlaces = $derived(selected.slice(1).every(Boolean))
  const km = $derived(revealed.reduce((s, st) => s + st.d, 0))

  $effect(() => {
    if (!playing) return
    if (finished) {
      playing = false
      return
    }
    const id = setTimeout(() => {
      shown += 1
    }, STEP_MS)
    return () => clearTimeout(id)
  })

  const restart = () => {
    playing = false
    shown = 0
  }
  const pick = (nodes: number[]) => {
    setSelected(selectionOf(nodes))
    restart()
  }
  const toggle = () => {
    if (finished) {
      shown = 0
      playing = true
    } else {
      playing = !playing
    }
  }

  const overlay: Overlay = $derived.by(() => {
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
    return { segments, badges, nodeClass, labels }
  })
</script>

<div class="split demo">
  <MapView graph={entry.graph} {entry} {overlay} />
  <div class="stack">
    <div class="card">
      {#if total === 0}
        <p class="demo-head">Choose some places first.</p>
        <p class="demo-detail">Pick a ready-made trip below, or choose your own on the <a href="#plan">Plan a trip</a> page.</p>
      {:else if next}
        {#if next.isReturn}
          <p class="demo-head" aria-live="polite">Every place has been visited.</p>
          <p class="demo-detail">Time to head back to {entry.label}: {fmtNum(next.d)} km along the shortest road.</p>
        {:else}
          <p class="demo-head" aria-live="polite">Next stop: the closest place not yet visited</p>
          <p class="demo-detail">
            From <strong>{placeName(next.from, entry)}</strong>, the places still to visit are, nearest first:
          </p>
          <ol class="cands">
            {#each next.candidates.slice(0, 5) as c, idx (c.v)}
              <li class={{ best: idx === 0 }}>{placeName(c.v, entry)} <span>{fmtNum(c.d)} km</span></li>
            {/each}
            {#if next.candidates.length > 5}
              <li class="more">and {next.candidates.length - 5} farther away</li>
            {/if}
          </ol>
        {/if}
      {:else}
        <p class="demo-head" aria-live="polite">Tour complete.</p>
        <p class="demo-detail">
          {fmtNum(km)} km of driving, about {formatMinutes(toMinutes(km, SPEED_KMH))}.
          {#if allPlaces}This is the SP route for all 14 places.{/if}
        </p>
      {/if}

      <div class="player">
        <button type="button" class="btn primary" disabled={total === 0} onclick={toggle}>
          {finished ? 'Watch again' : playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" class="btn" disabled={finished || total === 0} onclick={() => (shown += 1)}>Next stop</button>
        <button type="button" class="btn ghost" disabled={shown === 0} onclick={restart}>Start over</button>
      </div>
    </div>

    {#if revealed.length > 0}
      <div class="card">
        <h3 class="mini">Route so far</h3>
        <ol class="visited-list">
          <li class="port">Start: {entry.label}</li>
          {#each revealed as st, idx (idx)}
            <li class={{ back: st.isReturn }}>
              {st.isReturn ? `Back to ${entry.label}` : placeName(st.to, entry)} <span>{fmtNum(st.d)} km</span>
            </li>
          {/each}
        </ol>
      </div>
    {/if}

    <div class="card">
      <p class="muted small">Try it with a different set of places:</p>
      <div class="chips">
        {#each PRESETS as p (p.id)}
          <button type="button" class="chip" onclick={() => pick(p.nodes)}>{p.label}</button>
        {/each}
      </div>
    </div>
  </div>
</div>
