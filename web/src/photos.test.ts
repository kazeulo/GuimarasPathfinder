/// <reference types="node" />
import { existsSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PLACES, photoOf } from './data'

const file = (i: number) => `public${photoOf(i)!.replace(/^\/?/, '/')}`

describe('place photos', () => {
  it('the port has no photo, every destination has one', () => {
    expect(photoOf(0)).toBeNull()
    for (let i = 1; i < PLACES.length; i++) expect(photoOf(i), PLACES[i].name!).toMatch(/\.webp$/)
  })

  it('every photo file exists and is a light, web-friendly size', () => {
    for (let i = 1; i < PLACES.length; i++) {
      expect(existsSync(file(i)), `${PLACES[i].name} → ${file(i)}`).toBe(true)
      expect(statSync(file(i)).size, `${PLACES[i].name} is ${Math.round(statSync(file(i)).size / 1024)} KB`).toBeLessThan(150 * 1024)
    }
  })

  it('file names are lowercase, so they also work on case-sensitive hosts', () => {
    for (let i = 1; i < PLACES.length; i++) expect(photoOf(i)).toBe(photoOf(i)!.toLowerCase())
  })
})
