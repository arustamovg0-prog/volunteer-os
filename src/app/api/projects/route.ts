import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let projects = await db.getProjects();

    if (status) {
      projects = projects.filter(p => p.status === status);
    }

    // Sort by creation date descending
    projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { title, description, status, start_date, end_date } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newProject = await db.createProject({
      title,
      description: description || '',
      status: status || 'planning',
      start_date: start_date || null,
      end_date: end_date || null
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// PATCH /api/projects — assign a coordinator to a project
export async function PATCH(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { projectId, coordinatorId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Use JSON DB fallback: update coordinator_id field directly
    const updated = await db.updateProject(projectId, { coordinator_id: coordinatorId || null } as any);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to assign coordinator:', error);
    return NextResponse.json({ error: 'Failed to assign coordinator' }, { status: 500 });
  }
}
