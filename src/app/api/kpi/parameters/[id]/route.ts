import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const body = await req.json();

    const updatedParameter = await prisma.kPIParameter.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.unit && { unit: body.unit }),
        ...(body.weight !== undefined && { weight: parseFloat(body.weight) }),
      },
    });

    return NextResponse.json(updatedParameter);
  } catch (error) {
    console.error('Error updating KPI parameter:', error);
    return NextResponse.json({ error: 'Failed to update KPI parameter' }, { status: 500 });
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

    await prisma.kPIParameter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting KPI parameter:', error);
    return NextResponse.json({ error: 'Failed to delete KPI parameter' }, { status: 500 });
  }
}
