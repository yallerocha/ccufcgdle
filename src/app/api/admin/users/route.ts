import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import { verifyToken } from '@/server/auth';

// Helper to check admin status
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

export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        role: true,
        entrySemester: true,
        favoriteLanguage: true,
        area: true,
        lab: true,
        likesCoffee: true,
        lastLogin: true,
        isActive: true,
        isAdmin: true,
        createdAt: true
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, isActive, isAdmin: targetIsAdmin } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    // Don't let an admin deactivate or remove admin rights from themselves
    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'Você não pode alterar seus próprios privilégios administrativos ou estado de atividade.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(targetIsAdmin !== undefined && { isAdmin: targetIsAdmin })
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isAdmin: true
      }
    });

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json({ error: 'Você não pode excluir a si mesmo.' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ message: 'Usuário excluído com sucesso!' });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuário.' }, { status: 500 });
  }
}
