import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/server/db';
import { signToken } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      gender,
      role,
      entrySemester,
      favoriteLanguage,
      area,
      lab,
      likesCoffee,
      photoUrl,
    } = body;

    // Basic validation
    if (!email || !password || !name || !gender || !role || !entrySemester || !favoriteLanguage || !area || !lab || !likesCoffee) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios.' },
        { status: 400 }
      );
    }

    if (name.length < 3 || name.length > 25) {
      return NextResponse.json(
        { error: 'O nome/apelido deve ter entre 3 e 25 caracteres.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    // Check if email or name already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { name: name }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado.' },
          { status: 400 }
        );
      }
      if (existingUser.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este nome/apelido já está em uso.' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // If it's the first user, make them admin
    const totalUsers = await prisma.user.count();
    const isAdmin = totalUsers === 0;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        gender,
        role,
        entrySemester,
        favoriteLanguage,
        area,
        lab,
        likesCoffee,
        photoUrl,
        isAdmin,
        lastLogin: new Date(),
        isActive: true,
      },
    });

    // Create session token
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso!',
      user: userWithoutPassword
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao realizar cadastro.' },
      { status: 500 }
    );
  }
}
