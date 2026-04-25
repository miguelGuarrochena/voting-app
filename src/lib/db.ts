import { supabase } from './supabase'
import toast from 'react-hot-toast'

// ============================================================
//  ACCESO A LA BASE DE DATOS
// ------------------------------------------------------------
//  Las LECTURAS (SELECT) van todas por funciones RPC definidas
//  en Supabase con SECURITY DEFINER. Cada una exige el token.
//  Ver: supabase/privacy-migration.sql
//
//  Las ESCRITURAS (insert/update/delete) van por la API directa,
//  usando las policies permisivas de RLS.
// ============================================================

// ------------------------------------------------------------
//  Helper: log detallado de errores de Supabase.
//  Antes mostrábamos "Error de conexión" genérico — inútil
//  para debuggear 401/RLS/JWT inválido/migration faltante.
//  Ahora dumpeamos el objeto completo y elegimos un mensaje
//  amigable según el status.
// ------------------------------------------------------------
function logSupabaseError(context: string, error: any): string {
  // Dump completo a consola (code, message, hint, details, status)
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

  // 401 → auth / clave inválida
  if (status === 401 || code === 'PGRST301' || code === '401') {
    return 'Error de autenticación con la base de datos. Revisá que la migración esté aplicada y la API key sea válida.'
  }
  // 403 / 42501 → RLS bloqueó la operación
  if (status === 403 || code === '42501') {
    return 'Operación bloqueada por permisos. Puede que falte correr la migración.'
  }
  // 404 → RPC no existe
  if (status === 404 || code === 'PGRST202') {
    return 'Función no encontrada en la base. Correr la migración de privacidad.'
  }
  // Network / offline
  if (error?.message?.toLowerCase().includes('failed to fetch')) {
    return 'No se pudo conectar al servidor. Revisá tu conexión.'
  }

  // Fallback — mostramos el mensaje real si existe
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

    // description / cover_image están disponibles desde la migración
    // supabase/content-v3.sql. Solo las mandamos si el usuario las cargó.
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

    // No usamos .select() acá: con RLS bloqueando SELECT directo,
    // el RETURNING no funciona. El token ya lo tenemos nosotros.
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

    // La RPC devuelve SETOF polls → array (0 o 1 filas)
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null

    return {
      ...row,
      expiresAt: row.expires_at,
      closedAt: row.closed_at ?? null,
      createdBy: row.created_by,
      // alias camelCase para campos opcionales (pueden no existir si la
      // migración content-v3.sql no fue aplicada todavía).
      coverImage: row.cover_image ?? null,
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
    // ------------------------------------------------------------
    //  Pasa por el edge route /api/submit/poll-response, que valida
    //  Turnstile + extrae el IP, hashea, y llama a la RPC con guard
    //  de rate limit. Antes acá llamábamos supabase.rpc('submit_response_rpc')
    //  directo — sin captcha y sin IP, lo que dejaba la puerta abierta a
    //  spam de votos.
    // ------------------------------------------------------------
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
      // body no JSON — usamos el código por status
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
    // Usa la RPC delete_poll_rpc (SECURITY DEFINER) que valida ownership:
    //   - polls con user_id => solo el dueño (auth.uid() = user_id)
    //   - polls anónimos    => cualquiera con el token (mismo modelo
    //                          que voto/edit anónimo)
    // Esto reemplaza el .from('polls').delete().eq('token', token) que
    // dependía de una policy abierta USING (true).
    const { data, error } = await supabase.rpc('delete_poll_rpc', {
      p_token: token,
    })

    if (error) {
      if (error.message?.includes('forbidden')) {
        toast.error('No tenés permiso para borrar esta encuesta')
        return false
      }
      throw error
    }
    return data === true
  } catch (error) {
    toast.error(logSupabaseError('deletePoll', error))
    return false
  }
}

// ------------------------------------------------------------
//  closePoll / updatePollTitle
//  Requieren la migración supabase/features-v2.sql:
//    - policy polls_update (permite UPDATE sobre polls)
//    - ajuste en get_poll_by_token (no filtrar expirados)
//  Ver docs/SUPABASE_PENDING.md
// ------------------------------------------------------------

