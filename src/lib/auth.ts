/**
 * Auth helpers sobre Supabase Auth.
 *
 * Modelo de Pickly v1:
 *   - Login es OPCIONAL. Cualquiera puede crear/votar sin cuenta.
 *   - El ÚNICO método de login soportado es Google OAuth — arrancamos así
 *     para no depender de SMTP propio (email+password y magic link
 *     requieren mandar emails).
 *   - Los creadores que se logueen ganan:
 *       · "Mis polls" cross-device (desde get_my_polls_rpc)
 *       · Reclamo de polls creadas antes del login (claim_polls_rpc)
 *   - Votar sigue siendo por link/token, sin cuenta.
 *
 *   Nota: los helpers de email+password y magic link se removieron en
 *   esta versión. Si más adelante agregamos SMTP propio (Resend/Brevo)
 *   se pueden restaurar — viven en el git history.
 */

import toast from 'react-hot-toast'
import { supabase } from './supabase'

/**
 * Devuelve el redirect absoluto para OAuth callbacks.
 * En SSR no hay window, así que fallback a vacío (no se usa en server).
 */
function getRedirectUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/auth/callback`
}

// ------------------------------------------------------------
//  Sign-in / sign-out (solo Google OAuth)
// ------------------------------------------------------------

/**
 * Login con Google OAuth. Redirige al proveedor y vuelve a
 * /auth/callback donde el listener del AuthContext completa el login.
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
 * Logout. El listener del AuthContext limpia el estado local.
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
 * Reclama como propias las polls de la lista (solo las que están
 * user_id IS NULL en la DB). Devuelve cuántas se reclamaron efectivamente.
 *
 * Se llama después del primer login cuando hay mypolls locales con
 * role='creator'. Los tokens que no sean propios o ya tengan dueño se ignoran.
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
    // No tosteamos acá — el caller decide el UX
    console.error('[claimPolls]', error)
    return 0
  }
}

/**
 * Misma idea, pero para torneos de Versus.
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
 * Lista cross-device de las polls del user logueado.
 * Falla si el user no está autenticado.
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
 * Lista cross-device de los torneos del user logueado.
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
