/**
 * POST /api/submit/poll-response
 *
 * Edge route que orquesta el envío de votos de las verticales vote/ranking/rating.
 * Reemplaza la llamada directa de supabase.rpc('submit_response_rpc') desde el cliente,
 * y agrega:
 *   1) Validación de Turnstile (anti-bot invisible).
 *   2) Extracción + hash del IP del visitante (rate limit por IP).
 *   3) Traducción de errores Postgres a códigos HTTP apropiados.
 *
 * Body esperado (JSON):
 *   {
 *     pollToken:    string,   // token público del poll
 *     username:     string,
 *     response:     any,      // payload específico de la vertical
 *     captchaToken: string?   // null si dev / Turnstile no configurado
 *   }
 *
 * Respuestas:
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

// Edge runtime: ms de cold start, sin Node APIs nativas.
// Pero crypto.createHash de node:crypto NO funciona en edge — por eso
// dejamos esto como Node runtime (default). Es un POST corto, no importa.
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

  // ----- 2) Hash IP para rate limit -----
  const ipHash = hashIp(ip)

  // ----- 3) Llamar RPC -----
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
