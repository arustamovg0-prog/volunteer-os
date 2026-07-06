import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const docs = await db.getHrDocuments();
    return NextResponse.json(docs);
  } catch (error) {
    console.error('Failed to fetch HR documents:', error);
    return NextResponse.json({ error: 'Failed to fetch HR documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { employee_name, doc_type, details } = body;

    if (!employee_name || !doc_type || !details) {
      return NextResponse.json({ error: 'Missing required document fields' }, { status: 400 });
    }

    const newDoc = await db.createHrDocument({
      employee_name,
      doc_type,
      details
    });

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error('Failed to create HR document:', error);
    return NextResponse.json({ error: 'Failed to create HR document' }, { status: 500 });
  }
}
