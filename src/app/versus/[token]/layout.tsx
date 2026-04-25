import type { Metadata } from 'next'
import {
  buildPollMetadata,
  getTournamentMetadata,
} from '@/lib/metadata-helpers'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const row = await getTournamentMetadata(token)
  // tournaments no tienen description en el schema actual → buildPollMetadata
  // genera una descripción default a partir del kind ('versus' → 'Torneo').
  const meta = buildPollMetadata(
    row ? { title: row.title, description: null, cover_image: row.cover_image } : null,
    'versus'
  )
  return meta ?? {}
}

export default function VersusPollLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
