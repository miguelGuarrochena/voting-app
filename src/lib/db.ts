import { supabase } from './supabase'
import toast from 'react-hot-toast'

// Database access layer.
// Reads (SELECT) all go through RPC functions defined in Supabase with
// SECURITY DEFINER. Each one requires the token.
// See: supabase/privacy-migration.sql
//
// Writes (insert/update/delete) go through the direct API, relying on
// the permissive RLS policies.

// Detailed Supabase error logger.
// We used to show a generic "connection error" — useless for debugging
// 401 / RLS / invalid JWT / missing migration. Now we dump the full
// object and pick a friendly message based on the status.
function logSupabaseError(context: string, error: any): string {
  // Full console dump (code, message, hint, details, status)
  // eslint-disable-next-line no-console
  console.log(`[${context}] Error details:`, {
    'error === null': error === null,
    'error === undefined': error === undefined,
    'typeof error': typeof error,
    'errorType': error?.constructor?.name,
    'errorString': String(error),
    'message': error?.message,
    'code': error?.code,
    'status': error?.status,
    'statusCode': error?.statusCode,
    'raw keys': error ? Object.keys(error) : [],
    'raw': error,
  })
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
    statusCode: error?.statusCode,
    errorType: error?.constructor?.name,
    errorString: String(error),
    raw: error,
  })

  // Handle null/undefined errors
  if (!error) {
    return 'Error desconocido al conectar con la base de datos'
  }

  const status = error?.status || error?.statusCode
  const code = error?.code

  // 401 → auth / invalid key
  if (status === 401 || code === 'PGRST301' || code === '401') {
    return 'Error de autenticación con la base de datos. Revisá que la migración esté aplicada y la API key sea válida.'
  }
  // 403 / 42501 → RLS blocked the operation
  if (status === 403 || code === '42501') {
    return 'Operación bloqueada por permisos. Puede que falte correr la migración.'
  }
  // 404 → RPC doesn't exist
  if (status === 404 || code === 'PGRST202') {
    return 'Función no encontrada en la base. Correr la migración de privacidad.'
  }
  // Network / offline
  if (error?.message?.toLowerCase().includes('failed to fetch')) {
    return 'No se pudo conectar al servidor. Revisá tu conexión.'
  }

  // Fallback — show the real message if we have one
  return error?.message
    ? `Error: ${error.message}`
    : 'Error de conexión, intenta de nuevo'
}

// ============ POLLS ============

export async function createPoll(
  type: 'vote' | 'ranking' | 'rating',
  title: string,
  createdBy: string,
  expiresAt: Date,
  options: any[],
  extras?: { description?: string; coverImage?: string }
): Promise<string | null> {
  try {
    const token = generateToken()

    // description / cover_image were added in supabase/content-v3.sql.
    // Only send them if the user actually filled something in.
    const payload: Record<string, any> = {
      token,
      type,
      title,
      created_by: createdBy,
      expires_at: expiresAt.toISOString(),
      options,
    }
    const desc = extras?.description?.trim()
    if (desc) payload.description = desc
    const cover = extras?.coverImage?.trim()
    if (cover) payload.cover_image = cover

    // No .select() here: with RLS blocking direct SELECT, RETURNING
    // doesn't come back. We already generated the token client-side.
    const { error } = await supabase.from('polls').insert(payload)

    if (error) throw error

    return token
  } catch (error) {
    toast.error(logSupabaseError('createPoll', error))
    return null
  }
}

export async function getPoll(token: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_poll_by_token', { p_token: token })

    if (error) throw error

    // The RPC returns SETOF polls → array of 0 or 1 rows
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null

    return {
      ...row,
      expiresAt: row.expires_at,
      closedAt: row.closed_at ?? null,
      createdBy: row.created_by,
      // camelCase aliases for optional fields (may be absent if the
      // content-v3.sql migration hasn't been applied yet).
      coverImage: row.cover_image ?? null,
      // Server-side owner. NULL means anonymous poll (anyone with the
      // token can delete). When set, only that auth.uid() can delete —
      // the UI uses this to detect identity mismatches up front.
      userId: row.user_id ?? null,
    }
  } catch (error) {
    toast.error(logSupabaseError('getPoll', error))
    return null
  }
}

