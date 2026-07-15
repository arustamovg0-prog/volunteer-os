import { NextRequest, NextResponse } from 'next/server';
import { logSystemEvent, LogLevel } from '@/lib/logger';
import { getSessionFromRequest } from '@/lib/security';
import { prisma } from '@/lib/db';

// POST: Create a new log (used by client-side error boundaries)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { level, message, details, source } = body;

    // Validate
    if (!level || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await logSystemEvent(level as LogLevel, message, details, source || 'client');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process client log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Fetch logs for the monitoring dashboard
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Only admins can access system logs.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit') || '100';
  const levelFilter = searchParams.get('level');

  try {
    const whereClause = levelFilter ? { level: levelFilter } : {};

    const logs = await prisma.systemLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limitParam, 10),
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch system logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
