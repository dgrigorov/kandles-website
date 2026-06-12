import { describe, it, expect } from 'vitest'
import { getCurrentSeason, getCurrentMonth } from './seasonal'

describe('getCurrentSeason', () => {
  it('returns winter for December', () => {
    expect(getCurrentSeason(new Date('2025-12-15'))).toBe('winter')
  })
  it('returns winter for January', () => {
    expect(getCurrentSeason(new Date('2025-01-10'))).toBe('winter')
  })
  it('returns winter for February', () => {
    expect(getCurrentSeason(new Date('2025-02-28'))).toBe('winter')
  })
  it('returns spring for March', () => {
    expect(getCurrentSeason(new Date('2025-03-01'))).toBe('spring')
  })
  it('returns spring for May', () => {
    expect(getCurrentSeason(new Date('2025-05-31'))).toBe('spring')
  })
  it('returns summer for June', () => {
    expect(getCurrentSeason(new Date('2025-06-01'))).toBe('summer')
  })
  it('returns summer for August', () => {
    expect(getCurrentSeason(new Date('2025-08-31'))).toBe('summer')
  })
  it('returns autumn for September', () => {
    expect(getCurrentSeason(new Date('2025-09-01'))).toBe('autumn')
  })
  it('returns autumn for November', () => {
    expect(getCurrentSeason(new Date('2025-11-30'))).toBe('autumn')
  })
})

describe('getCurrentMonth', () => {
  it('returns correct 1-based month', () => {
    expect(getCurrentMonth(new Date('2025-06-15'))).toBe(6)
    expect(getCurrentMonth(new Date('2025-01-01'))).toBe(1)
    expect(getCurrentMonth(new Date('2025-12-31'))).toBe(12)
  })
})
