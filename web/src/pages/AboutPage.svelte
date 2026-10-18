<script lang="ts">
  import { REPO_URL } from '../data'
</script>

<article class="page">
  <header class="page-head">
    <h1>About this project</h1>
    <p class="lead">
      Guimaras Pathfinder is a proof-of-concept, interactive version of an undergraduate special problem (SP) by Bernardo, Lozada and
      Manejo (2023). It helps a visitor to Guimaras plan a day around the island&rsquo;s most popular places, and it lets anyone see
      how the SP&rsquo;s method works and check its results.
    </p>
  </header>

  <aside class="notice" aria-label="What has and has not been verified">
    <h2>Note</h2>
    <ul class="plain">
      <li>
        <strong>The calculations are verified.</strong> They give the same results as the Special Problem's paper.
      </li>
      <li>
        <strong>This website is not verified.</strong> It has not been formally checked or tested, so please use it as a guide only.
      </li>
    </ul>
  </aside>

  <section>
    <h2>The Special Problem</h2>
    <p>
      <em>Application of Floyd–Warshall Algorithm in Optimizing Tour Route for Selected Tourist Destinations in Guimaras Province</em>,
      a special problem for the Bachelor of Science in Applied Mathematics at the University of the Philippines Visayas, June 2023,
      by Rhona Pauline A. Bernardo, Angellyn B. Lozada and Kzcl Jay R. Manejo.
    </p>
    <p>
      Its goal: help tourists spend more of their time enjoying places and less of it travelling between them, by finding the
      shortest road between every pair of 14 popular destinations and suggesting a route that visits them all.
    </p>
  </section>

  <section>
    <h2>Where the information comes from</h2>
    <ul class="plain">
      <li>
        <strong>Which places:</strong> the most-visited destinations listed by the Provincial Economic Development Office
        (Tourism Section) of Guimaras.
      </li>
      <li>
        <strong>Road distances:</strong> measured between each pair of places on Google Maps by the SP authors.
      </li>
      <li>
        <strong>Driving time:</strong> distance divided by a constant 40 km/h, the municipal speed limit cited in R.A. 4136.
      </li>
      <li>
        <strong>Time at each place:</strong> the authors&rsquo; estimate for each type of place.
      </li>
      <li>
        <strong>About each place:</strong> the short descriptions on the map were compiled in October 2026 from public sources such as
        travel sites, Wikipedia and the operators&rsquo; own pages. The SP itself doesn&rsquo;t describe the places, so these may be out of date.
        Please check locally before you go.
      </li>
      <li>
        <strong>Vehicle prices:</strong> collected from local drivers for the SP.
      </li>
    </ul>
  </section>

  <section>
    <h2>Where trips start</h2>
    <p>
      The SP looked at two entry points in Jordan: the Wharf, for visitors arriving without a vehicle, and the RoRo Port, for visitors
      bringing their own. They are only a few hundred metres apart and give almost the same routes, with a full tour about 0.2 km
      longer from the RoRo Port. So every trip on this site starts and ends at Jordan Wharf.
    </p>
  </section>

  <section>
    <h2>Does this app reproduce the SP?</h2>
    <p>
      <strong>The distances do, exactly.</strong> Automated tests compare all 225 shortest distances for Jordan Wharf (Table 4.1) and
      for Jordan RoRo Port (Table 4.2) with the SP, and every one matches. The Jordan Wharf tour is also identical: the same
      stops in the same order.
    </p>
  </section>

  <section>
    <h2>Please keep in mind</h2>
    <ul class="plain">
      <li>This is a research demonstration, not a navigation app. Check local conditions before you travel.</li>
      <li>Routes are drawn on roads from OpenStreetMap, which can differ a little from the Google Maps routes behind the distances. Times are estimates.</li>
      <li>Opening hours, entrance fees and road conditions are not included.</li>
    </ul>
  </section>

  <section>
    <h2>Built with</h2>
    <p>
      Svelte and TypeScript. The original Python program from the SP&rsquo;s appendix is kept in the project&rsquo;s
      <code>python</code> folder, and the code in this app is tested against it.
    </p>
    <p>
      The source code is open on
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>.
    </p>
  </section>
</article>
