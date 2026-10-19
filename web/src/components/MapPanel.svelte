<script lang="ts">
  import type { Graph } from '../algo/types'
  import type { Entry } from '../data'
  import { mapMode, setMapMode } from '../lib/mapMode.svelte'
  import MapView from './MapView.svelte'
  import RealMap from './RealMap.svelte'
  import type { Overlay } from './overlay'

  interface Props {
    graph: Graph
    entry: Entry
    overlay?: Overlay
    onNodeClick?: (i: number) => void
    fill?: boolean // fill the parent instead of sitting inline (Plan page)
    highlight?: number | null
    focusRequest?: { i: number; n: number } | null
  }

  // The map every page shows: the real map by default, with the simple diagram as an alternative.
  let { graph, entry, overlay = {}, onNodeClick, fill = false, highlight = null, focusRequest = null }: Props = $props()
</script>

<div class={["map-wrap", { fill }]}>
  <div class="seg-control map-switch" role="group" aria-label="Map style">
    <button type="button" class={{ on: mapMode.value === 'map' }} onclick={() => setMapMode('map')}>Map</button>
    <button type="button" class={{ on: mapMode.value === 'diagram' }} onclick={() => setMapMode('diagram')}>Diagram</button>
  </div>
  {#if mapMode.value === 'map'}
    <RealMap {graph} {entry} {overlay} {onNodeClick} {fill} {highlight} {focusRequest} />
  {:else}
    <MapView {graph} {entry} {overlay} {onNodeClick} {fill} {highlight} />
  {/if}
</div>
