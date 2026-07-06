import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const volunteerId = auth.session.role === 'volunteer' ? auth.session.userId : searchParams.get('volunteerId');
    const taskId = searchParams.get('taskId');
    const projectId = searchParams.get('projectId');

    let checkins = await db.getCheckIns();

    if (volunteerId) {
      checkins = checkins.filter(c => c.user_id === volunteerId);
    }

    if (projectId) {
      checkins = checkins.filter(c => c.project_id === projectId);
    }

    // Sort by date descending
    checkins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Map to report structure if necessary, or just return check-ins
    // We map user_id -> volunteer_id, text_report -> q2_text, and set q1_done = true to keep backwards compatibility
    const mappedReports = checkins.map(c => ({
      id: c.id,
      task_id: taskId || '',
      volunteer_id: c.user_id,
      q1_done: true,
      q2_text: c.text_report,
      created_at: c.created_at
    }));

    return NextResponse.json(mappedReports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
