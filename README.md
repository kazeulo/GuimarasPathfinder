# Guimaras Pathfinder

Plan a day around Guimaras's most popular places, and see how the route is worked out.

Guimaras Pathfinder is an interactive version of an undergraduate special problem (SP): **"Application of Floyd–Warshall
Algorithm in Optimizing Tour Route for Selected Tourist Destinations in Guimaras Province"** by Bernardo, Lozada and Manejo
(University of the Philippines Visayas, 2023). It has two purposes:

* **For visitors:** pick where you start and the places you want to see, and get a route with clock times and a check on whether it
  fits the time you have.
* **For the SP:** show how its method works, step by step, in plain language.

> **Please note.** The calculations are verified: they give the same results as the Special Problem's paper. This website is not verified. It has not
> been formally checked or tested, so please use it as a guide only.

## Run it

You need [Node.js](https://nodejs.org) 20.19 or newer (22.12+ also works).

```bash
cd web
npm install
npm run dev
```

Then open **http://localhost:5173**. Stop it with `Ctrl+C`.

Other commands, also run from `web/`:

| Command | What it does |
|---|---|
| `npm test` | Runs the automated tests |
| `npm run check` | Type and accessibility check |
| `npm run build` | Builds the finished site into `web/dist`, ready to host anywhere that serves static files |
| `npm run preview` | Serves the built site locally |

If `npm install` fails with *"Cannot find native binding"*, see the troubleshooting note in [`web/README.md`](web/README.md).

## What's in the app

| Page | What it does |
|---|---|
| **Plan a trip** | A full-screen map with a floating panel (a bottom sheet on phones). Search and choose the places to visit, or click pins on the map. You get a timetable with driving and staying time at each stop, whether it fits your day, and what hiring a vehicle costs. Every trip starts at Jordan Wharf. |
| **How it works** | A plain-language, animated walkthrough of the two methods behind the route, with a collapsed section for technical readers. |
| **About** | The SP, where the data comes from, and what has and hasn't been verified. |

The site follows your device's light or dark setting, and the button in the top corner switches between them. Your choice is
remembered in your browser.

## How the route is worked out

1. **Floyd–Warshall** finds the shortest road distance between *every* pair of the 15 places (the port plus 14 destinations), even
   where no direct road exists. It repeatedly asks whether going through a third place would be quicker.
2. **Nearest Neighbor** builds the tour: start at the port, always drive to the closest place not yet visited, then return to the
   port. It is a quick rule of thumb, not a guarantee of the absolute shortest order.
3. Driving time assumes a steady 40 km/h. Time at each place is the SP's estimate for that type of place.

## How it compares with the SP

* All 225 shortest distances match the SP's Table 4.1 (Jordan Wharf) and Table 4.2 (Jordan RoRo Port), checked by automated tests.
* The Jordan Wharf tour matches exactly: 118.85 km, or 2 h 58.28 min of driving.
* Two totals printed in the SP don't agree with its own tables. This app uses the figures the tables add up to:
  * the Jordan RoRo tour is printed as 118.95 km, but Table 4.2 (1.3 km out and 19.8 km back) gives **119.05 km**;
  * the whole trip is printed as 20 h 58.85 min, but the stay times in Table 3.5 add up to 19 h, so driving plus staying is
    **21 h 58.28 min**.

## Project layout

| Folder | What it is |
|---|---|
| [`web/`](web/) | The website, built with Svelte, TypeScript and Vite. See [`web/README.md`](web/README.md) for the code structure. |
| [`python/`](python/) | The original command-line program from the SP's appendix, kept as the reference implementation. |

### The Python program

```bash
python python/main.py
```

A text menu to (1) show the shortest path between two places, (2) list all shortest paths, (3) build a Nearest Neighbor tour, or
(4) exit. Places are numbered 1–15, where 1 is the port. It needs only Python 3, with no extra packages.

## Limitations

* Roads on the map come from OpenStreetMap and can differ a little from the Google Maps routes behind the SP's distances. The distances
  and times shown are always the SP's own.
* Distances and travel times are the SP's own (Google Maps road distances at a steady 40 km/h). Traffic, opening hours and fees
  aren't included.
* Only 14 of Guimaras's 131 listed tourist destinations are covered.
* This is a research demonstration, not a navigation app.

## Credits

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Road shapes were fetched once from the public
[OSRM](https://project-osrm.org) demo server (`web/scripts/fetch-roads.mjs`), so the site itself makes no routing requests.

## Source

[github.com/kazeulo/GuimarasPathfinder](https://github.com/kazeulo/GuimarasPathfinder)
