import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateToken,
  generateShareLink,
  isExpired,
  isTerminal,
  getTimeRemaining,
  formatTimeRemaining,
  storePollData,
  getPollData,
  hasVoted,
  markAsVoted,
  cleanupLocalStorage,
} from './token'

describe('generateToken', () => {
  it('returns a 7-char alphanumeric string', () => {
    const t = generateToken()
    expect(t).toHaveLength(7)
    expect(t).toMatch(/^[A-Za-z0-9]{7}$/)
  })

  it('generates different tokens across calls (with overwhelming probability)', () => {
    const set = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(set.size).toBeGreaterThan(95)
  })
})

describe('generateShareLink', () => {
  it('routes vote to /votes/:token', () => {
    expect(generateShareLink('abc', 'vote')).toMatch(/\/votes\/abc$/)
  })
  it('routes ranking to /ranking/:token', () => {
    expect(generateShareLink('abc', 'ranking')).toMatch(/\/ranking\/abc$/)
  })
  it('routes rating to /ratings/:token', () => {
    expect(generateShareLink('abc', 'rating')).toMatch(/\/ratings\/abc$/)
  })
  it('routes versus to /versus/:token', () => {
    expect(generateShareLink('abc', 'versus')).toMatch(/\/versus\/abc$/)
  })
})

describe('isExpired / isTerminal', () => {
  it('isExpired returns true for a past date', () => {
    expect(isExpired(new Date(Date.now() - 1000))).toBe(true)
  })
  it('isExpired returns false for a future date', () => {
    expect(isExpired(new Date(Date.now() + 60_000))).toBe(false)
  })

  it('isTerminal: closedAt always wins (even if expiresAt is in the future)', () => {
    const future = new Date(Date.now() + 60_000)
    expect(isTerminal(future, new Date())).toBe(true)
    expect(isTerminal(future, '2020-01-01T00:00:00Z')).toBe(true)
  })

  it('isTerminal: with no closedAt, falls back to isExpired', () => {
    expect(isTerminal(new Date(Date.now() - 1000))).toBe(true)
    expect(isTerminal(new Date(Date.now() + 60_000))).toBe(false)
    expect(isTerminal(new Date(Date.now() + 60_000), null)).toBe(false)
  })
})

describe('getTimeRemaining', () => {
  it('is positive for future', () => {
    expect(getTimeRemaining(new Date(Date.now() + 5000))).toBeGreaterThan(0)
  })
  it('is negative or zero for past', () => {
    expect(getTimeRemaining(new Date(Date.now() - 5000))).toBeLessThanOrEqual(0)
  })
})

describe('formatTimeRemaining', () => {
  it('returns em-dash for non-positive', () => {
    expect(formatTimeRemaining(0)).toBe('—')
    expect(formatTimeRemaining(-100)).toBe('—')
  })
  it('returns days when >= 1 day', () => {
    expect(formatTimeRemaining(2 * 24 * 60 * 60 * 1000)).toBe('2d')
  })
  it('returns hours when < 1 day, >= 1 hour', () => {
    expect(formatTimeRemaining(3 * 60 * 60 * 1000)).toBe('3h')
  })
  it('returns minutes when < 1 hour, >= 1 minute', () => {
    expect(formatTimeRemaining(45 * 60 * 1000)).toBe('45m')
  })
  it('returns seconds when < 1 minute', () => {
    expect(formatTimeRemaining(30 * 1000)).toBe('30s')
  })
})

describe('localStorage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('storePollData + getPollData round-trips', () => {
    storePollData('abc', { hello: 'world' }, 'vote')
    expect(getPollData('abc', 'vote')).toEqual({ hello: 'world' })
  })
  it('getPollData returns null for missing key', () => {
    expect(getPollData('zzz', 'vote')).toBeNull()
  })

  it('hasVoted is false until markAsVoted is called', () => {
    expect(hasVoted('abc', 'vote')).toBe(false)
    markAsVoted('abc', 'vote')
    expect(hasVoted('abc', 'vote')).toBe(true)
  })

  it('hasVoted is per (token, type) — voting on a vote does not mark a ranking', () => {
    markAsVoted('abc', 'vote')
    expect(hasVoted('abc', 'ranking')).toBe(false)
  })

  it('cleanupLocalStorage removes all pickly_* keys but keeps pickly_username', () => {
    window.localStorage.setItem('pickly_username', 'miguel')
    window.localStorage.setItem('pickly_vote_abc', '{}')
    window.localStorage.setItem('pickly_voted_vote_abc', 'now')
    window.localStorage.setItem('pickly_versus_xyz', '{}')
    window.localStorage.setItem('unrelated_key', 'keep')

    cleanupLocalStorage()

    expect(window.localStorage.getItem('pickly_username')).toBe('miguel')
    expect(window.localStorage.getItem('unrelated_key')).toBe('keep')
    expect(window.localStorage.getItem('pickly_vote_abc')).toBeNull()
    expect(window.localStorage.getItem('pickly_voted_vote_abc')).toBeNull()
    expect(window.localStorage.getItem('pickly_versus_xyz')).toBeNull()
  })
})
