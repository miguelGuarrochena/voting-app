/**
 * src/lib/navigation.ts
 * --------------------------------------------------------------
 * Helpers de navegación.
 *
 * `safeBack` se usa para los botones "Volver". Cuando el usuario
 * abre un link compartido en una pestaña nueva, no hay history,
 * por lo que `router.back()` no va a ningún lado (se queda en la
 * misma página). En ese caso, redirigimos a `/`.
 * --------------------------------------------------------------
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export function safeBack(router: AppRouterInstance, fallback: string = '/'): void {
  if (typeof window === 'undefined') {
    router.push(fallback)
    return
  }

  // Si no hay history previo en esta pestaña, ir al fallback.
  // history.length === 1 cuando la pestaña se abre directamente en el link.
  if (window.history.length <= 1) {
    router.push(fallback)
    return
  }

  // Guardamos la URL actual antes de ir atrás; si después de un tick
  // seguimos en el mismo lado (porque back no hizo nada), forzamos fallback.
  const currentPath = window.location.pathname
  router.back()
  setTimeout(() => {
    if (window.location.pathname === currentPath) {
      router.push(fallback)
    }
  }, 120)
}
