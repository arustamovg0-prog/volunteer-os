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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, permissions } = body;

    const role = await prisma.systemRole.update({
      where: { id },
      data: {
        name,
        permissions
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.systemRole.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
