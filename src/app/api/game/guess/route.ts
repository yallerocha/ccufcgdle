import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getOrCreateDailyCharacter, compareCharacters } from '@/server/game';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guessId } = body;

    if (!guessId) {
      return NextResponse.json(
        { error: 'ID do palpite é obrigatório.' },
        { status: 400 }
      );
    }

    // Get the daily target character
    const target = await getOrCreateDailyCharacter();
    if (!target) {
      return NextResponse.json(
        { error: 'Não há personagens disponíveis no jogo. Cadastre-se para ser o primeiro!' },
        { status: 404 }
      );
    }

    // Get the guessed user
    const guessUser = await prisma.user.findUnique({
      where: { id: guessId }
    });

    if (!guessUser) {
      return NextResponse.json(
        { error: 'Personagem não encontrado.' },
        { status: 404 }
      );
    }

    // Compare attributes
    const feedback = compareCharacters(guessUser, target);

    return NextResponse.json({
      feedback,
      // If correct, return the target user's full name and photo to display on win
      targetName: feedback.correct ? target.name : undefined,
      photoUrl: feedback.correct ? target.photoUrl : undefined
    });

  } catch (error) {
    console.error('Error handling guess:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar o palpite.' },
      { status: 500 }
    );
  }
}
