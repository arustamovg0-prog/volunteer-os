import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parameters = await db.kPIParameter.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(parameters);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch KPI parameters' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parameter = await db.kPIParameter.create({
      data: {
        name: body.name,
        description: body.description,
        unit: body.unit || 'points',
        weight: body.weight ? parseFloat(body.weight) : 1.0
      }
    });

    return NextResponse.json(parameter);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create KPI parameter' }, { status: 500 });
  }
}
