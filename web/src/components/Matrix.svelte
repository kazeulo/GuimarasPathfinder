<script lang="ts">
  import { fmtNum } from '../algo/helpers'
  import { placeName, type Entry } from '../data'

  interface Props {
    values: number[][]
    entry: Entry
    pivot: number | null // row/column k being used as the intermediate node
    changed: Set<string> // cells updated during the current k ("i,j")
    last: { i: number; j: number } | null // the single most recent update
  }

  let { values, entry, pivot, changed, last }: Props = $props()

  const idx = $derived(Array.from({ length: values.length }, (_, i) => i))
</script>

<div class="matrix-wrap">
  <table class="matrix">
    <thead>
      <tr>
        <th class="corner">km</th>
        {#each idx as j (j)}
          <th class={{ pivot: j === pivot }} title={placeName(j, entry)}>{j + 1}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each idx as i (i)}
        <tr>
          <th class={{ pivot: i === pivot }} title={placeName(i, entry)}>{i + 1}</th>
          {#each idx as j (j)}
            {@const v = values[i][j]}
            <td
              class={{
                inf: v === Infinity,
                pivot: i === pivot || j === pivot,
                changed: changed.has(`${i},${j}`),
                last: last !== null && last.i === i && last.j === j,
              }}
              title="{placeName(i, entry)} → {placeName(j, entry)}"
            >
              {fmtNum(v)}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
