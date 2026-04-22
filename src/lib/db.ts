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

// ============ POLLS ============

export async function createPoll(
  type: 'vote' | 'ranking' | 'rating',
  title: string,
  createdBy: string,
  expiresAt: Date,
  options: any[]
): Promise<string | null> {
  try {
    const token = generateToken()

    // No usamos .select() acá: con RLS bloqueando SELECT directo,
    // el RETURNING no funciona. El token ya lo tenemos nosotros.
    const { error } = await supabase
      .from('polls')
      .insert({
        token,
        type,
        title,
        created_by: createdBy,
        expires_at: expiresAt.toISOString(),
        options
      })

    if (error) throw error

    return token
  } catch (error) {
    console.error('Error creating poll:', error)
    toast.error('Error de conexión, intenta de nuevo')
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
      createdBy: row.created_by
    }
  } catch (error) {
    console.error('Error fetching poll:', error)
    toast.error('Error de conexión, intenta de nuevo')
    return null
  }
}

export async function submitResponse(
  pollToken: string,
  username: string,
  response: any
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('poll_responses')
      .upsert({
        poll_token: pollToken,
        username,
        response
      }, {
        onConflict: 'poll_token,username'
      })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error submitting response:', error)
    toast.error('Error de conexión, intenta de nuevo')
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
    console.error('Error fetching poll responses:', error)
    toast.error('Error de conexión, intenta de nuevo')
    return []
  }
}

export async function deletePoll(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('token', token)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting poll:', error)
    toast.error('Error de conexión, intenta de nuevo')
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
  bracket: any
): Promise<string | null> {
  try {
    const token = generateToken()

    const { error } = await supabase
      .from('tournaments')
      .insert({
        token,
        title,
        created_by: createdBy,
        expires_at: expiresAt.toISOString(),
        options,
        votes_to_win: votesToWin,
        bracket
      })

    if (error) throw error

    return token
  } catch (error) {
    console.error('Error creating tournament:', error)
    toast.error('Error de conexión, intenta de nuevo')
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
      votesToWin: row.votes_to_win
    }
  } catch (error) {
    console.error('Error fetching tournament:', error)
    toast.error('Error de conexión, intenta de nuevo')
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
    console.error('Error updating tournament bracket:', error)
    toast.error('Error de conexión, intenta de nuevo')
    return false
  }
}

export async function submitDuelVote(
  tournamentToken: string,
  duelId: string,
  username: string,
  optionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('duel_votes')
      .upsert({
        tournament_token: tournamentToken,
        duel_id: duelId,
        username,
        option_id: optionId
      }, {
        onConflict: 'tournament_token,duel_id,username'
      })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error submitting duel vote:', error)
    toast.error('Error de conexión, intenta de nuevo')
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
    console.error('Error fetching duel votes:', error)
    toast.error('Error de conexión, intenta de nuevo')
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
    console.error('Error checking duel vote:', error)
    return false
  }
}

export async function deleteTournament(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('token', token)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting tournament:', error)
    toast.error('Error de conexión, intenta de nuevo')
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
