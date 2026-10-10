# Guimaras Pathfinder

[GitHub repository](https://github.com/kazeulo/GuimarasPathfinder)

An interactive companion to the SP **"Application of Floyd–Warshall Algorithm in Optimizing Tour Route for Selected Tourist
Destinations in Guimaras Province"** (Bernardo, Lozada & Manejo, University of the Philippines Visayas, 2023).

It has two goals:

* **For visitors:** plan a day around 14 of Guimaras's most-visited places, with a route, clock times, and a check on whether it
  fits the time available.
* **For the SP:** show how the method works, and let anyone check that the results reproduce the SP's.

> **What has been verified, and what hasn't.** The *algorithm* is verified: its results (the shortest distances and the Jordan Wharf
> tour) match the SP's tables, checked by automated tests. The *website* is not: its pages, map layout, timetables and behaviour on
> different devices have not been independently reviewed or tested with real users. Treat it as a guide, not a guarantee. The
> distances and time estimates are the SP's own and have not been re-measured.

## The web app

Three pages, written for non-technical readers:

| Page | What it does |
|---|---|
| **Plan a trip** | Choose where you start (Jordan Wharf or Jordan RoRo Port) and the places you want to see. Get a timetable with driving and staying time, and whether it fits your day. |
| **How it works** | Plain-language, animated walkthrough of the two methods, with a collapsed section for technical readers. |
| **About** | The SP, the data sources, and a live table comparing this app's results with the SP's printed numbers. |

### Run it

Requires Node.js 20.19+ (or 22.12+).

```bash
cd web
npm install
npm run dev      # http://localhost:5173
npm test         # engine, SP-reproduction and page tests
npm run build    # production build in web/dist
```

See [`web/README.md`](web/README.md) for the code structure and troubleshooting.

## How it works, in short

1. **Floyd–Warshall** finds the shortest road distance between *every* pair of the 15 places (the port plus 14 destinations),
   even where no direct road exists. It does this by repeatedly asking whether going through a third place is quicker.
2. **Nearest Neighbor** builds a tour: start at the port, always drive to the closest place not yet visited, and return to the port.
   It is a quick rule of thumb, not a guarantee of the absolute shortest order.
3. Driving time assumes a constant 40 km/h; time at each place is the SP's estimate by type of place.

## Does it reproduce the SP?

* All 225 shortest distances match Table 4.1 (Jordan Wharf) and Table 4.2 (Jordan RoRo Port). This is tested automatically.
* The Jordan Wharf tour matches exactly: 118.85 km and 2 h 58.28 min of driving.
* Two printed totals in the SP do not agree with its own tables, and the app flags them:
  * the Jordan RoRo tour is printed as 118.95 km, but Table 4.2 (1.3 km out + 19.8 km back) gives **119.05 km**;
  * the whole-trip time is printed as 20 h 58.85 min, but the stay times in Table 3.5 add up to 19 h, so driving plus staying is
    **21 h 58.28 min**.

## Repository layout

| Folder | What it is |
|---|---|
| [`web/`](web/) | The React + TypeScript + Vite web app. |
| [`python/`](python/) | The original command-line program from the SP's Appendix B. Kept as the reference implementation. |

### The Python command-line program

```bash
python python/main.py
```

A menu to (1) show the shortest path between two places, (2) list all shortest paths, (3) build a Nearest Neighbor tour, or
(4) exit. Places are numbered 1–15, where 1 is the port.

## Current limitations

* The map is a simple diagram traced from the SP's Figure 3.1, not a real map. Real map integration is planned.
* Distances and travel times are the SP's (Google Maps distances at a steady 40 km/h), with no traffic, opening hours or fees.
* This is a research demonstration, not a navigation app.
