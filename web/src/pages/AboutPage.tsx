import { useMemo } from 'react'
import { engine } from '../algo'
import { fmtNum, formatMinutes, toMinutes } from '../algo/helpers'
import { ENTRIES, PLACES, PRESETS, REPO_URL, SPEED_KMH, selectionOf, type EntryKey } from '../data'
import { planTour } from '../lib/trip'

interface Row {
  what: string
  paper: string
  here: string
  ok: boolean
  note?: string
}

const all14 = selectionOf(PRESETS.find((p) => p.id === 'all')!.nodes)

function useChecks(): Row[] {
  return useMemo(() => {
    const rows: Row[] = []
    const stay = PLACES.reduce((s, p) => s + p.stay, 0)
    let wharfTravel = 0
    for (const key of Object.keys(ENTRIES) as EntryKey[]) {
      const e = ENTRIES[key]
      const fw = engine.floydWarshall(e.graph)
      const km = planTour(fw, all14).total
      const travel = toMinutes(km, SPEED_KMH)
      if (key === 'wharf') wharfTravel = travel
      const kmOk = Math.round(km * 100) / 100 === e.paperKm
      rows.push({
        what: `Tour distance from ${e.label}`,
        paper: `${fmtNum(e.paperKm)} km`,
        here: `${fmtNum(km)} km`,
        ok: kmOk,
        note: kmOk ? undefined : 'The SP’s own Table 4.2 (1.3 km out, 19.8 km back) adds up to this figure, so the printed total looks like a slip.',
      })
      rows.push({
        what: `Driving time from ${e.label}`,
        paper: e.paperTravel,
        here: formatMinutes(travel),
        ok: formatMinutes(travel) === e.paperTravel,
      })
    }
    rows.push({
      what: 'Whole trip including time at every place (Jordan Wharf)',
      paper: '20 h 58.85 min',
      here: formatMinutes(stay + wharfTravel),
      ok: false,
      note: 'The SP’s own time-at-place table (Table 3.5) adds up to 19 h, plus 2 h 58.28 min of driving.',
    })
    return rows
  }, [])
}

export function AboutPage() {
  const rows = useChecks()

  return (
    <article className="page">
      <header className="page-head">
        <h1>About this project</h1>
        <p className="lead">
          Guimaras Pathfinder is a proof-of-concept, interaction version of an undergraduate SP by Bernardo, Lozada, and Manejo (2023). It helps a visitor to Guimaras plan a day around the
          island&rsquo;s most popular places, and it lets anyone see how the Special ProblemGuimaras Pathfinder is an interactive version of a university SP. It helps a visitor to Guimaras plan a day around the island’s most popular places, and it lets anyone see how the SP’s method works and check its results.&rsquo;s method works and check its results.
        </p>
      </header>

      <aside className="notice" aria-label="What has and has not been verified">
        <h2>What has been verified, and what hasn&rsquo;t</h2>
        <ul className="plain">
          <li>
            <strong>The algorithm is verified.</strong> Its results (the shortest distances and the Jordan Wharf tour) match the SP&rsquo;s
            tables, checked by automated tests.
          </li>
          <li>
            <strong>This website is not verified.</strong> The pages, the map layout, the timetables and how it behaves on different
            devices have not been independently reviewed or tested with real users. Treat it as a guide, not a guarantee.
          </li>
        </ul>
        <p className="muted small">
          The distances and time estimates are the SP&rsquo;s own and have not been re-measured.
        </p>
      </aside>

      <section>
        <h2>The SP</h2>
        <p>
          <em>Application of Floyd–Warshall Algorithm in Optimizing Tour Route for Selected Tourist Destinations in Guimaras Province</em>,
          a special problem for the Bachelor of Science in Applied Mathematics at the University of the Philippines Visayas, June 2023,
          by Rhona Pauline A. Bernardo, Angellyn B. Lozada and Kzcl Jay R. Manejo.
        </p>
        <p>
          Its aim: help tourists spend more of their time enjoying places and less of it travelling between them, by finding the
          shortest road between every pair of 14 popular destinations and suggesting a route that visits them all.
        </p>
      </section>

      <section>
        <h2>Where the information comes from</h2>
        <ul className="plain">
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
            <strong>Vehicle prices:</strong> collected from local drivers for the SP.
          </li>
        </ul>
      </section>

      <section>
        <h2>Does this app reproduce the SP?</h2>
        <p>
          <strong>The distances do, exactly.</strong> Automated tests compare all 225 shortest distances for Jordan Wharf (Table 4.1) and
          for Jordan RoRo Port (Table 4.2) with the SP, and every one matches. The Jordan Wharf tour is also identical: the same
          stops in the same order.
        </p>
        <p>The table below is computed live in your browser. Two printed totals in the SP do not add up, and they are flagged here.</p>

        <div className="table-wrap">
          <table className="checks">
            <thead>
              <tr><th>Result</th><th>SP says</th><th>This app</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.what} className={r.ok ? 'ok' : 'differs'}>
                  <td>
                    {r.what}
                    {r.note && <small>{r.note}</small>}
                  </td>
                  <td>{r.paper}</td>
                  <td>{r.here}</td>
                  <td className="status">{r.ok ? 'Matches' : 'Differs'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Please keep in mind</h2>
        <ul className="plain">
          <li>This is a research demonstration, not a navigation app. Check local conditions before you travel.</li>
          <li>Routes are shown on a simple diagram of the island, not on a true map, and times are estimates.</li>
          <li>Opening hours, entrance fees and road conditions are not included.</li>
        </ul>
      </section>

      <section>
        <h2>Built with</h2>
        <p>
          React and TypeScript. The original Python program from the SP&rsquo;s appendix is kept in the project&rsquo;s
          <code> python</code> folder, and the code in this app is tested against it.
        </p>
        <p>
          The source code is open on{' '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
      </section>
    </article>
  )
}
