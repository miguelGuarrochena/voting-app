/**
 * Cloudflare Turnstile — helpers cliente y servidor.
 *
 * Cliente (browser):
 *   - turnstileExecute(siteKey): dispara un challenge invisible y devuelve un token.
 *     El token tiene vida útil de ~5 min y se consume en el server al validar.
 *
 * Servidor (Next.js edge route):
 *   - verifyTurnstile(token, secret, ip?): valida el token contra
 *     https://challenges.cloudflare.com/turnstile/v0/siteverify
 *
 * Setup:
 *   - Crear sitio en https://dash.cloudflare.com → Turnstile → Add Site.
 *   - Mode: "Invisible" o "Managed" (Managed muestra el widget solo si
 *     hay sospecha; Invisible nunca lo muestra). Recomendado: Managed.
 *   - Copiar Site Key → NEXT_PUBLIC_TURNSTILE_SITE_KEY (Vercel + .env.local)
 *   - Copiar Secret Key → TURNSTILE_SECRET (solo en Vercel)
 *
 *   Para dev sin Cloudflare, hay test keys oficiales:
 *     Site key:   1x00000000000000000000AA  (always passes)
 *     Secret:     1x0000000000000000000000000000000AA
 *
 *   Si las env vars no están seteadas, el código degrada gracefully:
 *   en cliente skip el challenge, en server skip la verificación.
 *   Esto permite trabajar local sin Cloudflare aún.
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
 * Ejecuta un challenge invisible y devuelve el token.
 * Si Turnstile no está cargado o no hay siteKey, devuelve null
 * (degraded mode — el server lo aceptará si tampoco tiene secret seteado).
 */
export async function turnstileExecute(
  siteKey: string | undefined,
  action = 'submit'
): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!siteKey) return null
  if (!window.turnstile) {
    // Esperamos hasta 3s a que cargue el script
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100))
      if (window.turnstile) break
    }
    if (!window.turnstile) return null
  }

  // Crea un container temporal en off-screen para el render invisible
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
    // limpiamos el container; el script de Turnstile sigue cargado
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
 * Valida un token de Turnstile contra Cloudflare. Devuelve true si OK.
 *
 * Si TURNSTILE_SECRET no está seteado, degrada a true (modo dev).
 * Esto se loguea para que sea evidente en producción si pasa.
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
