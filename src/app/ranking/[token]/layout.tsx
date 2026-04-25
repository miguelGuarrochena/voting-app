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
  const meta = buildPollMetadata(row, 'ranking')
  return meta ?? {}
}

export default function RankingPollLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
