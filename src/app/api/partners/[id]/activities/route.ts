import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { id } = await params;

    const activities = await prisma.partnerActivity.findMany({
      where: { partnerId: id },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching partner activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { eventName, description, date } = body;

    if (!eventName) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }

    const activity = await prisma.partnerActivity.create({
      data: {
        partnerId: id,
        eventName,
        description,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error creating partner activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
