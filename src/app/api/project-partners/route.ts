import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const projectPartners = await prisma.projectPartner.findMany({
      where: { projectId },
      include: {
        partner: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projectPartners);
  } catch (error) {
    console.error('Error fetching project partners:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { projectId, partnerId, role } = body;

    if (!projectId || !partnerId) {
      return NextResponse.json({ error: 'projectId and partnerId are required' }, { status: 400 });
    }

    const existing = await prisma.projectPartner.findFirst({
      where: { projectId, partnerId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Partner already linked to this project' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const result = await prisma.$transaction([
      prisma.projectPartner.create({
        data: {
          projectId,
          partnerId,
          role,
        },
        include: {
          partner: true,
        },
      }),
      prisma.partnerActivity.create({
        data: {
          partnerId,
          eventName: project.title,
          description: `Присоединен к проекту в роли: ${role || 'Партнер'}`,
          date: new Date(),
        },
      }),
    ]);

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error adding project partner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.projectPartner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing project partner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
