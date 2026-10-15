import { describe, expect, it } from 'vitest'
import { PEEK_PX, clamp, nearestSnap, nextSnap, prevSnap, sheetHeights } from './sheet'

describe('bottom sheet heights', () => {
  it('peeks at a fixed height and opens to half and most of the screen', () => {
    expect(sheetHeights(800)).toEqual({ peek: PEEK_PX, half: 400, full: 704 })
  })

  it('stays usable on a very short screen', () => {
    const h = sheetHeights(300)
    expect(h.peek).toBeLessThan(h.half)
    expect(h.half).toBeLessThan(h.full)
  })
})

describe('where the sheet comes to rest', () => {
  const h = sheetHeights(800)

  it('settles at the closest height when let go', () => {
    expect(nearestSnap(150, h)).toBe('peek')
    expect(nearestSnap(380, h)).toBe('half')
    expect(nearestSnap(690, h)).toBe('full')
  })

  it('a quick upward flick carries it further', () => {
    expect(nearestSnap(200, h, 1.5)).toBe('half')
    expect(nearestSnap(420, h, 1.5)).toBe('full')
  })

  it('a quick downward flick closes it', () => {
    expect(nearestSnap(420, h, -1.5)).toBe('peek')
  })
})

describe('tap and keys', () => {
  it('a tap opens it step by step and then closes it', () => {
    expect(nextSnap('peek')).toBe('half')
    expect(nextSnap('half')).toBe('full')
    expect(nextSnap('full')).toBe('peek')
  })

  it('arrow down steps it back down', () => {
    expect(prevSnap('full')).toBe('half')
    expect(prevSnap('half')).toBe('peek')
    expect(prevSnap('peek')).toBe('peek')
  })

  it('clamp keeps a drag between its limits', () => {
    expect(clamp(5, 10, 20)).toBe(10)
    expect(clamp(25, 10, 20)).toBe(20)
    expect(clamp(15, 10, 20)).toBe(15)
  })
})
