<script lang="ts">
  import { fmtNum } from '../algo/helpers'
  import type { Graph } from '../algo/types'
  import { POS, placeName, type Entry } from '../data'
  import type { Overlay } from './overlay'

  interface Props {
    graph: Graph
    entry: Entry
    overlay?: Overlay
    onNodeClick?: (i: number) => void
    fill?: boolean
    highlight?: number | null
  }

  let { graph, entry, overlay = {}, onNodeClick, fill = false, highlight = null }: Props = $props()

  const R = 8.5
  let weights = $state(false)

  const segments = $derived(overlay.segments ?? [])
  const nodeClass = $derived(overlay.nodeClass ?? {})
  const badges = $derived(overlay.badges ?? {})
  const labels = $derived(overlay.labels ?? [])

  const edges = $derived.by(() => {
    const out: [number, number][] = []
    for (let i = 0; i < graph.length; i++)
      for (let j = i + 1; j < graph.length; j++) if (graph[i][j] !== null) out.push([i, j])
    return out
  })

  const press = (e: KeyboardEvent, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onNodeClick?.(i)
    }
  }
</script>

<figure class={["map", { fill }]}>
  <svg viewBox="320 118 370 365" role="img" aria-label="Schematic map of the 15 points of interest in Guimaras and the roads between them">
    <g class="edges">
      {#each edges as [a, b] (`${a}-${b}`)}
        <line x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]} />
      {/each}
    </g>

    {#if weights}
      <g class="weights">
        {#each edges as [a, b] (`w${a}-${b}`)}
          <text x={(POS[a][0] + POS[b][0]) / 2} y={(POS[a][1] + POS[b][1]) / 2}>{fmtNum(graph[a][b] as number)}</text>
        {/each}
      </g>
    {/if}

    <g class="segments">
      {#each segments as s, idx (`${s.a}-${s.b}-${s.cls}-${idx}`)}
        <line class="seg {s.cls}" pathLength="1" x1={POS[s.a][0]} y1={POS[s.a][1]} x2={POS[s.b][0]} y2={POS[s.b][1]} />
      {/each}
    </g>

    <g class="nodes">
      {#each POS as [x, y], i (i)}
        {@const left = x > 600}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <g
          class="node {i === 0 ? 'port' : ''} {nodeClass[i] ?? ''} {highlight === i ? 'hl' : ''}"
          transform="translate({x} {y})"
          role={onNodeClick ? 'button' : undefined}
          tabindex={onNodeClick ? 0 : undefined}
          aria-label={onNodeClick ? `${i + 1}. ${placeName(i, entry)}` : undefined}
          onclick={onNodeClick ? () => onNodeClick(i) : undefined}
          onkeydown={onNodeClick ? (e) => press(e, i) : undefined}
          style:cursor={onNodeClick ? 'pointer' : undefined}
        >
          <title>{`${i + 1}. ${placeName(i, entry)}`}</title>
          {#if i === 0}
            <rect x={-R} y={-R} width={R * 2} height={R * 2} rx="3" />
          {:else}
            <circle r={R} />
          {/if}
          <text class="num" y="3">{i + 1}</text>
          {#if badges[i]}
            <g class="badge" transform="translate({R},{-R})">
              <circle r="6.5" />
              <text y="2.6">{badges[i]}</text>
            </g>
          {/if}
          {#if labels.includes(i)}
            <text class="label" x={left ? -R - 4 : R + 4} y="3" text-anchor={left ? 'end' : 'start'}>{placeName(i, entry)}</text>
          {/if}
        </g>
      {/each}
    </g>
  </svg>
  <figcaption>
    <label><input type="checkbox" bind:checked={weights} /> Show road distances (km)</label>
    <span class="hint">Schematic layout traced from the paper&rsquo;s Figure 3.1 &mdash; lines are direct roads, not true geometry.</span>
  </figcaption>
</figure>
