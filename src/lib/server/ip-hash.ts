/**
 * Helpers server-side para extraer y hashear el IP del request.
 *
 * Usados solo en edge routes / server components — nunca en cliente.
 *
 * El hash es determinístico (mismo IP → mismo hash) pero salted con un
 * secreto que solo vive en server. Sirve para rate limiting agregado por IP
 * sin guardar el IP plano en la DB. La sal puede rotarse periódicamente
 * (cuando rota, el rate limit "se resetea" para todos — no es problema).
 */

import { createHash } from 'node:crypto'

/**
 * Extrae el IP del visitante mirando los headers que pone Vercel/proxies.
 * Orden de prioridad:
 *   1) x-real-ip (algunos proxies)
 *   2) x-forwarded-for (primer IP de la lista)
 *   3) cf-connecting-ip (Cloudflare)
 *
 * Devuelve null si ninguno está presente (raro en producción, común en local).
 */
export function getClientIp(headers: Headers): string | null {
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }

  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf.trim()

  return null
}

/**
 * Hashea un IP con sha256(ip + salt). El salt sale de env var
 * `IP_HASH_SALT`. Si no está seteado, usa un fallback hardcoded
 * (peor pero no rompe local).
 */
export function hashIp(ip: string | null): string {
  if (!ip) return ''
  const salt = process.env.IP_HASH_SALT || 'pickly-dev-salt-do-not-use-in-prod'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/**
 * Shortcut: getClientIp + hashIp en uno.
 */
export function getHashedClientIp(headers: Headers): string {
  return hashIp(getClientIp(headers))
}
