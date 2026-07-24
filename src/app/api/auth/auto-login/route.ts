import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AUTH_COOKIE_NAME, createSessionToken, verifyPassword } from '@/lib/security';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const login = searchParams.get('login')?.trim().toLowerCase();
  const pass = searchParams.get('pass');
  const tgIdStr = searchParams.get('tg_id');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://volunteer-os-zeta.vercel.app';

  try {
    let user = null;

    if (login && pass) {
      user = await db.getUserByLogin(login);
      if (!user || !verifyPassword(pass, user.password_hash)) {
        return NextResponse.redirect(`${appUrl}/login?role=volunteer&error=invalid_credentials`);
      }
    } else if (tgIdStr) {
      const tgId = Number(tgIdStr);
      if (tgId) {
        user = await db.getUserByTelegramId(tgId);
      }
    }

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?role=volunteer&error=not_found`);
    }

    const token = createSessionToken({
      userId: user.id,
      role: user.role,
      fullName: user.full_name,
      login: user.login || login || '',
    });

    const targetUrl =
      user.role === 'developer'
        ? `${appUrl}/dashboard/monitor`
        : user.role === 'volunteer'
        ? `${appUrl}/volunteer-dashboard`
        : user.role === 'coordinator'
        ? `${appUrl}/coordinator-dashboard`
        : `${appUrl}/dashboard`;

    const response = NextResponse.redirect(targetUrl);
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.VOLUNTEER_OS_SECURE_COOKIES === 'true',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Auto-login error:', error);
    return NextResponse.redirect(`${appUrl}/login?role=volunteer&error=server_error`);
  }
}