export async function submitResponse(
  pollToken: string,
  username: string,
  response: any,
  captchaToken: string | null = null
): Promise<boolean> {
  try {
    // Goes through the edge route /api/submit/poll-response, which
    // validates Turnstile, extracts and hashes the IP, and calls the RPC
    // with a rate-limit guard. Originally we called submit_response_rpc
    // directly from here — no captcha, no IP — which left the door open
    // to vote spam.
    const res = await fetch('/api/submit/poll-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pollToken,
        username,
        response,
        captchaToken,
      }),
    })

    if (res.ok) return true

    let errCode = 'internal'
    try {
      const data = await res.json()
      if (typeof data?.error === 'string') errCode = data.error
    } catch {
      // non-JSON body — fall back to mapping by status code
    }

    if (res.status === 429 || errCode === 'rate_limited') {
      toast.error('Demasiados votos desde esta red. Probá de nuevo en unos minutos.')
      return false
    }
    if (res.status === 403 || errCode === 'captcha_failed') {
      toast.error('No pudimos verificar que no seas un bot. Recargá y probá de nuevo.')
      return false
    }
    if (errCode === 'poll_closed') {
      toast.error('La encuesta está cerrada, no se aceptan más respuestas.')
      return false
    }
    if (errCode === 'poll_not_found') {
      toast.error('Encuesta no encontrada.')
      return false
    }
    if (errCode === 'empty_username') {
      toast.error('Ingresá un nombre antes de votar.')
      return false
    }

    toast.error('No pudimos enviar tu voto. Intentá de nuevo.')
    return false
  } catch (error) {
    toast.error(logSupabaseError('submitResponse', error))
    return false
  }
}

export async function getPollResponses(pollToken: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_poll_responses_by_token', { p_token: pollToken })

    if (error) throw error

    return data || []
  } catch (error) {
    toast.error(logSupabaseError('getPollResponses', error))
    return []
  }
}

export async function deletePoll(token: string): Promise<boolean> {
  try {
    // Uses the delete_poll_rpc (SECURITY DEFINER) which checks ownership:
    //   - polls with user_id => only the owner (auth.uid() = user_id)
    //   - anonymous polls    => anyone with the token (same model used
    //                           for anonymous voting / editing)
    // Replaces the old .from('polls').delete().eq('token', token), which
    // relied on an open USING (true) policy.
    const { data, error } = await supabase.rpc('delete_poll_rpc', {
      p_token: token,
    })

    // Diagnostic — tells us at a glance whether the RPC actually
    // returned success or a wrapped/null result that the code below
    // would otherwise swallow.
    // eslint-disable-next-line no-console
    console.log('[deletePoll] token:', token, '| data:', data, '| error:', error)

    if (error) {
      // 'forbidden' = the poll has an owner and the current session
      // can't prove it. Two common cases (treated identically here):
      //   1) User isn't logged in.
      //   2) User is logged in with a different account.
      // We surface an actionable toast based on the local session.
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('forbidden') || error.code === 'P0001') {
        const { data: sessionData } = await supabase.auth.getSession()
        const loggedIn = !!sessionData?.session?.user?.id
        toast.error(
          loggedIn
            ? 'Esta encuesta fue creada con otra cuenta. Iniciá sesión con esa cuenta para borrarla.'
            : 'Esta encuesta es de una cuenta. Iniciá sesión con esa cuenta para poder borrarla.'
        )
        return false
      }
      throw error
    }
    // The RPC returns boolean. true = something was deleted (or was
    // already gone). Anything falsy here means the row is still there
    // for a non-error reason — surface a message instead of silently
    // looking like the click did nothing.
    if (data !== true) {
      toast.error('No pudimos borrar la encuesta. Recargá la página y probá de nuevo.')
      return false
    }
    return true
  } catch (error) {
    toast.error(logSupabaseError('deletePoll', error))
    return false
  }
}

// closePoll / updatePollTitle
// Both require the supabase/features-v2.sql migration:
//   - polls_update policy (allows UPDATE on polls)
//   - get_poll_by_token tweak (don't filter expired)
// See docs/SUPABASE_PENDING.md

/**
 * Close a poll immediately by setting closed_at = now().
 * Uses close_poll_rpc (SECURITY DEFINER) to bypass RLS.
 * The UI already handles the "terminal" state (banner, vote lock, etc.).
 */
export async function closePoll(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('close_poll_rpc', {
      p_token: token,
    })

    if (error) throw error
    return data === true
  } catch (error) {
    toast.error(logSupabaseError('closePoll', error))
    return false
  }
}

/**
 * Update a poll's title via RPC (validates the poll isn't closed).
 */
export async function updatePollTitle(token: string, title: string): Promise<boolean> {
  try {
    const clean = title.trim()
    if (!clean) return false

    const { error } = await supabase.rpc('update_poll_title_rpc', {
      p_token: token,
      p_title: clean,
    })

    if (error) {
      if (error.message?.includes('poll_closed')) {
        toast.error('La encuesta está cerrada, no se puede editar.')
        return false
      }
      throw error
    }
    return true
  } catch (error) {
    toast.error(logSupabaseError('updatePollTitle', error))
    return false
  }
}

