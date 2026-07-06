import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  const { session, response } = requireSessionRequest(req, ['coordinator']);
  if (response) return response;

  try {
    // Get all projects and filter to those assigned to this coordinator
    const allProjects = await db.getProjects();
    const allTasks = await db.getTasks();
    const allUsers = await db.getUsers();

    // Filter projects where coordinator_id matches current user
    const myProjects = allProjects.filter(
      (p: any) => p.coordinator_id === session!.userId
    );

    // Enrich each project with task and volunteer counts
    const enriched = myProjects.map((project) => {
      const projectTasks = allTasks.filter((t) => t.project_id === project.id);
      const completedTasks = projectTasks.filter((t) => t.status === 'completed').length;

      // Unique volunteers assigned to tasks in this project
      const volunteerIds = new Set(
        projectTasks
          .map((t) => t.assigned_to)
          .filter(Boolean) as string[]
      );

      return {
        ...project,
        taskCount: projectTasks.length,
        completedTasks,
        volunteerCount: volunteerIds.size,
      };
    });

    return NextResponse.json({ projects: enriched });
  } catch (error) {
    console.error('Coordinator projects fetch error:', error);
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
}
