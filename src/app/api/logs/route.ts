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
  
  if (!session || !['developer', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized. Access restricted to developer and admin.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit') || '100';
  const levelFilter = searchParams.get('level');
  const sectionFilter = searchParams.get('section');
  const query = searchParams.get('query');

  try {
    const startPing = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startPing;

    const whereClause: any = {};
    if (levelFilter && levelFilter !== 'ALL') {
      whereClause.level = levelFilter;
    }
    if (sectionFilter && sectionFilter !== 'ALL') {
      whereClause.source = sectionFilter;
    }
    if (query) {
      whereClause.OR = [
        { message: { contains: query, mode: 'insensitive' } },
        { source: { contains: query, mode: 'insensitive' } }
      ];
    }

    const [logs, totalErrors, totalWarns, botRegistrationsCount, platformUsersCount] = await Promise.all([
      prisma.systemLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limitParam, 10),
      }),
      prisma.systemLog.count({ where: { level: 'ERROR' } }),
      prisma.systemLog.count({ where: { level: 'WARN' } }),
      prisma.volunteerApplication.count(),
      prisma.user.count()
    ]);

    return NextResponse.json({
      logs,
      stats: {
        dbLatency,
        totalErrors,
        totalWarns,
        botRegistrationsCount,
        platformUsersCount,
        status: dbLatency < 500 ? 'HEALTHY' : 'DEGRADED'
      }
    });
  } catch (error) {
    console.error('Failed to fetch system logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
