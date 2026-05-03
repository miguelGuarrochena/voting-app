import { describe, it, expect, beforeEach } from 'vitest'
import {
  addMyPoll,
  getMyPolls,
  findMyPoll,
  removeMyPoll,
  pruneExpiredMyPolls,
  clearMyPolls,
} from './mypolls'

const VOTE = (overrides: Partial<Parameters<typeof addMyPoll>[0]> = {}) => ({
  token: 'tok-1',
  type: 'vote' as const,
  title: 'Pizza Friday',
  role: 'creator' as const,
  ...overrides,
})

describe('mypolls (localStorage tracker)', () => {
  beforeEach(() => {
    clearMyPolls()
  })

  it('addMyPoll persists a new entry and getMyPolls returns it', () => {
    addMyPoll(VOTE())
    const list = getMyPolls()
    expect(list).toHaveLength(1)
    expect(list[0].token).toBe('tok-1')
    expect(list[0].savedAt).toBeTruthy()
  })

  it('getMyPolls filters by type', () => {
    addMyPoll(VOTE({ token: 't-vote' }))
    addMyPoll(VOTE({ token: 't-rank', type: 'ranking' }))
    expect(getMyPolls('vote').map((p) => p.token)).toEqual(['t-vote'])
    expect(getMyPolls('ranking').map((p) => p.token)).toEqual(['t-rank'])
  })

  it('getMyPolls returns newest first', () => {
    addMyPoll(VOTE({ token: 'a', savedAt: '2024-01-01T00:00:00.000Z' }))
    addMyPoll(VOTE({ token: 'b', savedAt: '2025-01-01T00:00:00.000Z' }))
    addMyPoll(VOTE({ token: 'c', savedAt: '2023-01-01T00:00:00.000Z' }))
    expect(getMyPolls().map((p) => p.token)).toEqual(['b', 'a', 'c'])
  })

  it('addMyPoll merges (same token) and does not duplicate', () => {
    addMyPoll(VOTE({ title: 'old' }))
    addMyPoll(VOTE({ title: 'new' }))
    const list = getMyPolls()
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('new')
  })

  it('does NOT downgrade creator -> participant', () => {
    addMyPoll(VOTE({ role: 'creator', title: 'mine' }))
    addMyPoll(VOTE({ role: 'participant', title: 'someone else opened it' }))
    const entry = findMyPoll('tok-1')
    expect(entry?.role).toBe('creator')
    // existing fields stay because the participant write was a no-op
    expect(entry?.title).toBe('mine')
  })

  it('DOES upgrade participant -> creator (re-create same token)', () => {
    addMyPoll(VOTE({ role: 'participant', title: 'shared link' }))
    addMyPoll(VOTE({ role: 'creator', title: 'now owner' }))
    const entry = findMyPoll('tok-1')
    expect(entry?.role).toBe('creator')
    expect(entry?.title).toBe('now owner')
  })

  it('findMyPoll returns null when token unknown', () => {
    expect(findMyPoll('nope')).toBeNull()
  })

  it('removeMyPoll only removes the matching token', () => {
    addMyPoll(VOTE({ token: 'a' }))
    addMyPoll(VOTE({ token: 'b' }))
    removeMyPoll('a')
    expect(getMyPolls().map((p) => p.token)).toEqual(['b'])
  })

  it('removeMyPoll on unknown token is a no-op', () => {
    addMyPoll(VOTE({ token: 'a' }))
    removeMyPoll('zzz')
    expect(getMyPolls()).toHaveLength(1)
  })

  it('pruneExpiredMyPolls drops expired entries and keeps no-expiry ones', () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    const future = new Date(Date.now() + 60_000).toISOString()
    addMyPoll(VOTE({ token: 'expired', expiresAt: past }))
    addMyPoll(VOTE({ token: 'live', expiresAt: future }))
    addMyPoll(VOTE({ token: 'forever' }))
    pruneExpiredMyPolls()
    expect(getMyPolls().map((p) => p.token).sort()).toEqual(['forever', 'live'])
  })

  it('clearMyPolls wipes everything', () => {
    addMyPoll(VOTE({ token: 'a' }))
    addMyPoll(VOTE({ token: 'b' }))
    clearMyPolls()
    expect(getMyPolls()).toEqual([])
  })

  it('survives a corrupted localStorage payload', () => {
    window.localStorage.setItem('pickly_mypolls', '{not valid json')
    expect(getMyPolls()).toEqual([])
    // and writing on top of corruption recovers
    addMyPoll(VOTE())
    expect(getMyPolls()).toHaveLength(1)
  })
})
