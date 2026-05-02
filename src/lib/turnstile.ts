/**
 * Cloudflare Turnstile — client and server helpers.
 *
 * Client (browser):
 *   - turnstileExecute(siteKey): fires an invisible challenge and returns a token.
 *     The token is valid for ~5 min and is consumed on the server when validating.
 *
 * Server (Next.js edge route):
 *   - verifyTurnstile(token, secret, ip?): validates the token against
 *     https://challenges.cloudflare.com/turnstile/v0/siteverify
 *
 * Setup:
 *   - Create site at https://dash.cloudflare.com → Turnstile → Add Site.
 *   - Mode: "Invisible" or "Managed" (Managed shows the widget only if
 *     there's suspicion; Invisible never shows it). Recommended: Managed.
 *   - Copy Site Key → NEXT_PUBLIC_TURNSTILE_SITE_KEY (Vercel + .env.local)
 *   - Copy Secret Key → TURNSTILE_SECRET (only on Vercel)
 *
 *   For dev without Cloudflare, there are official test keys:
 *     Site key:   1x00000000000000000000AA  (always passes)
 *     Secret:     1x0000000000000000000000000000000AA
 *
 *   If env vars aren't set, the code degrades gracefully:
 *   on client skip the challenge, on server skip the verification.
 *   This allows local work without Cloudflare for now.
 */

// ------------------------------------------------------------
//  CLIENT — turnstile.execute() invisible
// ------------------------------------------------------------

declare global {
  interface Window {
    turnstile?: {
      execute: (
        container: string | HTMLElement,
        options: { sitekey: string; action?: string }
      ) => Promise<string>
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          action?: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          size?: 'normal' | 'compact' | 'invisible'
          appearance?: 'always' | 'execute' | 'interaction-only'
        }
      ) => string | undefined
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

export const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/**
 * Executes an invisible challenge and returns the token.
 * If Turnstile isn't loaded or there's no siteKey, returns null
 * (degraded mode — the server will accept it if it also doesn't have secret set).
 */
export async function turnstileExecute(
  siteKey: string | undefined,
  action = 'submit'
): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!siteKey) return null
  if (!window.turnstile) {
    // Wait up to 3s for the script to load
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100))
      if (window.turnstile) break
    }
    if (!window.turnstile) return null
  }

  // Create a temporary off-screen container for the invisible render
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  document.body.appendChild(container)

  try {
    return await new Promise<string>((resolve, reject) => {
      const widgetId = window.turnstile!.render(container, {
        sitekey: siteKey,
        action,
        size: 'invisible',
        callback: (token: string) => {
          resolve(token)
        },
        'error-callback': () => reject(new Error('turnstile_error')),
        'expired-callback': () => reject(new Error('turnstile_expired')),
      })

      if (!widgetId) {
        reject(new Error('turnstile_render_failed'))
      }

      // Timeout safety net (15s)
      setTimeout(() => reject(new Error('turnstile_timeout')), 15000)
    })
  } finally {
    // Clean up the container; the Turnstile script stays loaded
    setTimeout(() => container.remove(), 0)
  }
}

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
    // Modo dev: skip
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
