import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AUTH_COOKIE_NAME, createSessionToken, rateLimitRequest, verifyPassword } from '@/lib/security';

function publicSession(user: any) {
  return {
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      login: user.login,
      phone: user.phone || null,
    },
    redirectTo:
      user.role === 'developer'
        ? '/dashboard/monitor'
        : user.role === 'volunteer'
        ? '/volunteer-dashboard'
        : user.role === 'coordinator'
        ? '/coordinator-dashboard'
        : '/dashboard',
  };
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = rateLimitRequest(req, 'login', 8, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const login = String(body.login || '').trim().toLowerCase();
    const password = String(body.password || '');
    const expectedRole = body.role ? String(body.role) : null;

    if (!login || !password) {
      return NextResponse.json({ error: 'Login and password are required' }, { status: 400 });
    }

    let user = await db.getUserByLogin(login);

    // Auto-create developer account if first login attempt for developer / dev2026!system
    if (!user && login === 'developer' && password === 'dev2026!system') {
      user = await db.createUser({
        role: 'developer',
        full_name: 'Разработчик Системы (Developer)',
        login: 'developer',
        password_hash: hashPassword('dev2026!system'),
        phone: '+998999999999',
        rating: 5.0,
        xp: 10000,
        level: 10,
        badges: ['System Developer'],
        availability_status: 'online'
      });
    }

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    // Segment 0: developer — only developer role
    if (expectedRole === 'developer' && user.role !== 'developer') {
      return NextResponse.json({ error: 'Этот аккаунт не является аккаунтом разработчика' }, { status: 403 });
    }

    // Segment 1: leader/staff — only admin and manager
    if (expectedRole === 'leader' && !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Этот аккаунт не является аккаунтом руководителя или сотрудника' }, { status: 403 });
    }

    // Segment 2: coordinator — only coordinator role
    if (expectedRole === 'coordinator' && user.role !== 'coordinator') {
      return NextResponse.json({ error: 'Этот аккаунт не является аккаунтом координатора' }, { status: 403 });
    }

    // Segment 3: volunteer — only volunteer role
    if (expectedRole === 'volunteer' && user.role !== 'volunteer') {
      return NextResponse.json({ error: 'Этот аккаунт не является волонтерским аккаунтом' }, { status: 403 });
    }

    // Legacy support: old 'manager' segment maps to leader
    if (expectedRole === 'manager' && !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Этот аккаунт не является аккаунтом координатора' }, { status: 403 });
    }

    const token = createSessionToken({
      userId: user.id,
      role: user.role,
      fullName: user.full_name,
      login: user.login || login,
    });

    const res = NextResponse.json(publicSession(user));
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.VOLUNTEER_OS_SECURE_COOKIES === 'true',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
