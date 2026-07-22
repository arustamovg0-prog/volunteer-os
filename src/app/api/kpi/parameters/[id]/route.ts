import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updatedParameter = await db.kPIParameter.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        unit: body.unit,
        weight: body.weight ? parseFloat(body.weight) : undefined
      }
    });

    return NextResponse.json(updatedParameter);
  } catch (error) {
    console.error('Error updating KPI parameter:', error);
    return NextResponse.json({ error: 'Failed to update KPI parameter' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await db.kPIParameter.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting KPI parameter:', error);
    return NextResponse.json({ error: 'Failed to delete KPI parameter' }, { status: 500 });
  }
}
