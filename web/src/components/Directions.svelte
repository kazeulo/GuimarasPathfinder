<script lang="ts">
  import { fmtNum, reconstructPath } from '../algo/helpers'
  import { PLACES, SPEED_KMH, placeName } from '../data'
  import { duration } from '../lib/trip'
  import type { Model } from '../model'

  interface Props {
    model: Model
  }

  // "How do I get from A to B?" — the shortest route from the finished distance table.
  let { model }: Props = $props()

  let from = $state(0)
  let to = $state(10)

  const entry = $derived(model.entry)
  const path = $derived(reconstructPath(model.fw.prev, from, to))
  const km = $derived(model.fw.dist[from][to])

  const swap = () => {
    ;[from, to] = [to, from]
  }
</script>

<div class="directions">
  <div class="pickers">
    <label>
      From
      <select bind:value={from}>
        {#each PLACES as _, i (i)}
          <option value={i}>{placeName(i, entry)}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="swap" onclick={swap} aria-label="Swap start and destination">⇄</button>
    <label>
      To
      <select bind:value={to}>
        {#each PLACES as _, i (i)}
          <option value={i}>{placeName(i, entry)}</option>
        {/each}
      </select>
    </label>
  </div>

  {#if from === to}
    <p class="muted">Pick two different places.</p>
  {:else if path.length === 0}
    <p class="muted">There is no road connection between these two places.</p>
  {:else}
    <div class="route-card">
      <ol class="route-list">
        {#each path as v (v)}
          <li>{placeName(v, entry)}</li>
        {/each}
      </ol>
      <p class="route-total">
        <strong>{fmtNum(km)} km</strong> · about {duration((km / SPEED_KMH) * 60)} by road
      </p>
    </div>
  {/if}
</div>
