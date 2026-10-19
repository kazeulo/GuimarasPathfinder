# Guimaras Pathfinder (web)

Interactive companion to the SP *Application of Floyd–Warshall Algorithm in Optimizing Tour Route for Selected Tourist
Destinations in Guimaras Province* (UPV, 2023). Svelte 5 + TypeScript + Vite.

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # engine, SP-reproduction and page tests
npm run check   # type and accessibility check (svelte-check)
npm run build   # production build in dist/
```

## Three pages
1. **Plan a trip** (home, for visitors) - choose which places to see (trips start at Jordan Wharf); get a timetable with clock times,
   driving and staying time, and whether it fits the time available.
2. **How it works** - plain-language walkthrough of Floyd-Warshall (find shortcuts) and Nearest Neighbor (closest place first),
   each as an animated demo, plus a collapsed section for technical readers.
3. **About** - the SP, the data sources, and what has and hasn't been verified.

## Structure
```
src/
  data.ts            SP data: road matrix, places, stay times, presets, map positions
  algo/types.ts      the Engine interface (the contract the UI relies on)
  algo/ts-engine.ts  Floyd-Warshall + Nearest Neighbor in TypeScript
  algo/index.ts      which engine the app uses  <- swap in a Rust/WASM engine here
  algo/helpers.ts    path reconstruction, time formatting
  lib/trip.ts        turns a tour into a timetable (clock times, totals)
  lib/roads.ts       road shapes between places, for drawing on the map
  lib/mapMode.svelte.ts  remembers map vs diagram
  lib/sheet.ts       snap heights and flick logic for the phone bottom sheet
  data/roads.json    road shapes from OpenStreetMap (made by scripts/fetch-roads.mjs)
  data/island.json   the island's coastline (made by scripts/fetch-island.mjs)
  lib/island.ts      coastline and bounds, used to highlight the island and limit panning
  components/        MapPanel (map/diagram switch), RealMap (Leaflet + OpenStreetMap), MapView (SVG diagram),
                     Matrix, FloydDemo, TourDemo, Directions, ThemeToggle (.svelte)
  pages/             PlanPage, HowPage, AboutPage (.svelte)
  App.svelte         page switching (#plan, #how, #about) and shared trip state
tests/               all the automated tests, in folders that mirror src/ (algo, components, lib, pages)
```

Everything under `algo/` and `lib/` is plain TypeScript with no framework in it, so it can be reused or replaced independently
of the UI.

Tests (`npm test`) check the engine against the SP: all 225 distances in Tables 4.1 and 4.2, the Jordan Wharf tour
(118.85 km, 2 h 58.28 min), the timetable logic, and that every page renders.

## Known differences from the SP
- Jordan RoRo tour: the SP reports 118.95 km, but its own Table 4.2 (1.3 km out + 19.8 km back) gives 119.05 km.
- Whole-trip time: the Conclusion says 20 h 58.85 min; the stay times in Table 3.5 sum to 19 h, so driving + staying is 21 h 58.28 min.
- Map positions are the authors' Google Maps pins. Jordan Wharf (the SP gives no position) is the OpenStreetMap ferry terminal.
- Roads are drawn from OpenStreetMap and can differ a little from the Google Maps routes behind the SP's distances. The distances
  shown are always the SP's. `npm test` checks that no pin contradicts them (a road can't be shorter than the straight line).

## Troubleshooting
If `npm install` leaves out a native binding (`Cannot find native binding`, an npm optional-dependency bug), run
`npm install --no-save @rolldown/binding-win32-x64-msvc@<rolldown version>` (or the binding for your platform).

## Refreshing the map data
`data/island.json` (the island's coastline, used to highlight it and keep the map focused) was made once by
`node scripts/fetch-island.mjs`, which asks OpenStreetMap's Overpass API for the outline of Guimaras Island.

## Refreshing the road shapes
`data/roads.json` was made once by `node scripts/fetch-roads.mjs`, which asks the public OSRM demo server for the shape of each of the
45 roads (about a minute, one request a second). Run it again only if the pins in `data.ts` change.
