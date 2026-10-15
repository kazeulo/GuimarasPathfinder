<script lang="ts">
  import { onMount } from 'svelte'
  import type * as Leaflet from 'leaflet'
  import type { Graph } from '../algo/types'
  import { COORDS, placeName, type Entry } from '../data'
  import { buildPopup } from '../lib/popup'
  import { roadPath, type LatLng } from '../lib/roads'
  import type { Overlay } from './overlay'

  interface Props {
    graph: Graph
    entry: Entry
    overlay?: Overlay
    onNodeClick?: (i: number) => void
    fill?: boolean // fills its parent (the Plan page): bigger controls, and room kept clear for the floating panel
  }

  let { graph, entry, overlay = {}, onNodeClick, fill = false }: Props = $props()

  type Ctx = { L: typeof Leaflet; map: Leaflet.Map; base: Leaflet.LayerGroup; top: Leaflet.LayerGroup }

  let el: HTMLDivElement
  let failed = $state(false)
  // filled in once Leaflet has loaded; Leaflet is only fetched when a map is actually shown
  let ctx = $state.raw<Ctx | null>(null)

  // In fill mode a panel floats over the map (left on desktop, bottom sheet on phones), so keep places out from under it.
  const wide = () => window.matchMedia('(min-width: 901px)').matches
  const fitPadding = () =>
    !fill ? { padding: [28, 28] as [number, number] }
    : wide() ? { paddingTopLeft: [410, 30] as [number, number], paddingBottomRight: [30, 30] as [number, number] }
    : { paddingTopLeft: [24, 70] as [number, number], paddingBottomRight: [24, 150] as [number, number] }
  const popupPadding = () =>
    !fill ? { autoPanPadding: [20, 20] as [number, number] }
    : wide() ? { autoPanPaddingTopLeft: [410, 20] as [number, number], autoPanPaddingBottomRight: [20, 20] as [number, number] }
    : { autoPanPaddingTopLeft: [20, 70] as [number, number], autoPanPaddingBottomRight: [20, 150] as [number, number] }

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
          zoomControl: false, // added below, so it can sit bottom-right like Google Maps when the map fills the screen
          scrollWheelZoom: fill, // an inline map must not hijack the page scroll; a full-screen one can zoom
          dragging: fill || !L.Browser.mobile, // inline on a phone: one finger scrolls the page, pinch still zooms
        })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)
        const everything = L.latLngBounds(COORDS.map((_, i) => pos(i)))
        map.fitBounds(everything, fitPadding())

        L.control.zoom({ position: fill ? 'bottomright' : 'topleft' }).addTo(map)
        // "show all places" button, above the zoom buttons
        const showAll = L.Control.extend({
          onAdd() {
            const bar = L.DomUtil.create('div', 'leaflet-bar')
            const a = L.DomUtil.create('a', 'rl-fit', bar) as HTMLAnchorElement
            a.href = '#'
            a.role = 'button'
            a.title = 'Show all places'
            a.setAttribute('aria-label', 'Show all places')
            a.innerHTML =
              '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
            L.DomEvent.disableClickPropagation(bar)
            L.DomEvent.on(a, 'click', (e) => {
              L.DomEvent.preventDefault(e)
              map?.fitBounds(everything, fitPadding())
            })
            return bar
          },
        })
        new showAll({ position: fill ? 'bottomright' : 'topleft' }).addTo(map)

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
        keyboard: true,
        riseOnHover: true,
      })
      const east = pos(i)[1] > 122.65 // keep labels on the island side of the pin
      marker.bindTooltip(placeName(i, entry), {
        permanent: showNames && labels.includes(i),
        direction: east ? 'left' : 'right',
        offset: [east ? -14 : 14, 0],
        className: 'rl-label',
      })
      // Clicking a pin opens a card with the place's photo. On the Plan page the card also adds or removes the place.
      const chosen = ['sel', 'visited'].includes(nodeClass[i] ?? '')
      const toggle = onNodeClick && i > 0 ? () => { marker.closePopup(); onNodeClick(i) } : undefined
      marker.bindPopup(buildPopup(i, entry, { chosen, onToggle: toggle }), { closeButton: true, ...popupPadding(), maxWidth: 260 })
      marker.on('popupopen', () => marker.closeTooltip())
      marker.addTo(top)
      marker.getElement()?.setAttribute('aria-label', `${i + 1}. ${placeName(i, entry)}`)
    }
  })
</script>

<figure class={["map", { fill }]}>
  {#if failed}
    <p class="map-error">The map couldn&rsquo;t load. Use the &ldquo;Diagram&rdquo; view instead.</p>
  {/if}
  <div class="rl-map" bind:this={el} role="region" aria-label="Map of Guimaras showing the places and the roads between them"></div>
  <figcaption class="map-note">
    <span class="hint">Roads are drawn from OpenStreetMap and may differ a little from the Google Maps routes behind the distances.</span>
  </figcaption>
</figure>
