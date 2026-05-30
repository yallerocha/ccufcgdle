import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import { verifyToken } from '@/server/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Optimization: Update lastLogin if it is older than 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    if (user.lastLogin < oneDayAgo) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ user: null });
  }
}

export async function PUT(request: Request) {
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
    const {
      gender,
      role,
      entrySemester,
      favoriteLanguage,
      area,
      lab,
      likesCoffee,
      photoUrl,
    } = body;

    // Validate update fields
    if (!gender || !role || !entrySemester || !favoriteLanguage || !area || !lab || !likesCoffee) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        gender,
        role,
        entrySemester,
        favoriteLanguage,
        area,
        lab,
        likesCoffee,
        photoUrl,
        lastLogin: new Date(), // Update lastLogin on profile change too
      }
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso!',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar o perfil.' },
      { status: 500 }
    );
  }
}
