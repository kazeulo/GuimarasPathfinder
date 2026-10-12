<script lang="ts">
  import { onMount } from 'svelte'
  import type * as Leaflet from 'leaflet'
  import type { Graph } from '../algo/types'
  import { COORDS, placeName, type Entry } from '../data'
  import { roadPath, type LatLng } from '../lib/roads'
  import type { Overlay } from './overlay'

  interface Props {
    graph: Graph
    entry: Entry
    overlay?: Overlay
    onNodeClick?: (i: number) => void
  }

  let { graph, entry, overlay = {}, onNodeClick }: Props = $props()

  type Ctx = { L: typeof Leaflet; map: Leaflet.Map; base: Leaflet.LayerGroup; top: Leaflet.LayerGroup }

  let el: HTMLDivElement
  let failed = $state(false)
  // filled in once Leaflet has loaded; Leaflet is only fetched when a map is actually shown
  let ctx = $state.raw<Ctx | null>(null)

  const pos = (i: number): LatLng => (i === 0 ? entry.latlng : COORDS[i])

  // the drawn road between two places: the real road shape, joined to the exact pins at both ends
  const roadBetween = (a: number, b: number): LatLng[] => {
    const road = roadPath(a, b)
    return road ? [pos(a), ...road, pos(b)] : [pos(a), pos(b)]
  }

  onMount(() => {
    let disposed = false
    let map: Leaflet.Map | undefined
    let watcher: ResizeObserver | undefined

    ;(async () => {
      try {
        const [leaflet] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
        if (disposed) return
        const L: typeof Leaflet = (leaflet as unknown as { default?: typeof Leaflet }).default ?? leaflet

        map = L.map(el, {
          scrollWheelZoom: false, // don't hijack the page scroll
          dragging: !L.Browser.mobile, // one finger scrolls the page on phones; pinch still zooms
        })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)
        map.fitBounds(L.latLngBounds(COORDS.map((_, i) => pos(i))), { padding: [28, 28] })

        watcher = new ResizeObserver(() => map?.invalidateSize())
        watcher.observe(el)

        ctx = { L, map, base: L.layerGroup().addTo(map), top: L.layerGroup().addTo(map) }
      } catch {
        failed = true
      }
    })()

    return () => {
      disposed = true
      watcher?.disconnect()
      map?.remove()
    }
  })

  // the faint road network under everything
  $effect(() => {
    if (!ctx) return
    const { L, base } = ctx
    base.clearLayers()
    for (let a = 0; a < graph.length; a++)
      for (let b = a + 1; b < graph.length; b++)
        if (graph[a][b] !== null) L.polyline(roadBetween(a, b), { className: 'rl-edge', interactive: false }).addTo(base)
  })

  // routes, pins, numbers and labels for the current page
  $effect(() => {
    if (!ctx) return
    const { L, top } = ctx
    const { segments = [], nodeClass = {}, badges = {}, labels = [] } = overlay
    top.clearLayers()
    // Names stay on screen only when a page highlights a few places; with many, they would overlap, so they show on hover or tap.
    const showNames = labels.length <= 3

    for (const s of segments) {
      // "seg-leg seg-return" -> "rl-leg rl-return"
      const cls = 'rl-seg ' + s.cls.replace(/\bseg-/g, 'rl-')
      // comparisons (not real roads) are drawn straight; routes follow the road
      const straight = /seg-(cand|new)/.test(s.cls)
      L.polyline(straight ? [pos(s.a), pos(s.b)] : roadBetween(s.a, s.b), { className: cls, interactive: false }).addTo(top)
    }

    for (let i = 0; i < COORDS.length; i++) {
      const badge = badges[i] ? `<b class="pbadge">${badges[i]}</b>` : ''
      const html = `<div class="pin ${i === 0 ? 'port' : ''} ${nodeClass[i] ?? ''}"><span>${i + 1}</span>${badge}</div>`
      const marker = L.marker(pos(i), {
        icon: L.divIcon({ className: 'pin-wrap', html, iconSize: [30, 30], iconAnchor: [15, 15] }),
        keyboard: !!onNodeClick,
        riseOnHover: true,
      })
      const east = pos(i)[1] > 122.65 // keep labels on the island side of the pin
      marker.bindTooltip(placeName(i, entry), {
        permanent: showNames && labels.includes(i),
        direction: east ? 'left' : 'right',
        offset: [east ? -14 : 14, 0],
        className: 'rl-label',
      })
      if (onNodeClick) marker.on('click', () => onNodeClick(i))
      marker.addTo(top)
      marker.getElement()?.setAttribute('aria-label', `${i + 1}. ${placeName(i, entry)}`)
    }
  })
</script>

<figure class="map">
  {#if failed}
    <p class="map-error">The map couldn&rsquo;t load. Use the &ldquo;Diagram&rdquo; view instead.</p>
  {/if}
  <div class="rl-map" bind:this={el} role="region" aria-label="Map of Guimaras showing the places and the roads between them"></div>
  <figcaption>
    <span class="hint">Roads are drawn from OpenStreetMap and may differ a little from the Google Maps routes behind the distances.</span>
  </figcaption>
</figure>