/**
 * Cierra un poll inmediatamente seteando closed_at = now().
 * Usa la RPC close_poll_rpc (SECURITY DEFINER) para saltar RLS.
 * La UI ya sabe manejar el estado "terminal" (banner, bloqueo de voto, etc.).
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
 * Actualiza el título de un poll via RPC (valida que no esté cerrada).
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
 * Actualiza un poll completo (título, descripción, imagen, opciones) via RPC.
 * El RPC rechaza con 'poll_closed' si la encuesta está terminal.
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
  expiresAt: Date,
  options: any[],
  votesToWin: number,
  bracket: any,
  extras?: { description?: string; coverImage?: string }
): Promise<string | null> {
  try {
    const token = generateToken()

    const payload: Record<string, any> = {
      token,
      title,
      created_by: createdBy,
      expires_at: expiresAt.toISOString(),
      options,
      votes_to_win: votesToWin,
      bracket,
    }
    const desc = extras?.description?.trim()
    if (desc) payload.description = desc
    const cover = extras?.coverImage?.trim()
    if (cover) payload.cover_image = cover

    const { error } = await supabase.from('tournaments').insert(payload)

    if (error) throw error

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
      votesToWin: row.votes_to_win,
      coverImage: row.cover_image ?? null,
    }
  } catch (error) {
    toast.error(logSupabaseError('getTournament', error))
    return null
  }
}

export async function updateTournamentBracket(
  token: string,
  bracket: any,
  status?: 'active' | 'finished' | 'expired'
): Promise<boolean> {
  try {
    const updateData: any = { bracket }
    if (status) {
      updateData.status = status
    }

    const { error } = await supabase
      .from('tournaments')
      .update(updateData)
      .eq('token', token)

    if (error) throw error

    return true
  } catch (error) {
    toast.error(logSupabaseError('updateTournamentBracket', error))
    return false
  }
}

export async function submitDuelVote(
  tournamentToken: string,
  duelId: string,
  username: string,
  optionId: string,
  captchaToken: string | null = null
): Promise<boolean> {
  try {
    // ------------------------------------------------------------
    //  Antes hacíamos supabase.from('duel_votes').upsert(...) con la
    //  policy abierta duel_insert/duel_update. La migración anti-fraud-v6
    //  cerró esas policies y movió todo a la RPC submit_duel_vote_rpc.
    //  El edge route /api/submit/duel-vote orquesta Turnstile + IP hash
    //  + RPC, idéntico al patrón de submitResponse.
    // ------------------------------------------------------------
    const res = await fetch('/api/submit/duel-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tournamentToken,
        duelId,
        username,
        optionId,
        captchaToken,
      }),
    })

    if (res.ok) return true

    let errCode = 'internal'
    try {
      const data = await res.json()
      if (typeof data?.error === 'string') errCode = data.error
    } catch {
      // body no JSON
    }

    if (res.status === 429 || errCode === 'rate_limited') {
      toast.error('Demasiados votos desde esta red. Probá de nuevo en unos minutos.')
      return false
    }
    if (res.status === 403 || errCode === 'captcha_failed') {
      toast.error('No pudimos verificar que no seas un bot. Recargá y probá de nuevo.')
      return false
    }
    if (errCode === 'tournament_not_found') {
      toast.error('Torneo no encontrado.')
      return false
    }

    toast.error('No pudimos enviar tu voto. Intentá de nuevo.')
    return false
  } catch (error) {
    toast.error(logSupabaseError('submitDuelVote', error))
    return false
  }
}

export async function getDuelVotes(tournamentToken: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_duel_votes_by_token', { p_token: tournamentToken })

    if (error) throw error

    return data || []
  } catch (error) {
    toast.error(logSupabaseError('getDuelVotes', error))
    return []
  }
}

export async function hasVotedInDuel(
  tournamentToken: string,
  duelId: string,
  username: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('has_voted_in_duel', {
        p_token: tournamentToken,
        p_duel_id: duelId,
        p_username: username
      })

    if (error) throw error

    return Boolean(data)
  } catch (error) {
    // Esta función se llama muchas veces al renderizar — no toasteamos
    // eslint-disable-next-line no-console
    console.error('[hasVotedInDuel]', error)
    return false
  }
}

export async function deleteTournament(token: string): Promise<boolean> {
  try {
    // Mismo patrón que deletePoll: RPC con check de ownership.
    const { data, error } = await supabase.rpc('delete_tournament_rpc', {
      p_token: token,
    })

    if (error) {
      if (error.message?.includes('forbidden')) {
        toast.error('No tenés permiso para borrar este torneo')
        return false
      }
      throw error
    }
    return data === true
  } catch (error) {
    toast.error(logSupabaseError('deleteTournament', error))
    return false
  }
}

// ------------------------------------------------------------
//  closeTournament / updateTournamentTitle
//  Usan la policy tourn_update ya existente — no hace falta
//  tocar RLS para versus. Ver docs/SUPABASE_PENDING.md
// ------------------------------------------------------------

/**
 * Cierra un torneo inmediatamente: setea expires_at = now() y status='expired'.
 */
export async function closeTournament(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tournaments')
      .update({
        expires_at: new Date().toISOString(),
        status: 'expired',
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
 * Actualiza el título de un torneo.
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

// ------------------------------------------------------------
//  NOTA: getTournaments() fue eliminada a propósito.
//  Antes devolvía TODOS los torneos del mundo a cualquier visitante
//  — un leak grave de privacidad.
//  Los listados ahora leen desde localStorage (ver src/lib/mypolls.ts).
// ------------------------------------------------------------

// ============ HELPER FUNCTIONS ============

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  // crypto.getRandomValues es criptográficamente seguro,
  // a diferencia de Math.random() que era predecible.
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(7)
    crypto.getRandomValues(bytes)
    let out = ''
    for (let i = 0; i < 7; i++) {
      out += chars[bytes[i] % 62]
    }
    return out
  }

  // Fallback (no debería pasar en navegadores modernos ni en Node 19+)
  let result = ''
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
