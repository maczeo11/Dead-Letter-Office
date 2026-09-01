import { describe, it, expect } from 'vitest'
import { computeScore, SOFT_WEIGHT } from './score.js'

describe('computeScore weighted hard + 0.3*soft', () => {
  it('empty → 100', () => expect(computeScore(0, 0, 0)).toBe(100))
  it('all valid → 100', () => expect(computeScore(100, 0, 0)).toBe(100))
  it('10 hard of 100 → 90', () => expect(computeScore(100, 10, 0)).toBe(90))
  it('10 soft of 100 → 97 (0.3 weight)', () => expect(computeScore(100, 0, 10)).toBe(97)) // 100 - (3/100*100)
  it('10 hard + 10 soft → 87', () => expect(computeScore(100, 10, 10)).toBe(87)) // 100 - (13/100*100)
  it('soft weight respected', () => {
    const s = computeScore(10, 0, 3) // 0.9 soft
    expect(s).toBe(91) // 100 - 9
  })
})
