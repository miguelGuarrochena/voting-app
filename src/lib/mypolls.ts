/**
 * src/lib/mypolls.ts
 * --------------------------------------------------------------
 * Manager de "mis polls" en localStorage.
 *
 * En Pickly no hay sistema de cuentas ni "mis polls en el servidor"
 * — todo se comparte por token. Como los listados del servidor se
 * eliminaron por privacidad (ver privacy-migration.sql), la UX de
 * "mis polls" se resuelve de este lado:
 *
 *   - Cuando el usuario CREA un poll → se guarda acá con role='creator'
 *   - Cuando abre un link compartido /votes/[token] (o similar)
 *     → se guarda acá con role='participant'
 *
 * Los listados `/votes`, `/ranking`, `/ratings`, `/versus` leen de acá
 * y filtran por type. Quien no tiene un token en su localStorage,
 * no ve ese poll en ningún listado.
 * --------------------------------------------------------------
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
  savedAt: string      // ISO string, cuándo se guardó en este device
}

// --- Utilidades internas ---------------------------------------

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

// --- API pública -----------------------------------------------

/**
 * Agrega (o actualiza) un poll en "mis polls". Si ya existe el mismo
 * token, NO sobrescribe si el rol actual es 'creator' (la info de
 * creador pesa más que la de participante).
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
    // Si ya figura como 'creator', no lo degradamos a 'participant'
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
 * Devuelve todos los polls guardados, opcionalmente filtrados por type.
 * Más recientes primero.
 */
export function getMyPolls(type?: MyPollType): MyPollEntry[] {
  const list = readAll()
  const filtered = type ? list.filter(p => p.type === type) : list
  return [...filtered].sort((a, b) =>
    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  )
}

/**
 * Busca un poll específico por token, o null si no está guardado.
 */
export function findMyPoll(token: string): MyPollEntry | null {
  return readAll().find(p => p.token === token) ?? null
}

/**
 * Quita un poll de "mis polls" (ej. si se borró o expiró).
 * No toca el servidor.
 */
export function removeMyPoll(token: string): void {
  const list = readAll().filter(p => p.token !== token)
  writeAll(list)
}

/**
 * Limpia entradas expiradas.
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
 * Borra todo (útil para logout o testing).
 */
export function clearMyPolls(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
