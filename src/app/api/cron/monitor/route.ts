import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logSystemEvent } from '@/lib/logger';

// Vercel Cron Job endpoint
export async function GET(request: Request) {
  // Check authorization header for Vercel Cron (optional but recommended)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const startTime = Date.now();
    
    // Test DB connection by fetching 1 user
    await prisma.user.findFirst();
    
    const duration = Date.now() - startTime;

    // Log the successful health check
    await logSystemEvent('INFO', `Health Check OK (${duration}ms)`, { duration }, 'cron');

    return NextResponse.json({ success: true, duration });
  } catch (error: any) {
    // If DB is down or connection fails, log it as an error
    // (Note: if DB is truly down, logSystemEvent will still try to send a Telegram alert before failing DB insert)
    await logSystemEvent('ERROR', `Health Check FAILED: ${error.message}`, { stack: error.stack }, 'cron');

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
