import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || searchParams.get('org_id');

    let news = await db.getOrganizationNews();

    if (orgId) {
      news = news.filter(n => n.org_id === orgId);
    }

    // Sort by created_at descending
    news.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(news);
  } catch (error) {
    console.error('Failed to fetch organization news:', error);
    return NextResponse.json({ error: 'Failed to fetch organization news' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { org_id, title, content } = body;

    if (!org_id || !title || !content) {
      return NextResponse.json({ error: 'org_id, title, and content are required' }, { status: 400 });
    }

    const newNews = await db.createOrganizationNews({
      org_id,
      title,
      content
    });

    return NextResponse.json(newNews, { status: 201 });
  } catch (error) {
    console.error('Failed to create organization news:', error);
    return NextResponse.json({ error: 'Failed to create organization news' }, { status: 500 });
  }
}
