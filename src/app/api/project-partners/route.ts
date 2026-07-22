import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const projectPartners = await db.projectPartner.findMany({
      where: { projectId },
      include: {
        partner: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(projectPartners);
  } catch (error) {
    console.error('Error fetching project partners:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth || (auth.role !== 'admin' && auth.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { projectId, partnerId, role } = body;

    if (!projectId || !partnerId) {
      return NextResponse.json({ error: 'projectId and partnerId are required' }, { status: 400 });
    }

    // 1. Check if already exists
    const existing = await db.projectPartner.findFirst({
      where: { projectId, partnerId }
    });

    if (existing) {
      return NextResponse.json({ error: 'Partner already linked to this project' }, { status: 400 });
    }

    // 2. Fetch project name to log in activity
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { title: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 3. Create ProjectPartner link AND PartnerActivity in a transaction
    const result = await db.$transaction([
      db.projectPartner.create({
        data: {
          projectId,
          partnerId,
          role
        },
        include: {
          partner: true
        }
      }),
      db.partnerActivity.create({
        data: {
          partnerId,
          eventName: project.title,
          description: `Присоединен к проекту в роли: ${role || 'Партнер'}`,
          date: new Date()
        }
      })
    ]);

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error adding project partner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth || (auth.role !== 'admin' && auth.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await db.projectPartner.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing project partner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