/**
 * Update a full poll (title, description, image, options) via RPC.
 * The RPC rejects with 'poll_closed' if the poll is terminal.
 */
export async function updatePoll(
  token: string,
  data: {
    title: string
    description?: string
    coverImage?: string
    options?: any[]
  }
): Promise<boolean> {
  try {
    const trimmedDesc = data.description?.trim()
    const trimmedCover = data.coverImage?.trim()

    const { error } = await supabase.rpc('update_poll_rpc', {
      p_token: token,
      p_title: data.title.trim(),
      p_description: data.description !== undefined ? (trimmedDesc || null) : null,
      p_cover: data.coverImage !== undefined ? (trimmedCover || null) : null,
      p_options: data.options !== undefined ? data.options : null,
      p_clear_desc: data.description !== undefined && !trimmedDesc,
      p_clear_cover: data.coverImage !== undefined && !trimmedCover,
    })

    if (error) {
      if (error.message?.includes('poll_closed')) {
        toast.error('La encuesta está cerrada, no se puede editar.')
        return false
      }
      throw error
    }
    return true
  } catch (error) {
    toast.error(logSupabaseError('updatePoll', error))
    return false
  }
}

// ============ TOURNAMENTS ============

export async function createTournament(
  title: string,
  createdBy: string,
  mode: 'bracket' | 'league',
  hasScore: boolean,
  players: any[],
  matches: any[],
  expiresAt: Date,
  extras?: { description?: string; coverImage?: string }
): Promise<string | null> {
  try {
    const token = generateToken()

    const payload: Record<string, any> = {
      token,
      title,
      created_by: createdBy,
      mode,
      has_score: hasScore,
      players,
      matches,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    }
    const desc = extras?.description?.trim()
    if (desc) payload.description = desc
    const cover = extras?.coverImage?.trim()
    if (cover) payload.cover_image = cover

    const { error } = await supabase.from('tournaments').insert(payload)

    if (error) {
      // Aggressive diagnostics: the browser was logging an empty '{}'.
      // Force each property as its own console.error arg (browsers never
      // collapse separate args) plus a visible toast.
      const e = error as any
      const dumpStr = (() => {
        try {
          return JSON.stringify(e, Object.getOwnPropertyNames(e), 2)
        } catch {
          return String(e)
        }
      })()

      // eslint-disable-next-line no-console
      console.error('[createTournament] type:', typeof e, '| isError:', e instanceof Error, '| ctor:', e?.constructor?.name)
      // eslint-disable-next-line no-console
      console.error('[createTournament] message:', e?.message)
      // eslint-disable-next-line no-console
      console.error('[createTournament] code:', e?.code)
      // eslint-disable-next-line no-console
      console.error('[createTournament] details:', e?.details)
      // eslint-disable-next-line no-console
      console.error('[createTournament] hint:', e?.hint)
      // eslint-disable-next-line no-console
      console.error('[createTournament] String(error):', String(e))
      // eslint-disable-next-line no-console
      console.error('[createTournament] keys:', Object.keys(e ?? {}))
      // eslint-disable-next-line no-console
      console.error('[createTournament] ownProps:', Object.getOwnPropertyNames(e ?? {}))
      // eslint-disable-next-line no-console
      console.error('[createTournament] dumpStr:', dumpStr)

      // Visible toast with the real message (truncated to 300 chars)
      const visible = e?.message || dumpStr || String(e)
      toast.error(`DB error: ${String(visible).slice(0, 300)}`)

      throw error
    }

    return token
  } catch (error) {
    toast.error(logSupabaseError('createTournament', error))
    return null
  }
}

export async function getTournament(token: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_tournament_by_token', { p_token: token })

    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null

    return {
      ...row,
      expiresAt: row.expires_at,
      createdBy: row.created_by,
      mode: row.mode,
      hasScore: row.has_score,
      players: row.players,
      matches: row.matches,
      status: row.status,
      coverImage: row.cover_image ?? null,
      // See getPoll for the rationale — server-side owner, used to
      // detect identity mismatches before attempting destructive ops.
      userId: row.user_id ?? null,
    }
  } catch (error) {
    toast.error(logSupabaseError('getTournament', error))
    return null
  }
}

