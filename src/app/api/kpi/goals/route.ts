import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    // If user is not admin, they can only view their own goals
    if (user.role !== 'admin' && userId !== user.id) {
       // if they requested someone else's, deny. If they requested nothing, return theirs
       if (userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
    }

    const targetUserId = userId || user.id;

    const goals = await db.kPIGoal.findMany({
      where: { userId: targetUserId },
      include: { parameter: true },
      orderBy: { periodStart: 'desc' }
    });

    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch KPI goals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const goal = await db.kPIGoal.create({
      data: {
        kpiParameterId: body.kpiParameterId,
        userId: body.userId,
        targetValue: parseFloat(body.targetValue),
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd)
      },
      include: { parameter: true }
    });

    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create KPI goal' }, { status: 500 });
  }
}
