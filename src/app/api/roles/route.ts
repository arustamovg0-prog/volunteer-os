import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const roles = await prisma.systemRole.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { name, permissions } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Название роли обязательно' }, { status: 400 });
    }

    const role = await prisma.systemRole.create({
      data: {
        name: name.trim(),
        permissions: Array.isArray(permissions) ? permissions : [],
      },
    });

    return NextResponse.json(role);
  } catch (error: any) {
    console.error('Error creating role:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Роль с таким названием уже существует' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
