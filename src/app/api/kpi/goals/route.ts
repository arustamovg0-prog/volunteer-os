import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (auth.session.role !== 'admin' && userId !== auth.session.userId) {
      if (userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const targetUserId = userId || auth.session.userId;

    const goals = await prisma.kPIGoal.findMany({
      where: { userId: targetUserId },
      include: { parameter: true },
      orderBy: { periodStart: 'desc' },
    });

    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch KPI goals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const goal = await prisma.kPIGoal.create({
      data: {
        kpiParameterId: body.kpiParameterId,
        userId: body.userId,
        targetValue: parseFloat(body.targetValue),
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
      },
      include: { parameter: true },
    });

    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create KPI goal' }, { status: 500 });
  }
}
