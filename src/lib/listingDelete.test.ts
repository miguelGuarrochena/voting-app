/**
 * Regression tests for the trash-button bug (task #13).
 *
 * Covers: handleListingRemove correctly calls the server delete for
 * creator entries and skips it for participant entries. If the server
 * delete fails, no further state mutation should happen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}))

import { handleListingRemove } from './listingDelete'
import { addMyPoll, getMyPolls, clearMyPolls, type MyPollEntry } from './mypolls'

const CREATOR: MyPollEntry = {
  token: 'tok-creator',
  type: 'vote',
  title: 'Mine',
  role: 'creator',
  savedAt: '2025-01-01T00:00:00.000Z',
}

const PARTICIPANT: MyPollEntry = {
  token: 'tok-shared',
  type: 'vote',
  title: 'Shared with me',
  role: 'participant',
  savedAt: '2025-01-01T00:00:00.000Z',
}

beforeEach(() => {
  toastSuccess.mockReset()
  toastError.mockReset()
  clearMyPolls()
})

describe('handleListingRemove', () => {
  it('CREATOR: calls serverDelete, removes locally, toasts success, refreshes', async () => {
    addMyPoll(CREATOR)
    const serverDelete = vi.fn().mockResolvedValue(true)
    const onAfter = vi.fn().mockResolvedValue(undefined)

    await handleListingRemove({
      token: CREATOR.token,
      entries: [CREATOR],
      serverDelete,
      removedLabel: 'Removed',
      onAfter,
    })

    expect(serverDelete).toHaveBeenCalledWith(CREATOR.token)
    expect(getMyPolls()).toEqual([]) // localStorage cleaned
    expect(toastSuccess).toHaveBeenCalledWith('Removed')
    expect(onAfter).toHaveBeenCalledTimes(1)
  })

  it('CREATOR: server failure aborts — no local removal, no toast, no refresh', async () => {
    addMyPoll(CREATOR)
    const serverDelete = vi.fn().mockResolvedValue(false)
    const onAfter = vi.fn()

    await handleListingRemove({
      token: CREATOR.token,
      entries: [CREATOR],
      serverDelete,
      removedLabel: 'Removed',
      onAfter,
    })

    expect(serverDelete).toHaveBeenCalledTimes(1)
    expect(getMyPolls()).toHaveLength(1) // still there
    expect(toastSuccess).not.toHaveBeenCalled()
    expect(onAfter).not.toHaveBeenCalled()
    // server-side error toast comes from db.ts, not from this helper —
    // we don't assert on toastError here.
  })

  it('PARTICIPANT: does NOT call serverDelete, only local removal', async () => {
    addMyPoll(PARTICIPANT)
    const serverDelete = vi.fn().mockResolvedValue(true)
    const onAfter = vi.fn()

    await handleListingRemove({
      token: PARTICIPANT.token,
      entries: [PARTICIPANT],
      serverDelete,
      removedLabel: 'Removed',
      onAfter,
    })

    expect(serverDelete).not.toHaveBeenCalled()
    expect(getMyPolls()).toEqual([])
    expect(toastSuccess).toHaveBeenCalledWith('Removed')
    expect(onAfter).toHaveBeenCalledTimes(1)
  })

  it('falls back to localStorage when entry is not in the in-memory list (race after fresh nav)', async () => {
    // Entry exists in localStorage but the listing state hasn't populated yet
    addMyPoll(CREATOR)
    const serverDelete = vi.fn().mockResolvedValue(true)
    const onAfter = vi.fn()

    await handleListingRemove({
      token: CREATOR.token,
      entries: [], // empty in-memory state
      serverDelete,
      removedLabel: 'Removed',
      onAfter,
    })

    expect(serverDelete).toHaveBeenCalledWith(CREATOR.token)
    expect(getMyPolls()).toEqual([])
  })

  it('unknown token (no entry anywhere): does not call server, still cleans locally', async () => {
    // Edge case: trash clicked on a stale token that's already gone.
    // We treat it as a no-op-but-safe path — no server call (we don't
    // know the role), local removal (no-op), success toast, refresh.
    const serverDelete = vi.fn().mockResolvedValue(true)
    const onAfter = vi.fn()

    await handleListingRemove({
      token: 'never-existed',
      entries: [],
      serverDelete,
      removedLabel: 'Removed',
      onAfter,
    })

    expect(serverDelete).not.toHaveBeenCalled()
    expect(toastSuccess).toHaveBeenCalled()
    expect(onAfter).toHaveBeenCalledTimes(1)
  })
})
