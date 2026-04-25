/**
 * POST /api/submit/duel-vote
 *
 * Edge route que orquesta el envío de un voto en un duelo de torneo (versus).
 * Reemplaza el INSERT/UPSERT directo a duel_votes desde el cliente —
 * ahora cerrado por RLS (las policies abiertas se dropearon en anti-fraud-v6).
 *
 * Body esperado (JSON):
 *   {
 *     tournamentToken: string,
 *     duelId:          string,
 *     username:        string,
 *     optionId:        string,
 *     captchaToken:    string?
 *   }
 *
 * Respuestas:
 *   200 { ok: true }
 *   400 { error: 'bad_request' | 'empty_username' | 'empty_duel_id' | 'empty_option_id' }
 *   403 { error: 'captcha_failed' }
 *   410 { error: 'tournament_not_found' }
 *   429 { error: 'rate_limited' }
 *   500 { error: 'internal' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyTurnstile } from '@/lib/turnstile'
import { getClientIp, hashIp } from '@/lib/server/ip-hash'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SubmitBody {
  tournamentToken?: string
  duelId?: string
  username?: string
  optionId?: string
  captchaToken?: string | null
}

export async function POST(req: NextRequest) {
  let body: SubmitBody
  try {
    body = (await req.json()) as SubmitBody
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const { tournamentToken, duelId, username, optionId, captchaToken } = body

  if (
    typeof tournamentToken !== 'string' ||
    typeof duelId !== 'string' ||
    typeof username !== 'string' ||
    typeof optionId !== 'string' ||
    !tournamentToken ||
    !duelId ||
    !username.trim() ||
    !optionId
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

  // ----- 2) Hash IP -----
  const ipHash = hashIp(ip)

  // ----- 3) Llamar RPC -----
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
  const supabase = createClient(url, key)

  const { error } = await supabase.rpc('submit_duel_vote_rpc', {
    p_tournament_token: tournamentToken,
    p_duel_id: duelId,
    p_username: username,
    p_option_id: optionId,
    p_ip_hash: ipHash,
  })

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('rate_limited')) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
    if (msg.includes('tournament_not_found')) {
      return NextResponse.json({ error: 'tournament_not_found' }, { status: 410 })
    }
    if (msg.includes('empty_username')) {
      return NextResponse.json({ error: 'empty_username' }, { status: 400 })
    }
    if (msg.includes('empty_duel_id')) {
      return NextResponse.json({ error: 'empty_duel_id' }, { status: 400 })
    }
    if (msg.includes('empty_option_id')) {
      return NextResponse.json({ error: 'empty_option_id' }, { status: 400 })
    }
    // eslint-disable-next-line no-console
    console.error('[api/submit/duel-vote]', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
