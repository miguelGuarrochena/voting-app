/**
 * Server-side helpers to extract and hash the request IP.
 *
 * Used only in edge routes / server components — never on client.
 *
 * The hash is deterministic (same IP → same hash) but salted with a
 * secret that only lives on the server. It's used for IP-based rate limiting
 * without storing the raw IP in the DB. The salt can be rotated periodically
 * (when it rotates, the rate limit "resets" for everyone — not a problem).
 */

import { createHash } from 'node:crypto'

/**
 * Extracts the visitor's IP by looking at headers set by Vercel/proxies.
 * Priority order:
 *   1) x-real-ip (some proxies)
 *   2) x-forwarded-for (first IP in the list)
 *   3) cf-connecting-ip (Cloudflare)
 *
 * Returns null if none are present (rare in production, common locally).
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
 * Hashes an IP with sha256(ip + salt). The salt comes from env var
 * `IP_HASH_SALT`. If it's not set, uses a hardcoded fallback
 * (not ideal but doesn't break local).
 */
export function hashIp(ip: string | null): string {
  if (!ip) return ''
  const salt = process.env.IP_HASH_SALT || 'pickly-dev-salt-do-not-use-in-prod'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/**
 * Shortcut: getClientIp + hashIp in one.
 */
export function getHashedClientIp(headers: Headers): string {
  return hashIp(getClientIp(headers))
}
