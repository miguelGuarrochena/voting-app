/**
 * Cloudflare Turnstile — types + server verifier.
 *
 * Setup:
 *   - Create site at https://dash.cloudflare.com → Turnstile → Add Site.
 *   - Mode: "Managed" (CF decides whether interaction is needed).
 *   - Copy Site Key → NEXT_PUBLIC_TURNSTILE_SITE_KEY (Vercel + .env.local)
 *   - Copy Secret Key → TURNSTILE_SECRET (only on Vercel)
 *
 *   Dev test keys (no Cloudflare account needed):
 *     Site key:   1x00000000000000000000AA  (always passes)
 *     Secret:     1x0000000000000000000000000000000AA
 *
 *   When env vars aren't set, the code degrades gracefully:
 *   client skips the challenge, server skips verification.
 *
 * Client widget mounting lives in src/hooks/useTurnstile.ts —
 * an in-page persistent widget so a managed challenge can render
 * in front of the user on mobile (an off-screen invisible widget
 * was the cause of the "stuck on submit → bot" bug).
 */

// ------------------------------------------------------------
//  Types — shared between hook and any future caller
// ------------------------------------------------------------

export interface TurnstileRenderOptions {
  sitekey: string
  action?: string
  callback?: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
  size?: 'normal' | 'compact' | 'flexible' | 'invisible'
  appearance?: 'always' | 'execute' | 'interaction-only'
  retry?: 'auto' | 'never'
  theme?: 'light' | 'dark' | 'auto'
}

declare global {
  interface Window {
    turnstile?: {
      ready?: (cb: () => void) => void
      render: (
        container: string | HTMLElement,
        options: TurnstileRenderOptions
      ) => string | undefined
      execute: (
        widgetIdOrContainer: string | HTMLElement,
        options?: { sitekey?: string; action?: string }
      ) => void
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
      getResponse: (widgetId?: string) => string | undefined
    }
  }
}

export const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// ------------------------------------------------------------
//  SERVER — verifyTurnstile()
// ------------------------------------------------------------

interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

/**
 * Validates a Turnstile token against Cloudflare. Returns true if OK.
 *
 * If TURNSTILE_SECRET isn't set, degrades to true (dev mode).
 * This is logged so it's obvious in production if it happens.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  secret: string | undefined,
  ip?: string
): Promise<boolean> {
  if (!secret) {
    // Dev mode: skip
    console.warn(
      '[turnstile] TURNSTILE_SECRET not set — skipping verification (dev mode).'
    )
    return true
  }
  if (!token) return false

  const body = new URLSearchParams()
  body.append('secret', secret)
  body.append('response', token)
  if (ip) body.append('remoteip', ip)

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body,
      }
    )
    if (!res.ok) return false
    const data = (await res.json()) as TurnstileVerifyResponse
    return data.success === true
  } catch (err) {
    console.error('[turnstile] verify failed', err)
    return false
  }
}
