/**
 * <TurnstileWidget /> — persistent Cloudflare Turnstile placeholder.
 *
 * Mount once inside your form. The widget pre-fetches a token in the
 * background; on submit, call ref.current.getToken() and forward to
 * the API. After a successful submit, call ref.current.reset() to
 * stage a fresh token in case the user resubmits.
 *
 * Why an in-page placeholder (instead of an off-screen container):
 *   Cloudflare's "Managed" challenge can decide a request needs human
 *   interaction. With size='invisible' + appearance='interaction-only',
 *   the widget is normally invisible — but if interaction IS required,
 *   the challenge UI renders in place. An off-screen container made
 *   that UI unreachable on mobile, which is what caused the
 *   submit-hang → "you're a bot" error path.
 *
 * Usage:
 *   const tsRef = useRef<TurnstileWidgetHandle>(null)
 *   ...
 *   <TurnstileWidget ref={tsRef} action="vote_submit" />
 *   ...
 *   const captchaToken = await tsRef.current?.getToken() ?? null
 *   const ok = await submitResponse(..., captchaToken)
 *   if (ok) tsRef.current?.reset()
 */
'use client'

import { forwardRef, useImperativeHandle } from 'react'
import { useTurnstile } from '@/hooks/useTurnstile'

export interface TurnstileWidgetHandle {
  /** Returns a fresh token, or null if Turnstile isn't configured. */
  getToken: () => Promise<string | null>
  /** Drop the cached token so the next getToken() pulls a new one. */
  reset: () => void
}

export interface TurnstileWidgetProps {
  /** Action label, e.g. "vote_submit", "ranking_submit". */
  action?: string
  /** Optional className applied to the placeholder container. */
  className?: string
}

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget({ action = 'submit', className }, ref) {
  const { containerRef, getToken, reset } = useTurnstile(action)

  useImperativeHandle(ref, () => ({ getToken, reset }), [getToken, reset])

  // The container has to be in the DOM (and reachable) so a managed
  // challenge can render here. We don't force any size — the widget
  // controls its own dimensions when invisible vs. when interactive.
  return <div ref={containerRef} className={className} aria-hidden />
})
