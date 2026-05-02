/**
 * Auth helpers for Supabase Auth.
 *
 * Pickly v1 model:
 *   - Login is OPTIONAL. Anyone can create/vote without an account.
 *   - The ONLY supported login method is Google OAuth — we started this way
 *     to avoid depending on our own SMTP (email+password and magic link
 *     require sending emails).
 *   - Creators who log in gain:
 *       · "My polls" cross-device (from get_my_polls_rpc)
 *       · Claim of polls created before login (claim_polls_rpc)
 *   - Voting remains link/token-based, no account needed.
 *
 *   Note: email+password and magic link helpers were removed in
 *   this version. If we add our own SMTP later (Resend/Brevo)
 *   they can be restored — they live in the git history.
 */

import toast from 'react-hot-toast'
import { supabase } from './supabase'

/**
 * Returns the absolute redirect URL for OAuth callbacks.
 * In SSR there's no window, so we fall back to empty string (not used on server).
 */
function getRedirectUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/auth/callback`
}

// ------------------------------------------------------------
//  Sign-in / sign-out (Google OAuth only)
// ------------------------------------------------------------

/**
 * Login with Google OAuth. Redirects to the provider and returns to
 * /auth/callback where the AuthContext listener completes the login.
 */
export async function signInWithGoogle(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
      },
    })
    if (error) throw error
    return true
  } catch (error: any) {
    toast.error(error?.message || 'No se pudo iniciar sesión con Google')
    return false
  }
}

/**
 * Logout. The AuthContext listener cleans up local state.
 */
export async function signOut(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  } catch (error: any) {
    toast.error(error?.message || 'No se pudo cerrar sesión')
    return false
  }
}

// ------------------------------------------------------------
//  Server-side helpers (RPCs de la migración v5)
// ------------------------------------------------------------

/**
 * Claims the polls in the list as owned (only those with
 * user_id IS NULL in the DB). Returns how many were actually claimed.
 *
 * Called after first login when there are local mypolls with
 * role='creator'. Tokens that aren't owned or already have an owner are ignored.
 */
export async function claimPolls(tokens: string[]): Promise<number> {
  try {
    if (tokens.length === 0) return 0
    const { data, error } = await supabase.rpc('claim_polls_rpc', {
      p_tokens: tokens,
    })
    if (error) throw error
    return typeof data === 'number' ? data : 0
  } catch (error: any) {
    // Don't toast here — let the caller decide the UX
    console.error('[claimPolls]', error)
    return 0
  }
}

/**
 * Same idea, but for Versus tournaments.
 */
export async function claimTournaments(tokens: string[]): Promise<number> {
  try {
    if (tokens.length === 0) return 0
    const { data, error } = await supabase.rpc('claim_tournaments_rpc', {
      p_tokens: tokens,
    })
    if (error) throw error
    return typeof data === 'number' ? data : 0
  } catch (error: any) {
    console.error('[claimTournaments]', error)
    return 0
  }
}

/**
 * Cross-device list of polls owned by the logged-in user.
 * Fails if the user is not authenticated.
 */
export async function getMyPollsFromServer(): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('get_my_polls_rpc')
    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('[getMyPollsFromServer]', error)
    return []
  }
}

/**
 * Cross-device list of tournaments owned by the logged-in user.
 */
export async function getMyTournamentsFromServer(): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('get_my_tournaments_rpc')
    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('[getMyTournamentsFromServer]', error)
    return []
  }
}
