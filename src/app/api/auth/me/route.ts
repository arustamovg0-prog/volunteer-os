import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await db.getUser(session.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        role: user.role,
        full_name: user.full_name,
        login: user.login || session.login,
        phone: user.phone || null,
      },
    });
  } catch (error) {
    console.error('Session check failed:', error);
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 });
  }
}
