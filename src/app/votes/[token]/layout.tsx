import type { Metadata } from 'next'
import {
  buildPollMetadata,
  getPollMetadata,
} from '@/lib/metadata-helpers'

// Server layout: solo expone generateMetadata. El contenido (page.tsx) sigue
// siendo el client component existente — este archivo no toca el render.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const row = await getPollMetadata(token)
  const meta = buildPollMetadata(row, 'vote')
  // Si no hay row, devolver objeto vacío → cae al template del root layout.
  return meta ?? {}
}

export default function VotePollLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
