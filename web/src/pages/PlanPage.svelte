<script lang="ts">
  import { fmtNum, reconstructPath } from '../algo/helpers'
  import Directions from '../components/Directions.svelte'
  import MapPanel from '../components/MapPanel.svelte'
  import type { Overlay, Segment } from '../components/overlay'
  import { PLACES, PRESETS, REPO_URL, VEHICLES, kindOf, placeName, selectionOf } from '../data'
  import { clamp, nearestSnap, nextSnap, prevSnap, sheetHeights, type Snap } from '../lib/sheet'
  import { buildSchedule, clock, duration, planTour } from '../lib/trip'
  import type { Model } from '../model'

  interface Props {
    model: Model
    selected: boolean[]
    setSelected: (s: boolean[]) => void
  }

  let { model, selected, setSelected }: Props = $props()

  const HOURS = [
    { h: 6, label: 'Half day' },
    { h: 10, label: 'Full day' },
    { h: 20, label: 'Two days' },
  ]
  const START_TIMES = Array.from({ length: 13 }, (_, i) => 5 * 60 + i * 60) // 5 AM .. 5 PM

  let hours = $state(10)
  let startMin = $state(8 * 60)
  let query = $state('')

  const entry = $derived(model.entry)
  const fw = $derived(model.fw)
  const tour = $derived(planTour(fw, selected))
  const schedule = $derived(buildSchedule(tour, startMin))
  const count = $derived(selected.slice(1).filter(Boolean).length)
  const budget = $derived(hours * 60)
  const ready = $derived(count > 0 && tour.complete)
  const fits = $derived(schedule.totalMin <= budget)

  // destinations from nearest to farthest by road distance from the port, filtered by what was typed
  const byDistance = $derived(
    PLACES.map((p, i) => ({ p, i }))
      .slice(1)
      .sort((a, b) => fw.dist[0][a.i] - fw.dist[0][b.i]),
  )
  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase()
    return q ? byDistance.filter(({ p }) => p.name!.toLowerCase().includes(q) || kindOf(p).toLowerCase().includes(q)) : byDistance
  })

  const toggle = (i: number) => {
    if (i === 0) return
    setSelected(selected.map((s, k) => (k === i ? !s : s)))
  }

  // ---------- the floating panel ----------
  type Tab = 'places' | 'trip'
  let tab = $state<Tab>('places')
  let collapsed = $state(false) // desktop: hide the panel to see the whole map

  const isPhone = () => window.matchMedia('(max-width: 900px)').matches
  const openTab = (t: Tab) => {
    tab = t
    if (isPhone() && snap === 'peek') snap = 'half'
  }

  // ---------- the phone bottom sheet ----------
  let shellH = $state(700)
  let snap = $state<Snap>('peek')
  let dragH = $state<number | null>(null)
  const heights = $derived(sheetHeights(shellH))
  const sheetH = $derived(dragH ?? heights[snap])

  let drag: { startY: number; startH: number; lastY: number; lastT: number; v: number } | null = null

  const onDown = (e: PointerEvent) => {
    if (e.button) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag = { startY: e.clientY, startH: heights[snap], lastY: e.clientY, lastT: e.timeStamp, v: 0 }
  }
  const onMove = (e: PointerEvent) => {
    if (!drag) return
    if (Math.abs(e.clientY - drag.startY) > 4) dragH = clamp(drag.startH - (e.clientY - drag.startY), heights.peek, heights.full)
    const dt = Math.max(1, e.timeStamp - drag.lastT)
    drag.v = (drag.lastY - e.clientY) / dt // positive = moving up
    drag.lastY = e.clientY
    drag.lastT = e.timeStamp
  }
  const onUp = () => {
    if (!drag) return
    snap = dragH === null ? nextSnap(snap) : nearestSnap(dragH, heights, drag.v) // no movement: it was a tap
    drag = null
    dragH = null
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') snap = nextSnap(snap)
    else if (e.key === 'ArrowDown') snap = prevSnap(snap)
    else if (e.key === 'Enter' || e.key === ' ') snap = nextSnap(snap)
    else return
    e.preventDefault()
  }

  // ---------- what the map shows ----------
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

