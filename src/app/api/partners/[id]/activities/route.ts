import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const activities = await prisma.partnerActivity.findMany({
      where: { partnerId: id },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching partner activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      }
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error creating partner activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
