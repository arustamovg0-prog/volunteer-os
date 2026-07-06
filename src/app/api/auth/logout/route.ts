import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/security';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.VOLUNTEER_OS_SECURE_COOKIES === 'true',
    path: '/',
    maxAge: 0,
  });
  return res;
}
