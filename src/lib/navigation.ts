/**
 * src/lib/navigation.ts
 * --------------------------------------------------------------
 * Navigation helpers.
 *
 * `safeBack` is used for "Back" buttons. When the user
 * opens a shared link in a new tab, there's no history,
 * so `router.back()` goes nowhere (stays on the same page). In that case,
 * we redirect to `/`.
 * --------------------------------------------------------------
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export function safeBack(router: AppRouterInstance, fallback: string = '/'): void {
  if (typeof window === 'undefined') {
    router.push(fallback)
    return
  }

  // If there's no previous history in this tab, go to fallback.
  // history.length === 1 when the tab opens directly to the link.
  if (window.history.length <= 1) {
    router.push(fallback)
    return
  }

  // Save the current URL before going back; if after one tick
  // we're still on the same page (because back did nothing), force fallback.
  const currentPath = window.location.pathname
  router.back()
  setTimeout(() => {
    if (window.location.pathname === currentPath) {
      router.push(fallback)
    }
  }, 120)
}
