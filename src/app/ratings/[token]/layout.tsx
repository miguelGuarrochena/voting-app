import type { Metadata } from 'next'
import {
  buildPollMetadata,
  getPollMetadata,
} from '@/lib/metadata-helpers'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const row = await getPollMetadata(token)
  const meta = buildPollMetadata(row, 'rating')
  return meta ?? {}
}

export default function RatingPollLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
