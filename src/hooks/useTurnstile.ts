/**
 * useTurnstile() — hook cliente para obtener un token de Turnstile bajo demanda.
 *
 * Uso:
 *   const getToken = useTurnstile()
 *   ...
 *   const token = await getToken()  // null si no está configurado / falla en dev
 *   await fetch('/api/submit/poll-response', {
 *     method: 'POST',
 *     body: JSON.stringify({ ..., captchaToken: token }),
 *   })
 *
 * Si NEXT_PUBLIC_TURNSTILE_SITE_KEY no está seteado, el hook degrada a
 * devolver null y el server-side acepta requests sin token (modo dev).
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
