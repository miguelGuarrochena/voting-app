/**
 * useTurnstile() — client hook to fetch a Turnstile token on demand.
 *
 * Usage:
 *   const getToken = useTurnstile()
 *   ...
 *   const token = await getToken()  // null if not configured / fails in dev
 *   await fetch('/api/submit/poll-response', {
 *     method: 'POST',
 *     body: JSON.stringify({ ..., captchaToken: token }),
 *   })
 *
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set, the hook gracefully
 * returns null and the server accepts requests without a token (dev mode).
 */
'use client'

import { useCallback } from 'react'
import { turnstileExecute } from '@/lib/turnstile'

export function useTurnstile(action: string = 'submit') {
  return useCallback(async (): Promise<string | null> => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) return null
    try {
      return await turnstileExecute(siteKey, action)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[useTurnstile] challenge failed', err)
      return null
    }
  }, [action])
}
