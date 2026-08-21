import { notFound }       from 'next/navigation'
import GameDetailClient   from './_components/GameDetailClient'
import { fetchGameDetailData } from '@/lib/fetchers/cheapshark'

interface Props { params: Promise<{ id: string }> }

export default async function GamePage({ params }: Props) {
  const { id } = await params
  if (!id || !/^\d+$/.test(id)) notFound()

  const data = await fetchGameDetailData(id)
  if (!data) notFound()

  return <GameDetailClient data={data} />
}
