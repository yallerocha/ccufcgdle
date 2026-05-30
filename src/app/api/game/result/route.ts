import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import { verifyToken } from '@/server/auth';
import { getLocalDateString } from '@/shared/utils';

// Records the result of today's game for the logged-in player. Only the first
// submission per day counts (re-submits are ignored), so a player can't improve
// their score by replaying. attempts/durationMs are client-reported.
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const body = await request.json();
    const attempts = Number(body.attempts);
    const durationMs = Number(body.durationMs);

    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 1000) {
      return NextResponse.json({ error: 'Número de tentativas inválido.' }, { status: 400 });
    }
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return NextResponse.json({ error: 'Duração inválida.' }, { status: 400 });
    }

    const date = getLocalDateString();

    // Keep the first result of the day; ignore later submissions.
    const result = await prisma.gameResult.upsert({
      where: { date_playerId: { date, playerId: decoded.userId } },
      create: {
        date,
        playerId: decoded.userId,
        attempts,
        durationMs: Math.round(durationMs),
      },
      update: {},
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error saving game result:', error);
    return NextResponse.json({ error: 'Erro ao salvar resultado.' }, { status: 500 });
  }
}
