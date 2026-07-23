import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { name, permissions } = body;

    const role = await prisma.systemRole.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(Array.isArray(permissions) && { permissions }),
      },
    });

    return NextResponse.json(role);
  } catch (error: any) {
    console.error('Error updating role:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Роль с таким названием уже существует' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const { id } = await params;

    await prisma.systemRole.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
