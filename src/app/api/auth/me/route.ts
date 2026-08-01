import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    let user = await db.getUser(session.userId);
    if (!user && session.login) {
      user = await db.getUserByLogin(session.login);
    }

    const finalUser = user ? {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      login: user.login || session.login,
      phone: user.phone || null,
    } : {
      id: session.userId,
      role: session.role,
      full_name: session.fullName || 'Пользователь',
      login: session.login,
      phone: null,
    };

    return NextResponse.json({ user: finalUser });
  } catch (error) {
    console.error('Session check failed:', error);
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 });
  }
}
