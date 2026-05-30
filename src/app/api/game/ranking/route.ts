import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getLocalDateString } from '@/shared/utils';

// Daily ranking: fewer attempts ranks higher, ties broken by shorter duration
// (and earlier completion as a final tiebreaker).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getLocalDateString();

    const results = await prisma.gameResult.findMany({
      where: { date },
      orderBy: [
        { attempts: 'asc' },
        { durationMs: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        player: { select: { name: true, photoUrl: true } },
      },
    });

    const ranking = results.map((r, i) => ({
      rank: i + 1,
      name: r.player.name,
      photoUrl: r.player.photoUrl,
      attempts: r.attempts,
      durationMs: r.durationMs,
    }));

    return NextResponse.json({ date, ranking });
  } catch (error) {
    console.error('Error loading ranking:', error);
    return NextResponse.json({ error: 'Erro ao carregar o ranking.' }, { status: 500 });
  }
}
