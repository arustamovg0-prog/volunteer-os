import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, requireSessionRequest } from '@/lib/security';

function publicUser(user: any) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const users = await db.getUsers();
    const staff = users
      .filter((user) => user.role === 'admin' || user.role === 'manager')
      .sort((a, b) => {
        if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
        return a.full_name.localeCompare(b.full_name, 'ru');
      })
      .map(publicUser);

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Failed to fetch staff:', error);
    return NextResponse.json({ error: 'Не удалось загрузить сотрудников' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { role, full_name, login, password, phone, telegram_id, avatar_url, system_role_id } = body;

    if (!['admin', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Можно создать только директора или координатора' }, { status: 400 });
    }

    if (!full_name || !login || !password) {
      return NextResponse.json({ error: 'ФИО, логин и пароль обязательны' }, { status: 400 });
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Пароль должен быть не короче 8 символов' }, { status: 400 });
    }

    const normalizedLogin = String(login).trim().toLowerCase();
    const existingUser = await db.getUserByLogin(normalizedLogin);
    if (existingUser) {
      return NextResponse.json({ error: 'Пользователь с таким логином уже существует' }, { status: 409 });
    }

    const user = await db.createUser({
      role,
      full_name: String(full_name).trim(),
      login: normalizedLogin,
      password_hash: hashPassword(String(password)),
      phone: phone ? String(phone).trim() : null,
      telegram_id: telegram_id ? Number(telegram_id) : null,
      skills: [],
      interests: [],
      avatar_url: avatar_url || null,
      system_role_id: system_role_id || null,
    });

    return NextResponse.json(publicUser(user), { status: 201 });
  } catch (error) {
    console.error('Failed to create staff user:', error);
    return NextResponse.json({ error: 'Не удалось создать сотрудника' }, { status: 500 });
  }
}
