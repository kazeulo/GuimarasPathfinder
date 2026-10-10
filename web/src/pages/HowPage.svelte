<script lang="ts">
  import FloydDemo from '../components/FloydDemo.svelte'
  import MapView from '../components/MapView.svelte'
  import TourDemo from '../components/TourDemo.svelte'
  import type { Model } from '../model'

  interface Props {
    model: Model
    selected: boolean[]
    setSelected: (s: boolean[]) => void
  }

  let { model, selected, setSelected }: Props = $props()

  const FLOYD_CODE = `for k in places:            # the allowed stop-over
    for i in places:        # start
        for j in places:    # end
            if dist[i][k] + dist[k][j] < dist[i][j]:
                dist[i][j] = dist[i][k] + dist[k][j]
                prev[i][j] = prev[k][j]   # remember the route`

  const NN_CODE = `tour = [port]
while some places are unvisited:
    next = the unvisited place with the smallest dist[last][place]
    tour.append(next)
tour.append(port)           # return to the start`
</script>

<article class="page">
  <header class="page-head">
    <h1>How it works</h1>
    <p class="lead">
      Planning a trip around many places raises two questions: what is the quickest way between any two of them, and in what order
      should you visit them all? This page shows how the computer answers both. No maths needed.
    </p>
  </header>

  <section>
    <h2>The problem</h2>
    <p>
      Guimaras has 131 listed tourist destinations. This project looks at 14 of the most visited ones, plus the port you arrive at. Roads
      connect some of them directly, but most pairs have no direct road, so getting from one to another means passing through others.
      Faced with 15 places, it is hard to tell by eye which route is shortest.
    </p>
    <MapView graph={model.entry.graph} entry={model.entry} />
  </section>

  <section>
    <h2><span class="stepno">1</span> Find the shortest way between every pair of places</h2>
    <p>
      The first step uses a method called the <strong>Floyd–Warshall algorithm</strong>. The idea is simple: for every pair of places,
      keep asking <em>&ldquo;would going through a third place be quicker?&rdquo;</em> The computer does this for every pair, using
      every place in turn as the stop-over. When it finishes, it knows the shortest road distance between all pairs.
    </p>
    {#key model.entryKey}
      <FloydDemo {model} />
    {/key}
  </section>

  <section>
    <h2><span class="stepno">2</span> Choose the order to visit them</h2>
    <p>
      The second step is a rule of thumb called <strong>Nearest Neighbor</strong>: start at the port, always drive to the
      <em>closest place you haven&rsquo;t visited yet</em>, and when everything has been visited, drive back. The distances come from
      step 1.
    </p>
    <p class="muted small">
      This uses the places you chose on the <a href="#plan">Plan a trip</a> page. Pick &ldquo;All 14 places&rdquo; below to see the
      route from the SP.
    </p>
    {#key model.entryKey}
      <TourDemo {model} {selected} {setSelected} />
    {/key}
  </section>

  <section>
    <h2>Good to know</h2>
    <ul class="plain">
      <li>
        <strong>It&rsquo;s a good shortcut, not a guarantee.</strong> &ldquo;Closest first&rdquo; gives a sensible tour quickly, but it
        may not be the very shortest possible order.
      </li>
      <li>
        <strong>Driving time is an estimate.</strong> It assumes a steady 40 km/h on every road, with no traffic, stops or detours.
      </li>
      <li>
        <strong>Time at each place is a guess too.</strong> It comes from the type of place (for example 2 hours for a beach, 45
        minutes for a cultural site), not from measurement.
      </li>
      <li>
        <strong>Only 14 places.</strong> Guimaras has far more attractions than the ones studied here.
      </li>
    </ul>
  </section>

  <details class="card fold">
    <summary>For technical readers</summary>
    <h3 class="mini">Floyd–Warshall (all-pairs shortest paths)</h3>
    <pre>{FLOYD_CODE}</pre>
    <p class="muted small">
      n&nbsp;=&nbsp;15 places means 15&times;15&times;15 = 3,375 checks, O(n³). The <code>prev</code> table lets the exact route be
      rebuilt afterwards.
    </p>
    <h3 class="mini">Nearest Neighbor (greedy tour)</h3>
    <pre>{NN_CODE}</pre>
    <p class="muted small">
      O(n²). It is a heuristic for the travelling-salesman problem, so the result is a good tour, not a proven optimum. The
      SP (Chapter 3) describes both methods; the code in this project is checked against the SP&rsquo;s results.
    </p>
  </details>
</article>
