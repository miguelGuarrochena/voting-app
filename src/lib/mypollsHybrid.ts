/**
 * src/lib/mypollsHybrid.ts
 * --------------------------------------------------------------
 * Lista "mis polls" que combina localStorage (dispositivo actual)
 * + server (todas las polls que me pertenecen cross-device) cuando
 * el usuario está logueado.
 *
 * Diseño:
 *   - Anon user: solo lee localStorage (comportamiento original).
 *   - Logged-in user: mergea localStorage + server RPC.
 *     · Dedupe por token.
 *     · Server gana en campos canónicos (title, expiresAt, etc.)
 *       porque es la fuente de verdad.
 *     · Se preserva `savedAt` del local si existía para ordenar.
 *     · Todo lo que venga del server es role='creator' (el RPC
 *       filtra WHERE user_id = auth.uid()).
 *
 * Este módulo importa del cliente supabase, así que no se puede
 * usar en server components. Los listados /votes, /ranking, etc.
 * ya son client components.
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

  // Primero local, para poder sobreescribir con server preservando savedAt
  for (const e of local) {
    byToken.set(e.token, e)
  }

  for (const s of server) {
    const existing = byToken.get(s.token)
    if (existing) {
      // Preservamos el savedAt local si era más viejo (orden estable)
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
//  API pública
// ------------------------------------------------------------

/**
 * Devuelve la lista híbrida (local + server si logueado).
 * Si `isLoggedIn` es false, es equivalente a getMyPolls(type).
 */
export async function getMyPollsHybrid(
  type: MyPollType | undefined,
  isLoggedIn: boolean
): Promise<MyPollEntry[]> {
  const local = getMyPolls(type)

  if (!isLoggedIn) return local

  // Logged in: traemos también del server.
  // Para 'versus' vamos a tournaments, el resto a polls.
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
