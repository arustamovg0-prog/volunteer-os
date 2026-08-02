import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager', 'coordinator']);
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const template = await db.getCertificateTemplate(id);
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager', 'coordinator']);
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const data = await req.json();

    const existing = await db.getCertificateTemplate(id);
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const updated = await db.updateCertificateTemplate(id, {
      name: data.name,
      title: data.title,
      bodyText: data.bodyText,
      signature: data.signature,
      primaryColor: data.primaryColor,
      accentColor: data.accentColor,
      orgId: data.orgId !== undefined ? data.orgId : existing.orgId
    });

    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']); // Only admins/managers can delete
    if ('response' in auth) return auth.response;

    const { id } = await params;
    
    const existing = await db.getCertificateTemplate(id);
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await db.deleteCertificateTemplate(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