<div class="plan-shell" bind:clientHeight={shellH}>
  <MapPanel fill graph={entry.graph} {entry} {overlay} onNodeClick={toggle} />

  {#if collapsed}
    <button type="button" class="panel-open btn" onclick={() => (collapsed = false)}>Show places &amp; trip</button>
  {/if}

  <aside class={['plan-panel', { collapsed, dragging: dragH !== null }]} style:--sheet-h="{sheetH}px" aria-label="Trip planner">
    <div class="panel-title">
      <h1>Plan a day in Guimaras</h1>
      <button type="button" class="collapse" onclick={() => (collapsed = true)} aria-label="Hide panel and show the whole map" title="Hide panel">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
    </div>

    <!-- On a phone this is the handle: drag it, tap it, or use the arrow keys to move the sheet. -->
    <button
      type="button"
      class="sheet-grab"
      aria-label="Resize the panel"
      onpointerdown={onDown}
      onpointermove={onMove}
      onpointerup={onUp}
      onpointercancel={onUp}
      onkeydown={onKey}
    >
      <span class="grab-bar" aria-hidden="true"></span>
      <span class="summary">
        {#if count === 0}
          Choose places to plan your day
        {:else if !tour.complete}
          Some chosen places can&rsquo;t be reached by road
        {:else}
          <strong>{count} {count === 1 ? 'place' : 'places'}</strong> · {duration(schedule.totalMin)}
          <span class={['flag', fits ? 'ok' : 'over']}>{fits ? 'fits your day' : 'too long'}</span>
        {/if}
      </span>
    </button>

    <div class="panel-tabs" role="tablist" aria-label="Panel sections">
      <button type="button" role="tab" id="tab-places" aria-selected={tab === 'places'} aria-controls="pane-places" onclick={() => openTab('places')}>Places</button>
      <button type="button" role="tab" id="tab-trip" aria-selected={tab === 'trip'} aria-controls="pane-trip" onclick={() => openTab('trip')}>
        Trip {#if count > 0}<span class="tabcount">{count}</span>{/if}
      </button>
    </div>

    <div class="panel-body">
      <div role="tabpanel" id="pane-places" aria-labelledby="tab-places" hidden={tab !== 'places'}>
        <h2 class="pane-h">What would you like to see?</h2>
        <input class="search" type="search" placeholder="Search places" aria-label="Search places" bind:value={query} />
        <div class="chips">
          {#each PRESETS as p (p.id)}
            <button type="button" class="chip" onclick={() => setSelected(selectionOf(p.nodes))}>{p.label}</button>
          {/each}
          <button type="button" class="chip ghost" onclick={() => setSelected(selectionOf([]))} disabled={count === 0}>Clear</button>
        </div>

        <p class="muted small">Tap places here or on the map. Listed from nearest to farthest from {entry.label}.</p>
        <ul class="places">
          {#each shown as { p, i } (i)}
            <li>
              <label class={{ on: selected[i] }}>
                <input type="checkbox" checked={selected[i]} onchange={() => toggle(i)} />
                <span class="pname">{p.name}</span>
                <span class="pmeta">{fmtNum(fw.dist[0][i])} km away · {kindOf(p)} · <span class="nowrap">about {duration(p.stay)}</span></span>
              </label>
            </li>
          {:else}
            <li class="muted">No places match &ldquo;{query}&rdquo;.</li>
          {/each}
        </ul>
      </div>

      <div role="tabpanel" id="pane-trip" aria-labelledby="tab-trip" hidden={tab !== 'trip'}>
        <h2 class="pane-h">Your trip</h2>

        {#if !ready}
          <p class="muted">
            {count === 0
              ? 'Choose at least one place and your route will appear here.'
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
                    <small>stay about {duration(leg.stayMin)}, <span class="nowrap">leave {clock(leg.leave)}</span></small>
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

          <div class="hire">
            <h3 class="mini">Hiring a vehicle for the day</h3>
            <p class="muted small">If you don&rsquo;t have your own vehicle:</p>
            <ul>
              {#each VEHICLES as v (v.name)}
                <li>
                  <span class="vname">{v.name}</span>
                  <span class="vwho">{v.who}</span>
                  <span class="vprice">₱{v.perDay.toLocaleString('en-US')}</span>
                </li>
              {/each}
            </ul>
            <p class="muted small">Prices are per day and cover as many places as fit in it. They are from 2023, so confirm locally.</p>
          </div>

          <p class="muted small">
            The order is chosen by always driving to the closest place you haven&rsquo;t visited yet.
            <a href="#how">How was this worked out?</a>
          </p>
        {/if}

        <details class="card fold">
          <summary>Directions between two places</summary>
          <Directions {model} />
        </details>
      </div>

      <p class="panel-foot">
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">View the source on GitHub<span class="sr-only"> (opens in a new tab)</span></a>
      </p>
    </div>
  </aside>
</div>
