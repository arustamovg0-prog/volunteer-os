import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

type PrivilegedRole = 'admin' | 'manager' | 'coordinator';
export type AuthRole = 'admin' | 'manager' | 'coordinator' | 'volunteer';

export const AUTH_COOKIE_NAME = 'volunteer_os_session';

function timingSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function isPrivilegedRequest(req: NextRequest, allowedRoles: PrivilegedRole[] = ['admin', 'manager']) {
  const session = getSessionFromRequest(req);
  if (session && allowedRoles.includes(session.role as PrivilegedRole)) {
    return true;
  }

  const apiKey = process.env.VOLUNTEER_OS_ADMIN_KEY;
  const suppliedKey = req.headers.get('x-volunteer-os-api-key') || '';
  if (apiKey && suppliedKey) {
    return suppliedKey.length > 0 && timingSafeEqual(suppliedKey, apiKey);
  }

  return false;
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function requirePrivilegedRequest(req: NextRequest, allowedRoles: PrivilegedRole[] = ['admin', 'manager']) {
  return isPrivilegedRequest(req, allowedRoles) ? null : forbiddenResponse();
}

export function requireSessionRequest(req: NextRequest, allowedRoles?: AuthRole[]) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { response: unauthorizedResponse() };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { response: forbiddenResponse() };
  }

  return { session };
}

const RATE_LIMITS = new Map<string, { count: number; resetAt: number }>();

export function rateLimitRequest(req: NextRequest, scope: string, limit: number, windowMs: number) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  const ip = forwardedFor || realIp || 'local';
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const bucket = RATE_LIMITS.get(key);

  if (!bucket || bucket.resetAt <= now) {
    RATE_LIMITS.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      },
    );
  }

  return null;
}

export function validateTelegramSecret(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) {
    return false;
  }

  const received = req.headers.get('x-telegram-bot-api-secret-token') || '';
  return received.length > 0 && timingSafeEqual(received, expected);
}

function getEncryptionKey() {
  const secret = process.env.VOLUNTEER_OS_SECRET_KEY || process.env.VOLUNTEER_OS_ADMIN_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('VOLUNTEER_OS_SECRET_KEY is required in production');
    }
    return crypto.createHash('sha256').update('volunteer-os-local-development-key').digest();
  }
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSecret(plainText: string) {
  if (plainText.startsWith('v1:')) return plainText;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(cipherText: string) {
  if (!cipherText.startsWith('v1:')) return cipherText;

  const [, ivB64, tagB64, encryptedB64] = cipherText.split(':');
  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error('Invalid encrypted secret format');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function maskSecret(value?: string | null) {
  if (!value) return '';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}${'*'.repeat(Math.min(10, Math.max(4, value.length - 4)))}${value.slice(-2)}`;
}

function getAuthSecret() {
  const secret = process.env.VOLUNTEER_OS_AUTH_SECRET || process.env.VOLUNTEER_OS_SECRET_KEY || process.env.VOLUNTEER_OS_ADMIN_KEY;
  if (!secret) {
    throw new Error('VOLUNTEER_OS_AUTH_SECRET is required');
  }
  return secret;
}

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return crypto.createHmac('sha256', getAuthSecret()).update(value).digest('base64url');
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const derived = crypto.scryptSync(password, salt, 64).toString('base64url');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, passwordHash?: string | null) {
  if (!passwordHash) return false;
  const [method, salt, stored] = passwordHash.split(':');
  if (method !== 'scrypt' || !salt || !stored) return false;

  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(stored, 'base64url');
  return derived.length === storedBuffer.length && crypto.timingSafeEqual(derived, storedBuffer);
}

export interface AuthSession {
  userId: string;
  role: AuthRole;
  fullName: string;
  login: string;
  exp: number;
}

export function createSessionToken(session: Omit<AuthSession, 'exp'>, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const payload: AuthSession = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token?: string | null): AuthSession | null {
  if (!token || !token.includes('.')) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  if (!timingSafeEqual(signature, expected)) return null;

  try {
    const session = JSON.parse(base64UrlDecode(encodedPayload)) as AuthSession;
    if (!session.userId || !session.role || !session.exp) return null;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest) {
  return verifySessionToken(req.cookies.get(AUTH_COOKIE_NAME)?.value);
}
