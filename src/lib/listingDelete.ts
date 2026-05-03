/**
 * Shared trash-button logic for /votes, /ranking, /ratings, /versus.
 *
 * Listing pages used to do this:
 *
 *   removeMyPoll(token)
 *   toast.success(...)
 *   refresh()
 *
 * — which only deleted from localStorage. When the user was logged in,
 * `refresh()` pulled the entry back from the server via get_my_polls_rpc
 * and the trash click effectively did nothing. See task #13.
 *
 * The fix: for entries with role='creator', actually delete on the
 * server first via deletePoll/deleteTournament. If that fails, abort
 * (db.ts has already shown an actionable toast). For 'participant'
 * entries we still only remove from localStorage — they don't own the
 * poll, they just opened a shared link.
 */
import toast from 'react-hot-toast'
import { findMyPoll, removeMyPoll, type MyPollEntry } from './mypolls'

export interface HandleListingRemoveOptions {
  token: string
  entries: MyPollEntry[]
  /** Server-side delete (deletePoll for polls, deleteTournament for versus). */
  serverDelete: (token: string) => Promise<boolean>
  /** Translated "Removed" string for the success toast. */
  removedLabel: string
  /** Caller's refresh function — re-fetches the listing. */
  onAfter: () => void | Promise<void>
}

export async function handleListingRemove(
  opts: HandleListingRemoveOptions
): Promise<void> {
  const { token, entries, serverDelete, removedLabel, onAfter } = opts
  // Look up the entry in the in-memory listing first; fall back to the
  // localStorage tracker so we still work right after a fresh navigation
  // when state hasn't fully populated.
  const entry = entries.find((e) => e.token === token) ?? findMyPoll(token)

  if (entry?.role === 'creator') {
    const ok = await serverDelete(token)
    if (!ok) return // serverDelete already showed an error toast
  }

  removeMyPoll(token)
  toast.success(removedLabel)
  await onAfter()
}
