/**
 * Helpers server-safe para construir metadata por poll/tournament.
 *
 * No usan toast (que es client-only). Cualquier error se silencia y
 * devuelve null — los layouts caen al metadata default del root.
 */

import { supabase } from './supabase'

type PollMetaRow = {
  title?: string | null
  description?: string | null
  cover_image?: string | null
}

type TournamentMetaRow = {
  title?: string | null
  cover_image?: string | null
}

const FALLBACK_DESCRIPTION =
  'Vota, rankéa y compartí en Pickly. Decisiones rápidas y divertidas.'

/**
 * Fetch the minimum fields needed for metadata, by token.
 * Returns null if not found or on error (doesn't break SSR).
 */
export async function getPollMetadata(
  token: string
): Promise<PollMetaRow | null> {
  try {
    const { data, error } = await supabase.rpc('get_poll_by_token', {
      p_token: token,
    })
    if (error) return null
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null
    return {
      title: row.title,
      description: row.description,
      cover_image: row.cover_image,
    }
  } catch {
    return null
  }
}

export async function getTournamentMetadata(
  token: string
): Promise<TournamentMetaRow | null> {
  try {
    const { data, error } = await supabase.rpc('get_tournament_by_token', {
      p_token: token,
    })
    if (error) return null
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null
    return {
      title: row.title,
      cover_image: row.cover_image,
    }
  } catch {
    return null
  }
}

/**
 * Construye un objeto Metadata para un poll/tournament. Si no encuentra
 * el row, devuelve metadata genérica (que cae al template del root layout).
 */
export function buildPollMetadata(
  row: PollMetaRow | null,
  kind: 'vote' | 'ranking' | 'rating' | 'versus'
) {
  if (!row || !row.title) {
    return null // let the root metadata apply
  }

  const kindLabel: Record<typeof kind, string> = {
    vote: 'Encuesta',
    ranking: 'Ranking',
    rating: 'Rating',
    versus: 'Torneo',
  }

  const title = row.title.trim()
  const description =
    (row.description || '').trim() ||
    `${kindLabel[kind]} en Pickly: ${title}. Votá y compartí en segundos.`

  const images = row.cover_image
    ? [{ url: row.cover_image, alt: title }]
    : [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Pickly' }]

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      siteName: 'Pickly',
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: images.map((i) => i.url),
    },
  }
}

export { FALLBACK_DESCRIPTION }
