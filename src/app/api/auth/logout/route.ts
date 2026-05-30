import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    return NextResponse.json({ message: 'Logout realizado com sucesso!' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao realizar logout.' },
      { status: 500 }
    );
  }
}