export async function updateMatchResult(
  token: string,
  matchId: string,
  result: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('update_match_result_rpc', {
      p_token: token,
      p_match_id: matchId,
      p_result: result,
    })

    if (error) {
      if (error.message?.includes('rate_limited')) {
        toast.error('Demasiadas actualizaciones. Esperá un momento.')
        return false
      }
      if (error.message?.includes('tournament_finished')) {
        toast.error('El torneo ya terminó, no se pueden ingresar más resultados.')
        return false
      }
      if (error.message?.includes('tournament_expired')) {
        toast.error('El torneo expiró.')
        return false
      }
      if (error.message?.includes('match_not_ready')) {
        toast.error('Falta cargar el resultado de la ronda anterior.')
        return false
      }
      if (error.message?.includes('match_not_found')) {
        toast.error('No encontramos ese partido.')
        return false
      }
      throw error
    }
    return data === true
  } catch (error) {
    toast.error(logSupabaseError('updateMatchResult', error))
    return false
  }
}

export async function advanceBracketRound(
  token: string,
  roundNumber: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('advance_bracket_round_rpc', {
      p_token: token,
      p_round_number: roundNumber,
    })

    if (error) {
      if (error.message?.includes('tournament_finished')) {
        toast.error('El torneo ya terminó.')
        return false
      }
      if (error.message?.includes('round_not_complete')) {
        toast.error('Completá todos los partidos de esta ronda antes de avanzar.')
        return false
      }
      if (error.message?.includes('draw_not_allowed_in_bracket')) {
        toast.error('En llaves no puede haber empates: corregí el resultado para definir un ganador.')
        return false
      }
      throw error
    }
    return data === true
  } catch (error) {
    toast.error(logSupabaseError('advanceBracketRound', error))
    return false
  }
}

export async function deleteTournament(token: string): Promise<boolean> {
  try {
    // Same pattern as deletePoll: RPC with an ownership check.
    const { data, error } = await supabase.rpc('delete_tournament_rpc', {
      p_token: token,
    })

    if (error) {
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('forbidden') || error.code === 'P0001') {
        const { data: sessionData } = await supabase.auth.getSession()
        const loggedIn = !!sessionData?.session?.user?.id
        toast.error(
          loggedIn
            ? 'Este torneo fue creado con otra cuenta. Iniciá sesión con esa cuenta para borrarlo.'
            : 'Este torneo es de una cuenta. Iniciá sesión con esa cuenta para poder borrarlo.'
        )
        return false
      }
      throw error
    }
    if (data !== true) {
      toast.error('No pudimos borrar el torneo. Recargá la página y probá de nuevo.')
      return false
    }
    return true
  } catch (error) {
    toast.error(logSupabaseError('deleteTournament', error))
    return false
  }
}

// closeTournament / updateTournamentTitle
// Both use the existing tourn_update policy — no extra RLS work needed
// for versus. See docs/SUPABASE_PENDING.md

/**
 * Close a tournament immediately: sets expires_at = now() and status='finished'.
 *
 * NOTE: we use 'finished' (not 'expired') because:
 *  - The CHECK constraint on tournaments allows 'active' | 'finished' | 'expired',
 *    but the UI filters on 'finished' to show the champion banner.
 *  - Consistent with the bracket finishing on its own (advance_bracket_round_rpc
 *    also marks the tournament as 'finished').
 */
export async function closeTournament(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tournaments')
      .update({
        expires_at: new Date().toISOString(),
        status: 'finished',
      })
      .eq('token', token)

    if (error) throw error
    return true
  } catch (error) {
    toast.error(logSupabaseError('closeTournament', error))
    return false
  }
}

/**
 * Update a tournament's title.
 */
export async function updateTournamentTitle(token: string, title: string): Promise<boolean> {
  try {
    const clean = title.trim()
    if (!clean) return false

    const { error } = await supabase
      .from('tournaments')
      .update({ title: clean })
      .eq('token', token)

    if (error) throw error
    return true
  } catch (error) {
    toast.error(logSupabaseError('updateTournamentTitle', error))
    return false
  }
}

// NOTE: getTournaments() was removed on purpose.
// It used to return EVERY tournament to every visitor — a serious
// privacy leak. Listings now read from localStorage instead
// (see src/lib/mypolls.ts).

// ============ HELPER FUNCTIONS ============

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  // crypto.getRandomValues is cryptographically secure,
  // unlike Math.random() which was predictable.
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(7)
    crypto.getRandomValues(bytes)
    let out = ''
    for (let i = 0; i < 7; i++) {
      out += chars[bytes[i] % 62]
    }
    return out
  }

  // Fallback (shouldn't happen on modern browsers or Node 19+)
  let result = ''
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
