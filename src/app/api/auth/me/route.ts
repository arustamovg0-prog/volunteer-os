import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401, headers });
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

    return NextResponse.json({ user: finalUser }, { headers });
  } catch (error) {
    console.error('Session check failed:', error);
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 });
  }
}
