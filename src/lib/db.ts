import { supabase } from './supabase'
import toast from 'react-hot-toast'

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
    
    const { data, error } = await supabase
      .from('polls')
      .insert({
        token,
        type,
        title,
        created_by: createdBy,
        expires_at: expiresAt.toISOString(),
        options
      })
      .select('token')
      .single()

    if (error) throw error
    
    return data.token
  } catch (error) {
    console.error('Error creating poll:', error)
    toast.error('Error de conexión, intenta de nuevo')
    return null
  }
}

export async function getPoll(token: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('token', token)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return null
    }

    return {
      ...data,
      expiresAt: data.expires_at,
      createdBy: data.created_by
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
      .from('poll_responses')
      .select('*')
      .eq('poll_token', pollToken)

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
    
    const { data, error } = await supabase
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
      .select('token')
      .single()

    if (error) throw error
    
    return data.token
  } catch (error) {
    console.error('Error creating tournament:', error)
    toast.error('Error de conexión, intenta de nuevo')
    return null
  }
}

export async function getTournament(token: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('token', token)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return {
      ...data,
      expiresAt: data.expires_at,
      createdBy: data.created_by,
      votesToWin: data.votes_to_win
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
      .from('duel_votes')
      .select('*')
      .eq('tournament_token', tournamentToken)

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
      .from('duel_votes')
      .select('id')
      .eq('tournament_token', tournamentToken)
      .eq('duel_id', duelId)
      .eq('username', username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return false // Not found
      }
      throw error
    }
    
    return !!data
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

export async function getTournaments(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(tournament => ({
      ...tournament,
      expiresAt: tournament.expires_at,
      createdBy: tournament.created_by,
      votesToWin: tournament.votes_to_win
    }))
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    toast.error('Error de conexión, intenta de nuevo')
    return []
  }
}

// ============ HELPER FUNCTIONS ============

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
