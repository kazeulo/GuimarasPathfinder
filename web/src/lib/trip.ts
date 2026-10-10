import { engine } from '../algo'
import { toMinutes } from '../algo/helpers'
import type { FwResult, TourResult } from '../algo/types'
import { PLACES, SPEED_KMH } from '../data'

// The port plus every ticked place.
export const stopsFrom = (selected: boolean[]): number[] => [
  0,
  ...selected.flatMap((s, i) => (i > 0 && s ? [i] : [])),
]

export const planTour = (fw: FwResult, selected: boolean[]): TourResult =>
  engine.nearestNeighbor(fw.dist, 0, stopsFrom(selected), true)

export interface Leg {
  from: number
  to: number
  km: number
  driveMin: number
  arrive: number // minutes since midnight of day 1
  stayMin: number
  leave: number
  isReturn: boolean
}

export interface Schedule {
  legs: Leg[]
  km: number
  driveMin: number
  stayMin: number
  totalMin: number
  endMin: number
}

// Turn a tour into a timetable: drive, arrive, stay, leave, drive...
export function buildSchedule(tour: TourResult, startMin: number): Schedule {
  let t = startMin
  let km = 0
  let driveTotal = 0
  let stayTotal = 0
  const legs: Leg[] = tour.steps.map((s) => {
    const driveMin = toMinutes(s.d, SPEED_KMH)
    const arrive = t + driveMin
    const stayMin = s.isReturn ? 0 : PLACES[s.to].stay
    const leave = arrive + stayMin
    t = leave
    km += s.d
    driveTotal += driveMin
    stayTotal += stayMin
    return { from: s.from, to: s.to, km: s.d, driveMin, arrive, stayMin, leave, isReturn: s.isReturn }
  })
  return { legs, km, driveMin: driveTotal, stayMin: stayTotal, totalMin: driveTotal + stayTotal, endMin: t }
}

// 8:05 AM, with "(next day)" once the trip runs past midnight.
export function clock(mins: number): string {
  const total = Math.round(mins)
  const day = Math.floor(total / 1440)
  const m = ((total % 1440) + 1440) % 1440
  const h24 = Math.floor(m / 60)
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const mm = String(m % 60).padStart(2, '0')
  const text = `${h12}:${mm} ${h24 < 12 ? 'AM' : 'PM'}`
  return day >= 1 ? `${text} (day ${day + 1})` : text
}

// "2 h 5 min", rounded to whole minutes, for everyday reading.
export function duration(mins: number): string {
  const total = Math.round(mins)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
