import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';
import { generateDocument } from '@/lib/document-generator';

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { userId, type, projectId } = body;

    if (!userId || !type) {
      return NextResponse.json({ error: 'User ID and document type are required' }, { status: 400 });
    }

    if (auth.session.role !== 'admin' && auth.session.role !== 'manager' && auth.session.userId !== userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get user details
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let projectName = undefined;
    let hours = undefined;

    if (type === 'certificate' && projectId) {
      const projects = await db.getProjects();
      const project = projects.find(p => p.id === projectId);
      projectName = project?.title;

      const checkins = await db.getCheckIns();
      const userCheckins = checkins.filter(c => c.user_id === userId && c.project_id === projectId && c.hours);
      hours = userCheckins.reduce((acc, c) => acc + (c.hours || 0), 0);
    }

    const pdfBuffer = await generateDocument({
      volunteerName: user.full_name,
      projectName,
      hours,
      date: new Date().toLocaleDateString('ru-RU'),
      type: type as 'contract' | 'certificate'
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}_${user.id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Failed to generate document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
