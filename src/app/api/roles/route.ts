import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.systemRole.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, permissions } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const role = await prisma.systemRole.create({
      data: {
        name,
        permissions: permissions || [],
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
