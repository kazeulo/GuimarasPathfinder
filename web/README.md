# Guimaras Pathfinder (web)

Interactive companion to the paper *Application of Floyd–Warshall Algorithm in Optimizing Tour Route for
Selected Tourist Destinations in Guimaras Province* (UPV, 2023). React + TypeScript + Vite.

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # engine + render tests
npm run build
```

## Three pages
1. **Plan a trip** (home, for visitors) - choose where the trip starts and which places to see; get a timetable with clock times,
   driving and staying time, and whether it fits the time available.
2. **How it works** - plain-language walkthrough of Floyd-Warshall (find shortcuts) and Nearest Neighbor (closest place first),
   each as an animated demo, plus a collapsed section for technical readers.
3. **About** - the SP, the data sources, and a live table comparing this app's results with the SP's printed numbers.

## Structure
```
src/
  data.ts            paper data: road matrix, places, stay times, presets, map positions
  algo/types.ts      the Engine interface (the contract the UI relies on)
  algo/ts-engine.ts  Floyd-Warshall + Nearest Neighbor in TypeScript
  algo/index.ts      which engine the app uses  <- swap in a Rust/WASM engine here
  algo/helpers.ts    path reconstruction, time formatting
  lib/trip.ts        turns a tour into a timetable (clock times, totals)
  components/        MapView (SVG), Matrix, FloydDemo, TourDemo, Directions
  pages/             PlanPage, HowPage, AboutPage
```

Tests (`npm test`) check the engine against the SP: all 225 distances in Tables 4.1 and 4.2, the Jordan Wharf tour
(118.85 km, 2 h 58.28 min), and that every page renders.

## Known differences from the paper
- Jordan RoRo tour: the paper reports 118.95 km, but its own Table 4.2 (1.3 km out + 19.8 km back) gives 119.05 km.
- Whole-trip time: the Conclusion says 20 h 58.85 min; the stay times in Table 3.5 sum to 19 h, so driving + staying is 21 h 58.28 min.
- The map is schematic, with positions traced from Figure 3.1 – not real coordinates.

## Troubleshooting
If `npm install` leaves out a native binding (`Cannot find native binding`, an npm optional-dependency bug), run
`npm install --no-save @rolldown/binding-win32-x64-msvc@<rolldown version>` (or the binding for your platform).
