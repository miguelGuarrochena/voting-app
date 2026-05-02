/**
 * POST /api/submit/poll-response
 *
 * Edge route that orchestrates vote submission for vote/ranking/rating verticals.
 * Replaces the direct call to supabase.rpc('submit_response_rpc') from the client,
 * and adds:
 *   1) Turnstile validation (invisible anti-bot).
 *   2) Extraction + hash of visitor IP (rate limit per IP).
 *   3) Translation of Postgres errors to appropriate HTTP codes.
 *
 * Expected body (JSON):
 *   {
 *     pollToken:    string,   // poll's public token
 *     username:     string,
 *     response:     any,      // vertical-specific payload
 *     captchaToken: string?   // null if dev / Turnstile not configured
 *   }
 *
 * Responses:
 *   200 { ok: true }
 *   400 { error: 'bad_request' | 'empty_username' }
 *   403 { error: 'captcha_failed' }
 *   410 { error: 'poll_closed' | 'poll_not_found' }
 *   429 { error: 'rate_limited' }
 *   500 { error: 'internal' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyTurnstile } from '@/lib/turnstile'
import { getClientIp, hashIp } from '@/lib/server/ip-hash'

// Edge runtime: fast cold start, no native Node APIs.
// But crypto.createHash from node:crypto does NOT work in edge — that's why
// we keep this as Node runtime (default). It's a short POST, doesn't matter.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SubmitBody {
  pollToken?: string
  username?: string
  response?: unknown
  captchaToken?: string | null
}

export async function POST(req: NextRequest) {
  let body: SubmitBody
  try {
    body = (await req.json()) as SubmitBody
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const { pollToken, username, response, captchaToken } = body

  if (
    typeof pollToken !== 'string' ||
    typeof username !== 'string' ||
    !pollToken ||
    !username.trim()
  ) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  // ----- 1) Turnstile -----
  const ip = getClientIp(req.headers)
  const turnstileOk = await verifyTurnstile(
    captchaToken,
    process.env.TURNSTILE_SECRET,
    ip ?? undefined
  )
  if (!turnstileOk) {
    return NextResponse.json({ error: 'captcha_failed' }, { status: 403 })
  }

  // ----- 2) Hash IP for rate limit -----
  const ipHash = hashIp(ip)

  // ----- 3) Call RPC -----
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
  const supabase = createClient(url, key)

  const { error } = await supabase.rpc('submit_response_rpc', {
    p_token: pollToken,
    p_username: username,
    p_response: response,
    p_ip_hash: ipHash,
  })

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('rate_limited')) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
    if (msg.includes('poll_closed')) {
      return NextResponse.json({ error: 'poll_closed' }, { status: 410 })
    }
    if (msg.includes('poll_not_found')) {
      return NextResponse.json({ error: 'poll_not_found' }, { status: 410 })
    }
    if (msg.includes('empty_username')) {
      return NextResponse.json({ error: 'empty_username' }, { status: 400 })
    }
    // eslint-disable-next-line no-console
    console.error('[api/submit/poll-response]', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
