import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const volunteerId = auth.session.role === 'volunteer' ? auth.session.userId : searchParams.get('volunteerId');

    if (!volunteerId) {
      return NextResponse.json({ error: 'Volunteer ID parameter is required' }, { status: 400 });
    }

    const recommendations = await db.getRecommendations(volunteerId);
    const [projects, organizations] = await Promise.all([
      db.getProjects(),
      db.getOrganizations(),
    ]);
    
    // Enrich tasks with project details for rendering context
    const enrichedRecommendations = recommendations.map((task) => {
      const project = projects.find((p) => p.id === task.project_id);
      const org = project ? organizations.find((o) => o.id === project.org_id) : null;
      return {
        ...task,
        project_title: project ? project.title : 'Неизвестный проект',
        org_name: org ? org.name : 'Ассоциация',
        org_category: org ? org.category : 'Социальная помощь'
      };
    });

    return NextResponse.json({
      recommendations: enrichedRecommendations
    });
  } catch (error) {
    console.error('Failed to get task recommendations:', error);
    return NextResponse.json({ error: 'Failed to get task recommendations' }, { status: 500 });
  }
}
