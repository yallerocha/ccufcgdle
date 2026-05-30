import { NextResponse } from 'next/server';
import { getActiveUsers } from '@/server/game';

export async function GET() {
  try {
    const activeUsers = await getActiveUsers();
    
    const list = activeUsers.map(u => ({
      id: u.id,
      name: u.name,
      photoUrl: u.photoUrl,
    }));
    
    return NextResponse.json({ characters: list });
  } catch (error) {
    console.error('Error in active-characters API:', error);
    return NextResponse.json(
      { error: 'Erro interno ao obter personagens ativos.' },
      { status: 500 }
    );
  }
}
