import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const parameters = await prisma.kPIParameter.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(parameters);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch KPI parameters' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const parameter = await prisma.kPIParameter.create({
      data: {
        name: body.name,
        description: body.description,
        unit: body.unit || 'points',
        weight: body.weight ? parseFloat(body.weight) : 1.0,
      },
    });

    return NextResponse.json(parameter);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create KPI parameter' }, { status: 500 });
  }
}
