import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import { verifyToken } from '@/server/auth';
import { getLocalDateString } from '@/shared/utils';
import { getOrCreateDailyCharacter } from '@/server/game';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.isAdmin) return null;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user || !user.isAdmin) return null;
  return user;
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { characterId } = body;
    const today = getLocalDateString();

    // 1. Delete today's daily character if it exists
    await prisma.dailyCharacter.deleteMany({
      where: { date: today }
    });

    let selectedCharacter;

    if (characterId) {
      // Set to the specific chosen user
      const userExists = await prisma.user.findUnique({
        where: { id: characterId }
      });

      if (!userExists) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }

      selectedCharacter = await prisma.dailyCharacter.create({
        data: {
          date: today,
          characterId: characterId
        },
        include: { character: true }
      });
      selectedCharacter = selectedCharacter.character;
    } else {
      // Generate a new random one
      selectedCharacter = await getOrCreateDailyCharacter(today);
    }

    if (!selectedCharacter) {
      return NextResponse.json({ error: 'Não foi possível selecionar um personagem. Verifique se há usuários cadastrados.' }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Personagem do dia atualizado!',
      character: {
        id: selectedCharacter.id,
        name: selectedCharacter.name
      }
    });

  } catch (error) {
    console.error('Error forcing daily character:', error);
    return NextResponse.json({ error: 'Erro ao atualizar personagem do dia.' }, { status: 500 });
  }
}
