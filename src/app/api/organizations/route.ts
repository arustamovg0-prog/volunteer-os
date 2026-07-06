import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let orgs = await db.getOrganizations();

    if (category) {
      orgs = orgs.filter(o => o.category === category);
    }

    // Sort by name
    orgs.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(orgs);
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { name, description, category, avatar_url, contacts } = body;

    if (!name || !category || !description) {
      return NextResponse.json({ error: 'Name, description and category are required' }, { status: 400 });
    }

    const newOrg = await db.createOrganization({
      name,
      description,
      category,
      avatar_url: avatar_url || null,
      contacts: contacts || ''
    });

    return NextResponse.json(newOrg, { status: 201 });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
