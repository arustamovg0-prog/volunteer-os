import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, requirePrivilegedRequest, requireSessionRequest } from '@/lib/security';

function publicUser(user: any) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    let users = await db.getUsers();

    if (auth.session.role === 'volunteer') {
      users = users.filter(u => u.id === auth.session.userId);
    }

    if (role) {
      users = users.filter(u => u.role === role);
    }

    // Sort by rating descending
    users.sort((a, b) => b.rating - a.rating);

    return NextResponse.json(users.map(publicUser));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, full_name, login, password, telegram_id, phone, skills, interests, latitude, longitude, avatar_url } = body;

    if (!full_name || !role) {
      return NextResponse.json({ error: 'Role and full name are required' }, { status: 400 });
    }

    if (!['admin', 'manager', 'volunteer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (role !== 'volunteer') {
      const authError = requirePrivilegedRequest(req, ['admin']);
      if (authError) return authError;
    }

    if (role === 'volunteer' && ['admin', 'manager'].includes(body.role_override)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (password && password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (login) {
      const existingUser = await db.getUserByLogin(String(login));
      if (existingUser) {
        return NextResponse.json({ error: 'Пользователь с таким логином уже существует' }, { status: 409 });
      }
    }

    const newUser = await db.createUser({
      role,
      full_name,
      login: login ? String(login).trim().toLowerCase() : null,
      password_hash: password ? hashPassword(password) : null,
      telegram_id: telegram_id ? Number(telegram_id) : null,
      phone: phone || null,
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      latitude: latitude !== undefined ? Number(latitude) : undefined,
      longitude: longitude !== undefined ? Number(longitude) : undefined,
      avatar_url: avatar_url || null
    });

    return NextResponse.json(publicUser(newUser), { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const isOwnProfile = id === auth.session.userId;
    const canManageUsers = ['admin', 'manager', 'coordinator'].includes(auth.session.role);
    if (!canManageUsers && !isOwnProfile) {
      return NextResponse.json({ error: 'Volunteers can update only their own profile' }, { status: 403 });
    }

    if (!canManageUsers) {
      const allowedSelfFields = new Set([
        'full_name',
        'phone',
        'telegram_id',
        'skills',
        'interests',
        'latitude',
        'longitude',
        'avatar_url',
        'availability_status',
        'available_until',
        'availability_note',
        'password',
      ]);

      for (const key of Object.keys(updates)) {
        if (!allowedSelfFields.has(key)) {
          delete updates[key];
        }
      }
    }

    if (updates.password) {
      if (String(updates.password).length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      updates.password_hash = hashPassword(String(updates.password));
      delete updates.password;
    }

    const updatedUser = await db.updateUser(id, updates);
    return NextResponse.json(publicUser(updatedUser));
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
