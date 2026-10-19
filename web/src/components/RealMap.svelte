<script lang="ts">
  import { onMount } from 'svelte'
  import type * as Leaflet from 'leaflet'
  import type { Graph } from '../algo/types'
  import { COORDS, placeName, type Entry } from '../data'
  import { PAN_LIMIT, islandBounds, islandRings } from '../lib/island'
  import { buildPopup } from '../lib/popup'
  import { roadPath, type LatLng } from '../lib/roads'
  import type { Overlay } from './overlay'

  interface Props {
    graph: Graph
    entry: Entry
    overlay?: Overlay
    onNodeClick?: (i: number) => void
    fill?: boolean // fills its parent (the Plan page): bigger controls, and room kept clear for the phone bottom sheet
    highlight?: number | null // a place to pick out (the one under the mouse in the list)
    focusRequest?: { i: number; n: number } | null // "fly to this place and open its card"; a new `n` asks again
  }

  let { graph, entry, overlay = {}, onNodeClick, fill = false, highlight = null, focusRequest = null }: Props = $props()

  type Ctx = { L: typeof Leaflet; map: Leaflet.Map; base: Leaflet.LayerGroup; top: Leaflet.LayerGroup }

  let el: HTMLDivElement
  let failed = $state(false)
  // filled in once Leaflet has loaded; Leaflet is only fetched when a map is actually shown
  let ctx = $state.raw<Ctx | null>(null)
  // the pins currently on the map, by place index; replaced whenever the pins are redrawn
  let markers = $state.raw<Leaflet.Marker[]>([])

  // On a phone, the bottom sheet slides over the map, so keep the island and popups clear of it.
  // (On desktop the planning panel is its own column beside the map, so the map has nothing to avoid.)
  const wide = () => window.matchMedia('(min-width: 901px)').matches
  const underSheet = () => fill && window.matchMedia('(max-width: 900px)').matches
  const fitPadding = () =>
    underSheet()
      ? { paddingTopLeft: [24, 70] as [number, number], paddingBottomRight: [24, 150] as [number, number] }
      : { padding: [fill ? 36 : 28, fill ? 36 : 28] as [number, number] }
  const popupPadding = () =>
    underSheet()
      ? { autoPanPaddingTopLeft: [20, 70] as [number, number], autoPanPaddingBottomRight: [20, 150] as [number, number] }
      : { autoPanPadding: [20, 20] as [number, number] }

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
    let refocus: (() => void) | undefined

    ;(async () => {
      try {
        const [leaflet] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
        if (disposed) return
        const L: typeof Leaflet = (leaflet as unknown as { default?: typeof Leaflet }).default ?? leaflet

        map = L.map(el, {
          zoomSnap: 0.25, // lets the island fill the space instead of snapping to a whole zoom level
          zoomControl: false, // added below, so it can sit bottom-right like Google Maps when the map fills the screen
          scrollWheelZoom: fill, // an inline map must not hijack the page scroll; a full-screen one can zoom
          dragging: fill || !L.Browser.mobile, // inline on a phone: one finger scrolls the page, pinch still zooms
        })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)
        const everything = L.latLngBounds(islandBounds)
        map.fitBounds(everything, fitPadding())

        // Keep the screen on Guimaras: fade the sea and the mainland, glow the coast, and stop the map drifting far away.
        const world: LatLng[] = [[-85, -180], [-85, 180], [85, 180], [85, -180]]
        L.polygon([world, ...islandRings], { className: 'rl-mask', stroke: false, interactive: false }).addTo(map)
        L.polygon(islandRings, { className: 'rl-glow', fill: false, interactive: false }).addTo(map)
        L.polygon(islandRings, { className: 'rl-coast', fill: false, interactive: false }).addTo(map)
        map.options.maxBoundsViscosity = 1

        // Frame the island, then limit how far the map can zoom out and drift. The limits are sized from the real
        // viewport, so a wide window never shows empty margins.
        const world2 = L.latLngBounds([-90, -180], [90, 180])
        const focus = () => {
          if (!map) return
          map.setMinZoom(0)
          map.setMaxBounds(world2)
          map.fitBounds(everything, { ...fitPadding(), animate: false })
          map.setMinZoom(map.getZoom() - 1)
          const view = map.getBounds()
          const spanLat = view.getNorth() - view.getSouth()
          const spanLng = view.getEast() - view.getWest()
          const c = everything.getCenter()
          const limit = L.latLngBounds([c.lat - spanLat, c.lng - spanLng], [c.lat + spanLat, c.lng + spanLng])
          map.setMaxBounds(limit.extend(everything.pad(PAN_LIMIT / Math.max(everything.getNorth() - everything.getSouth(), 0.01))))
        }
        focus()
        refocus = focus

        L.control.zoom({ position: fill ? 'bottomright' : 'topleft' }).addTo(map)
        // "show the whole island" button, above the zoom buttons
        const showAll = L.Control.extend({
          onAdd() {
            const bar = L.DomUtil.create('div', 'leaflet-bar')
            const a = L.DomUtil.create('a', 'rl-fit', bar) as HTMLAnchorElement
            a.href = '#'
            a.role = 'button'
            a.title = 'Show the whole island'
            a.setAttribute('aria-label', 'Show the whole island')
            a.innerHTML =
              '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
            L.DomEvent.disableClickPropagation(bar)
            L.DomEvent.on(a, 'click', (e) => {
              L.DomEvent.preventDefault(e)
              refocus?.()
            })
            return bar
          },
        })
        new showAll({ position: fill ? 'bottomright' : 'topleft' }).addTo(map)

        // When the map's width changes (the side panel opens or closes, the phone turns) re-frame the island;
        // a change in height alone (the on-screen keyboard) must not throw away where the visitor has panned to.
        let lastWidth = el.clientWidth
        watcher = new ResizeObserver(() => {
          map?.invalidateSize()
          if (Math.abs(el.clientWidth - lastWidth) > 40) {
            lastWidth = el.clientWidth
            refocus?.()
          }
        })
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
    const made: Leaflet.Marker[] = []
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
      marker.bindPopup(buildPopup(i, entry, { chosen, onToggle: toggle }), { closeButton: true, ...popupPadding(), maxWidth: 360, maxHeight: wide() ? 520 : 340 })
      marker.on('popupopen', () => marker.closeTooltip())
      marker.addTo(top)
      marker.getElement()?.setAttribute('aria-label', `${i + 1}. ${placeName(i, entry)}`)
      made.push(marker)
    }
    markers = made
  })

  // Pick out one pin (the place being pointed at in the list). This only changes a class, so it never redraws the map
  // and an open card stays open.
  $effect(() => {
    const list = markers
    const target = highlight
    list.forEach((m, i) => {
      const on = i === target
      m.getElement()?.classList.toggle('hl', on)
      m.setZIndexOffset(on ? 1000 : 0)
    })
  })

  // Clicking a place in the list: glide to its pin, then open its card.
  let lastFocus = 0
  $effect(() => {
    const req = focusRequest
    if (!req || !ctx || req.n === lastFocus) return
    const marker = markers[req.i]
    if (!marker) return
    lastFocus = req.n
    const { map } = ctx
    const at = marker.getLatLng()
    const zoom = Math.max(map.getZoom(), 12.5)
    const open = () => {
      if (!marker.isPopupOpen()) marker.openPopup()
    }
    if (map.distance(map.getCenter(), at) < 30 && map.getZoom() >= zoom - 0.1) {
      open() // already there
    } else {
      map.once('moveend', open)
      map.flyTo(at, zoom, { duration: 0.7 })
      setTimeout(open, 1500) // in case the browser skips the animation
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
