/**
 * src/lib/mypollsHybrid.ts
 * --------------------------------------------------------------
 * "My polls" list that combines localStorage (current device)
 * + server (all polls I own cross-device) when
 * the user is logged in.
 *
 * Design:
 *   - Anon user: only reads from localStorage (original behavior).
 *   - Logged-in user: merges localStorage + server RPC.
 *     · Deduped by token.
 *     · Server wins on canonical fields (title, expiresAt, etc.)
 *       because it's the source of truth.
 *     · Local `savedAt` is preserved if it existed for sorting.
 *     · Everything from server is role='creator' (the RPC
 *       filters WHERE user_id = auth.uid()).
 *
 * This module imports from the supabase client, so it can't be
 * used in server components. The listings /votes, /ranking, etc.
 * are already client components.
 * --------------------------------------------------------------
 */

import { getMyPolls, type MyPollEntry, type MyPollType } from './mypolls'
import { getMyPollsFromServer, getMyTournamentsFromServer } from './auth'

// ------------------------------------------------------------
//  Shapes
// ------------------------------------------------------------

interface ServerPollRow {
  token: string
  type: 'vote' | 'ranking' | 'rating'
  title: string
  created_by?: string | null
  expires_at?: string | null
  created_at?: string | null
}

interface ServerTournamentRow {
  token: string
  title: string
  created_by?: string | null
  expires_at?: string | null
  created_at?: string | null
}

// ------------------------------------------------------------
//  Mapping helpers
// ------------------------------------------------------------

function serverPollToEntry(row: ServerPollRow): MyPollEntry {
  return {
    token: row.token,
    type: row.type as MyPollType,
    title: row.title,
    role: 'creator',
    createdBy: row.created_by ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    savedAt: row.created_at ?? new Date().toISOString(),
  }
}

function serverTournamentToEntry(row: ServerTournamentRow): MyPollEntry {
  return {
    token: row.token,
    type: 'versus',
    title: row.title,
    role: 'creator',
    createdBy: row.created_by ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    savedAt: row.created_at ?? new Date().toISOString(),
  }
}

function mergeByToken(
  local: MyPollEntry[],
  server: MyPollEntry[]
): MyPollEntry[] {
  const byToken = new Map<string, MyPollEntry>()

  // First local, so we can override with server while preserving savedAt
  for (const e of local) {
    byToken.set(e.token, e)
  }

  for (const s of server) {
    const existing = byToken.get(s.token)
    if (existing) {
      // Preserve the local savedAt if it was older (stable sort)
      const savedAt =
        new Date(existing.savedAt).getTime() < new Date(s.savedAt).getTime()
          ? existing.savedAt
          : s.savedAt
      byToken.set(s.token, {
        ...existing,
        ...s,
        savedAt,
      })
    } else {
      byToken.set(s.token, s)
    }
  }

  return Array.from(byToken.values()).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  )
}

// ------------------------------------------------------------
//  Public API
// ------------------------------------------------------------

/**
 * Returns the hybrid list (local + server if logged in).
 * If `isLoggedIn` is false, it's equivalent to getMyPolls(type).
 */
export async function getMyPollsHybrid(
  type: MyPollType | undefined,
  isLoggedIn: boolean
): Promise<MyPollEntry[]> {
  const local = getMyPolls(type)

  if (!isLoggedIn) return local

  // Logged in: also fetch from server.
  // For 'versus' we go to tournaments, the rest to polls.
  const wantsVersus = type === 'versus' || type === undefined
  const wantsPolls = type !== 'versus' // vote/ranking/rating/undefined

  const [pollRows, tournamentRows] = await Promise.all([
    wantsPolls
      ? getMyPollsFromServer().then((rows) => rows as ServerPollRow[])
      : Promise.resolve([] as ServerPollRow[]),
    wantsVersus
      ? getMyTournamentsFromServer().then(
          (rows) => rows as ServerTournamentRow[]
        )
      : Promise.resolve([] as ServerTournamentRow[]),
  ])

  const serverEntries: MyPollEntry[] = [
    ...pollRows.map(serverPollToEntry),
    ...tournamentRows.map(serverTournamentToEntry),
  ].filter((e) => !type || e.type === type)

  return mergeByToken(local, serverEntries)
}
