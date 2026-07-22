import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

type Params = Promise<{ id: string }>;

// GET /api/kb/articles/[id]/resources
export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { id } = await segmentData.params;
    const resources = await db.getKBResources(id);
    return NextResponse.json(resources);
  } catch (error) {
    console.error('Failed to fetch KB resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

// POST /api/kb/articles/[id]/resources
export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { id } = await segmentData.params;
    const body = await req.json();
    const { title, url, type } = body;

    if (!title?.trim() || !url?.trim()) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    const created = await db.createKBResource({
      article_id: id,
      title: title.trim(),
      url: url.trim(),
      type: type || 'link',
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create KB resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
