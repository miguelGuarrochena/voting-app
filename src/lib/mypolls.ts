/**
 * src/lib/mypolls.ts
 *
 * "My polls" tracker, stored in localStorage.
 *
 * Pickly doesn't have user accounts or a server-side "my polls" list —
 * everything is shared by token. Because the server listings were removed
 * for privacy reasons (see privacy-migration.sql), the "my polls" UX lives
 * entirely on the client:
 *
 *   - When the user CREATES a poll → save it here with role='creator'
 *   - When the user opens a shared /votes/[token] (or similar) link
 *     → save it here with role='participant'
 *
 * The `/votes`, `/ranking`, `/ratings`, `/versus` listings read from here
 * and filter by type. Anyone without the token in localStorage simply
 * won't see that poll in any listing.
 */

const STORAGE_KEY = 'pickly_mypolls'

export type MyPollType = 'vote' | 'ranking' | 'rating' | 'versus'
export type MyPollRole = 'creator' | 'participant'

export interface MyPollEntry {
  token: string
  type: MyPollType
  title: string
  role: MyPollRole
  createdBy?: string
  expiresAt?: string   // ISO string
  savedAt: string      // ISO string, when it was saved on this device
}

// --- Internal helpers ------------------------------------------

function readAll(): MyPollEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list: MyPollEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('Could not save mypolls:', e)
  }
}

// --- Public API ------------------------------------------------

/**
 * Add (or update) a poll in "my polls". If an entry with the same
 * token already exists, we do NOT overwrite when the current role is
 * 'creator' — being the creator outranks being a participant.
 */
export function addMyPoll(
  entry: Omit<MyPollEntry, 'savedAt'> & { savedAt?: string }
): void {
  const list = readAll()
  const existingIdx = list.findIndex(p => p.token === entry.token)

  const newEntry: MyPollEntry = {
    ...entry,
    savedAt: entry.savedAt ?? new Date().toISOString()
  }

  if (existingIdx >= 0) {
    const existing = list[existingIdx]
    // If it's already flagged 'creator', don't downgrade to 'participant'
    if (existing.role === 'creator' && newEntry.role === 'participant') {
      return
    }
    list[existingIdx] = { ...existing, ...newEntry }
  } else {
    list.unshift(newEntry)
  }

  writeAll(list)
}

/**
 * Return every saved poll, optionally filtered by type. Newest first.
 */
export function getMyPolls(type?: MyPollType): MyPollEntry[] {
  const list = readAll()
  const filtered = type ? list.filter(p => p.type === type) : list
  return [...filtered].sort((a, b) =>
    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  )
}

/**
 * Look up a specific poll by token, or null if it isn't saved.
 */
export function findMyPoll(token: string): MyPollEntry | null {
  return readAll().find(p => p.token === token) ?? null
}

/**
 * Remove a poll from "my polls" (e.g. when it was deleted or expired).
 * Doesn't touch the server.
 */
export function removeMyPoll(token: string): void {
  const list = readAll().filter(p => p.token !== token)
  writeAll(list)
}

/**
 * Drop expired entries.
 */
export function pruneExpiredMyPolls(): void {
  const now = Date.now()
  const list = readAll().filter(p => {
    if (!p.expiresAt) return true
    return new Date(p.expiresAt).getTime() > now
  })
  writeAll(list)
}

/**
 * Wipe everything (useful for logout / testing).
 */
export function clearMyPolls(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
