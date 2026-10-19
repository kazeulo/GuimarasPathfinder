import { describe, expect, it } from 'vitest'
import { engine } from '../../src/algo'
import { ENTRIES, PRESETS, selectionOf } from '../../src/data'
import { buildSchedule, clock, duration, planTour } from '../../src/lib/trip'

const fw = engine.floydWarshall(ENTRIES.wharf.graph)

describe('schedule', () => {
  it('adds up to the SP totals for all 14 places', () => {
    const all = PRESETS.find((p) => p.id === 'all')!
    const s = buildSchedule(planTour(fw, selectionOf(all.nodes)), 8 * 60)
    expect(Math.round(s.km * 100) / 100).toBe(118.85)
    expect(s.stayMin).toBe(1140)
    expect(Math.round(s.totalMin * 100) / 100).toBe(1318.28) // 21 h 58.28 min
  })

  it('runs the clock forward leg by leg', () => {
    const s = buildSchedule(planTour(fw, selectionOf([4])), 8 * 60) // Smallest Plaza only
    expect(s.legs).toHaveLength(2) // there and back
    expect(s.legs[0].arrive).toBeCloseTo(8 * 60 + 1.8, 6) // 1.2 km at 40 km/h
    expect(s.legs[0].leave).toBeCloseTo(8 * 60 + 1.8 + 45, 6)
    expect(s.legs[1].isReturn).toBe(true)
  })

  it('every preset gives a complete tour', () => {
    for (const p of PRESETS) expect(planTour(fw, selectionOf(p.nodes)).complete).toBe(true)
  })

  it('an empty selection has no legs', () => {
    expect(buildSchedule(planTour(fw, selectionOf([])), 480).legs).toHaveLength(0)
  })
})

describe('time formatting', () => {
  it('formats clock times', () => {
    expect(clock(8 * 60)).toBe('8:00 AM')
    expect(clock(12 * 60 + 5)).toBe('12:05 PM')
    expect(clock(0)).toBe('12:00 AM')
    expect(clock(25 * 60 + 30)).toBe('1:30 AM (day 2)')
  })
  it('formats durations', () => {
    expect(duration(45)).toBe('45 min')
    expect(duration(120)).toBe('2 h')
    expect(duration(358.28)).toBe('5 h 58 min')
  })
})
