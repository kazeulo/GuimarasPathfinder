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

  <dl class="facts" aria-label="The Special Problem at a glance">
    <div><dt>Visitors to Guimaras in 2021</dt><dd>about 165,000</dd></div>
    <div><dt>Points on the map</dt><dd>15</dd><dd class="sub">the starting port plus 14 popular places</dd></div>
    <div><dt>Full loop from Jordan Wharf</dt><dd>118.85 km</dd><dd class="sub">about 3 hours of driving</dd></div>
    <div><dt>Ways in</dt><dd>2</dd><dd class="sub">Jordan Wharf and Jordan RoRo Port</dd></div>
  </dl>

  <section>
    <h2>The Special Problem</h2>
    <p>
      <em>Application of Floyd–Warshall Algorithm in Optimizing Tour Route for Selected Tourist Destinations in Guimaras Province</em>,
      a special problem for the Bachelor of Science in Applied Mathematics at the University of the Philippines Visayas, June 2023,
      by Rhona Pauline A. Bernardo, Angellyn B. Lozada and Kzcl Jay R. Manejo.
    </p>
    <p>
      Its goal: help tourists spend more of their time enjoying places and less of it travelling between them, by finding the
      shortest road between every pair of popular destinations and suggesting a route that visits them all.
    </p>
  </section>

  <section>
    <h2>Why it was done</h2>
    <p>
      Guimaras sees tourism as one of the industries with the most potential to grow its economy. The Provincial Economic Development
      Office counted roughly 165,000 visitors in 2021: almost 24,000 who stayed overnight and about 141,000 who came for the day. The
      SP cites a tourism report saying that more than 70% of arrivals are domestic visitors, from places such as Iloilo, Bacolod, Cebu,
      Bohol and Aklan.
    </p>
    <p>
      Planning a trip takes time, and many of the island&rsquo;s places are far from one another. A visitor who doesn&rsquo;t know the
      roads can end up spending more of the day travelling than enjoying the places. That is the problem the SP set out to ease.
    </p>
  </section>

  <section>
    <h2>What it set out to do</h2>
    <ul class="plain">
      <li>Find the shortest path between every pair of the chosen destinations, using the Floyd–Warshall algorithm.</li>
      <li>Build a tour that visits all of them, using those shortest paths and the Nearest Neighbor method.</li>
      <li>Write a Python program for both methods, to check the results.</li>
    </ul>
  </section>

  <section>
    <h2>How it was done</h2>
    <ol class="plain">
      <li>
        <strong>Choosing the places.</strong> They were picked on purpose, not at random, from the Guimaras Tourism Department&rsquo;s list of
        the most-visited destinations. They fall into six types: sun and beach, nature, cultural, leisure and entertainment, education,
        and industrial.
      </li>
      <li>
        <strong>Putting them on a map.</strong> Each place was pinned in Google Earth. There are two possible starting points: Jordan
        Wharf for visitors without a vehicle, and Jordan RoRo Port for those bringing their own.
      </li>
      <li>
        <strong>Measuring the roads.</strong> The authors checked the routes between every pair of places on Google Maps, kept the shortest
        direct ones, and used Google Maps&rsquo; road distance as each road&rsquo;s length. Pairs with no direct road were marked as having none.
      </li>
      <li>
        <strong>Estimating time.</strong> Driving time is the distance at a constant 40 km/h. Time at each place is an assumed figure for
        that type of place.
      </li>
      <li>
        <strong>Working out the routes.</strong> Floyd–Warshall found the shortest way between every pair. Nearest Neighbor then built the
        tour: start at the port, always go to the closest place not yet visited, and return to the port by the shortest road.
      </li>
      <li>
        <strong>Checking.</strong> The authors worked the shortest paths out by hand and compared them with the output of the Python
        program.
      </li>
    </ol>
  </section>

  <section>
    <h2>What it found</h2>
    <ul class="plain">
      <li>
        <strong>The full loop is short on the road.</strong> Visiting every place and returning to Jordan Wharf is 118.85 km, about
        2 hours 58 minutes of driving. From Jordan RoRo Port it is almost the same, about 119 km.
      </li>
      <li>
        <strong>But it is too much for one day.</strong> Once the time to stay at each place is added, the SP concludes the whole loop is
        clearly not possible for a same-day visitor. Visitors can stay longer, or choose only the places they most want that fit their
        time. For that, the SP lists the shortest route between every pair of places.
      </li>
      <li>
        <strong>Getting around.</strong> Visitors mostly use tricycles, jeepneys and vans, each with a day rate that lets them visit as
        many places as fit in the day. The rates are on the Trip tab of the Plan page.
      </li>
    </ul>
  </section>

  <section>
    <h2>What it recommended, and where this site fits</h2>
    <p>
      The SP recommends a website where tourists simply choose the places they want and automatically get the shortest distance, plus
      the total time spent travelling and staying, as an itinerary to follow. That would let people plan before they arrive, from inside
      or outside the province. This site follows that recommendation.
    </p>
    <p>
      The authors also suggest that the Department of Tourism could use the method to plan routes, and that the local government
      could use it to see which roads most need improving.
    </p>
    <p>
      One limit to know about: Floyd–Warshall suits a small number of places, like the 15 points here. For many more locations, the
      authors suggest changing the method or using it together with others.
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
