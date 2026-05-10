/**
 * useTurnstile() — persistent Turnstile widget hook.
 *
 * Returns a ref you mount on a real <div> in the form, plus getToken()/reset().
 * The widget renders once when the div is in the DOM and pre-fetches a token
 * silently (size='invisible' + appearance='interaction-only'). When the user
 * submits, getToken() returns the cached token immediately — no waiting on
 * Cloudflare round-trips at click time.
 *
 * This replaces the old on-demand turnstileExecute() which created an
 * off-screen container per click. On mobile, when Cloudflare decided the
 * traffic was suspicious enough to require interaction, the challenge UI
 * had nowhere to render and the submit hung until the 15s timeout —
 * after which the API rejected with captcha_failed and the user got the
 * "you're a bot" toast.
 *
 * Usage:
 *   // 1) Render the placeholder div somewhere in your form:
 *   const { containerRef, getToken, reset } = useTurnstile('vote_submit')
 *   <div ref={containerRef} />
 *
 *   // 2) On submit:
 *   const token = await getToken()
 *   const ok = await submitResponse(..., token)
 *   if (ok) reset()  // get a fresh token in case the user submits again
 *
 * Or, simpler: use <TurnstileWidget /> from src/components/common.
 *
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set, the hook is a no-op:
 * containerRef stays unused, getToken() returns null, and the server
 * (without TURNSTILE_SECRET) accepts requests without a token.
 */
'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'

// CF tokens are valid ~5 min. Treat 4 min as "fresh" so we never send
// a token that's about to expire.
const TOKEN_FRESH_MS = 4 * 60 * 1000

// How long to poll for the global turnstile object before giving up.
// 100ms × 100 = 10s. The script is loaded with strategy="afterInteractive"
// in the root layout, so on slow mobile networks it can take a couple
// of seconds to be ready.
const SCRIPT_LOAD_POLL_MS = 100
const SCRIPT_LOAD_MAX_TRIES = 100

// Hard ceiling on getToken(). If we haven't gotten a token after this,
// resolve null and let the server reject — better than hanging forever.
const GET_TOKEN_TIMEOUT_MS = 30_000

export interface UseTurnstileResult {
  /**
   * Attach to the placeholder <div> where the widget should mount.
   * (RefObject<HTMLDivElement> matches @types/react@18 conventions where
   * `.current` is readonly HTMLDivElement | null — what useRef actually
   * returns from `useRef<HTMLDivElement>(null)`.)
   */
  containerRef: RefObject<HTMLDivElement>
  /** Returns a fresh token, or null if Turnstile isn't configured. */
  getToken: () => Promise<string | null>
  /** Drop the cached token and trigger a new challenge in the background. */
  reset: () => void
}

export function useTurnstile(action: string = 'submit'): UseTurnstileResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(null)
  const tokenAtRef = useRef(0)
  // Anyone awaiting a fresh token. The Turnstile callback resolves all
  // of them at once.
  const pendingRef = useRef<Array<(t: string | null) => void>>([])

  const flushPending = (token: string | null) => {
    const queue = pendingRef.current
    pendingRef.current = []
    queue.forEach((r) => r(token))
  }

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) return // dev mode — no-op
    if (typeof window === 'undefined') return

    let cancelled = false

    const mount = async () => {
      // Wait for the global to appear
      for (let i = 0; i < SCRIPT_LOAD_MAX_TRIES; i++) {
        if (cancelled) return
        if (window.turnstile) break
        await new Promise((r) => setTimeout(r, SCRIPT_LOAD_POLL_MS))
      }
      if (cancelled) return
      if (!window.turnstile || !containerRef.current) return
      if (widgetIdRef.current) return // already mounted

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          // 'invisible' so we don't render any UI in the happy path.
          // 'interaction-only' so if Cloudflare DOES need interaction,
          // the widget appears in place — visible to the user, in the
          // form, where they can complete it.
          size: 'invisible',
          appearance: 'interaction-only',
          callback: (token: string) => {
            tokenRef.current = token
            tokenAtRef.current = Date.now()
            flushPending(token)
          },
          'error-callback': () => {
            tokenRef.current = null
            tokenAtRef.current = 0
            flushPending(null)
          },
          'expired-callback': () => {
            tokenRef.current = null
            tokenAtRef.current = 0
            // Re-execute silently so we have a token ready next time.
            if (widgetIdRef.current && window.turnstile) {
              try {
                window.turnstile.execute(widgetIdRef.current, {
                  sitekey: siteKey,
                  action,
                })
              } catch {
                /* noop */
              }
            }
          },
        })
        if (typeof id === 'string') {
          widgetIdRef.current = id
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[useTurnstile] render failed', err)
      }
    }

    mount()

    return () => {
      cancelled = true
      const w = typeof window !== 'undefined' ? window : undefined
      if (widgetIdRef.current && w?.turnstile) {
        try {
          w.turnstile.remove(widgetIdRef.current)
        } catch {
          /* noop */
        }
      }
      widgetIdRef.current = null
      tokenRef.current = null
      tokenAtRef.current = 0
      flushPending(null)
    }
  }, [action])

  const getToken = useCallback(async (): Promise<string | null> => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) return null

    // 1) Cached fresh token? Use it.
    if (
      tokenRef.current &&
      Date.now() - tokenAtRef.current < TOKEN_FRESH_MS
    ) {
      return tokenRef.current
    }

    // 2) No fresh token. If the widget is mounted, kick off an execute()
    //    so we get a new one. The callback in the useEffect above will
    //    resolve all pending awaiters.
    if (
      widgetIdRef.current &&
      typeof window !== 'undefined' &&
      window.turnstile
    ) {
      try {
        window.turnstile.execute(widgetIdRef.current, {
          sitekey: siteKey,
          action,
        })
      } catch {
        /* noop */
      }
    }

    // 3) Wait for the next callback fire — with a hard ceiling so we
    //    never hang on a stalled challenge.
    return new Promise<string | null>((resolve) => {
      pendingRef.current.push(resolve)
      setTimeout(() => {
        const idx = pendingRef.current.indexOf(resolve)
        if (idx >= 0) {
          pendingRef.current.splice(idx, 1)
          resolve(null)
        }
      }, GET_TOKEN_TIMEOUT_MS)
    })
  }, [action])

  const reset = useCallback(() => {
    tokenRef.current = null
    tokenAtRef.current = 0
    if (
      widgetIdRef.current &&
      typeof window !== 'undefined' &&
      window.turnstile
    ) {
      try {
        window.turnstile.reset(widgetIdRef.current)
      } catch {
        /* noop */
      }
    }
  }, [])

  return { containerRef, getToken, reset }
}
