<script lang="ts">
  import { fmtNum, reconstructPath } from '../algo/helpers'
  import Directions from '../components/Directions.svelte'
  import MapView from '../components/MapView.svelte'
  import type { Overlay, Segment } from '../components/overlay'
  import { ENTRIES, PLACES, PRESETS, kindOf, placeName, selectionOf, type EntryKey } from '../data'
  import { buildSchedule, clock, duration, planTour } from '../lib/trip'
  import type { Model } from '../model'

  interface Props {
    model: Model
    setEntryKey: (k: EntryKey) => void
    selected: boolean[]
    setSelected: (s: boolean[]) => void
  }

  let { model, setEntryKey, selected, setSelected }: Props = $props()

  const ENTRY_KEYS = Object.keys(ENTRIES) as EntryKey[]
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

  let hours = $state(10)
  let startMin = $state(8 * 60)

  const entry = $derived(model.entry)
  const fw = $derived(model.fw)
  const tour = $derived(planTour(fw, selected))
  const schedule = $derived(buildSchedule(tour, startMin))
  const count = $derived(selected.slice(1).filter(Boolean).length)
  const budget = $derived(hours * 60)
  const ready = $derived(count > 0 && tour.complete)
  const fits = $derived(schedule.totalMin <= budget)

  const toggle = (i: number) => {
    if (i === 0) return
    setSelected(selected.map((s, k) => (k === i ? !s : s)))
  }

  const overlay: Overlay = $derived.by(() => {
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
    const labels = PLACES.map((_, i) => i).filter((i) => i === 0 || selected[i])
    return { segments, badges, nodeClass, labels }
  })
</script>

<div class="split">
  <MapView graph={entry.graph} {entry} {overlay} onNodeClick={toggle} />

  <div class="stack">
    <section class="card">
      <h2><span class="stepno">1</span> Where does your trip start?</h2>
      <div class="choice-grid" role="radiogroup" aria-label="Starting point">
        {#each ENTRY_KEYS as key (key)}
          <button
            type="button"
            role="radio"
            aria-checked={model.entryKey === key}
            class={['choice', { on: model.entryKey === key }]}
            onclick={() => setEntryKey(key)}
          >
            <strong>{ENTRIES[key].label}</strong>
            <span>{ENTRY_COPY[key]}</span>
          </button>
        {/each}
      </div>
    </section>

    <section class="card">
      <h2><span class="stepno">2</span> What would you like to see?</h2>
      <p class="muted">Tap places on the map or in the list. Not sure? Start with an idea:</p>
      <div class="chips">
        {#each PRESETS as p (p.id)}
          <button type="button" class="chip" onclick={() => setSelected(selectionOf(p.nodes))}>{p.label}</button>
        {/each}
        <button type="button" class="chip ghost" onclick={() => setSelected(selectionOf([]))} disabled={count === 0}>Clear</button>
      </div>

      <ul class="places">
        {#each PLACES.slice(1) as p, k (p.n)}
          {@const i = k + 1}
          <li>
            <label class={{ on: selected[i] }}>
              <input type="checkbox" checked={selected[i]} onchange={() => toggle(i)} />
              <span class="pname">{p.name}</span>
              <span class="pmeta">{kindOf(p)} · about {duration(p.stay)}</span>
            </label>
          </li>
        {/each}
      </ul>
    </section>

    <section class="card">
      <h2><span class="stepno">3</span> Your trip</h2>

      {#if !ready}
        <p class="muted">
          {count === 0
            ? 'Choose at least one place above and your route will appear here.'
            : 'Some of the chosen places cannot be reached by road from the port.'}
        </p>
      {:else}
        <div class="when">
          <label>
            Leave {entry.label} at
            <select bind:value={startMin}>
              {#each START_TIMES as t (t)}
                <option value={t}>{clock(t)}</option>
              {/each}
            </select>
          </label>
          <div class="hours">
            <span>Time you have</span>
            <div class="chips tight">
              {#each HOURS as o (o.h)}
                <button type="button" class={['chip', { on: hours === o.h }]} onclick={() => (hours = o.h)}>
                  {o.label} · {o.h} h
                </button>
              {/each}
            </div>
          </div>
        </div>

        <div class={['verdict', fits ? 'ok' : 'over']} aria-live="polite">
          {#if fits}
            <strong>This fits.</strong> The trip takes {duration(schedule.totalMin)}, leaving {duration(budget - schedule.totalMin)} to spare.
          {:else}
            <strong>Too long for {hours} h.</strong> The trip takes {duration(schedule.totalMin)}, which is {duration(schedule.totalMin - budget)}
            over. Remove a place or two, or allow more time.
          {/if}
        </div>

        <ol class="timeline">
          <li class="tl-start">
            <span class="tl-time">{clock(startMin)}</span>
            <span class="tl-what">Leave {entry.label}</span>
          </li>
          {#each schedule.legs as leg, idx (idx)}
            <li class={leg.isReturn ? 'tl-end' : 'tl-stop'}>
              <span class="tl-drive">{duration(leg.driveMin)} drive · {fmtNum(leg.km)} km</span>
              <span class="tl-time">{clock(leg.arrive)}</span>
              <span class="tl-what">
                {#if leg.isReturn}
                  Back at {entry.label}
                {:else}
                  <b>{placeName(leg.to, entry)}</b>
                  <small>stay about {duration(leg.stayMin)}, leave {clock(leg.leave)}</small>
                {/if}
              </span>
            </li>
          {/each}
        </ol>

        <dl class="totals">
          <div><dt>Driving</dt><dd>{duration(schedule.driveMin)}</dd><dd class="sub">{fmtNum(schedule.km)} km</dd></div>
          <div><dt>At the places</dt><dd>{duration(schedule.stayMin)}</dd></div>
          <div><dt>Whole trip</dt><dd>{duration(schedule.totalMin)}</dd></div>
        </dl>

        <p class="muted small">
          The order is chosen by always driving to the closest place you haven&rsquo;t visited yet.
          <a href="#how">How was this worked out?</a>
        </p>
      {/if}
    </section>

    <details class="card fold">
      <summary>Directions between two places</summary>
      {#key model.entryKey}
        <Directions {model} />
      {/key}
    </details>

    {#if model.entryKey === 'wharf'}
      <details class="card fold">
        <summary>Getting around without your own vehicle</summary>
        <p class="muted">
          The SP found that tourists usually hire a tricycle, jeepney or van for the day, and can visit as many places as fit
          in that day:
        </p>
        <ul class="plain">
          <li><strong>Tricycle</strong> — about ₱1,800 per day, for fewer than 5 people</li>
          <li><strong>Jeepney</strong> — about ₱4,000 per day, for 15 to 20 people</li>
          <li><strong>Van</strong> — about ₱4,500 per day, up to 15 people</li>
        </ul>
        <p class="muted small">Prices are from the 2023 SP and may have changed &mdash; confirm locally.</p>
      </details>
    {/if}
  </div>
</div>
