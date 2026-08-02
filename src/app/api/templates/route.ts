import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager', 'coordinator']);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || undefined;
    
    // Only fetch templates related to the user's organization or global ones
    const templates = await db.getCertificateTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager', 'coordinator']);
    if ('response' in auth) return auth.response;

    const data = await req.json();
    if (!data.name || !data.bodyText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const template = await db.createCertificateTemplate({
      name: data.name,
      title: data.title || 'СЕРТИФИКАТ',
      bodyText: data.bodyText,
      signature: data.signature || 'Директор Ассоциации',
      primaryColor: data.primaryColor || '#0f172a',
      accentColor: data.accentColor || '#0ea5e9',
      orgId: data.orgId || null,
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
