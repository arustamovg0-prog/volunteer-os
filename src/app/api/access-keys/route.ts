import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptSecret, maskSecret, requirePrivilegedRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin', 'manager']);
    if (authError) return authError;

    const canReveal = req.headers.get('x-volunteer-os-reveal-secret') === 'true';
    const keys = await db.getAccessKeys();
    return NextResponse.json(keys.map((key) => {
      const decrypted = canReveal ? decryptSecret(key.password_encrypted) : '';
      return {
        ...key,
        password_encrypted: canReveal ? decrypted : maskSecret(decrypted || key.password_encrypted),
        secret_available: true,
      };
    }));
  } catch (error) {
    console.error('Failed to fetch access keys:', error);
    return NextResponse.json({ error: 'Failed to fetch access keys' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin']);
    if (authError) return authError;

    const body = await req.json();
    const { name, category, username, password_encrypted, notes } = body;

    if (!name || !category || !username || !password_encrypted) {
      return NextResponse.json({ error: 'Missing required access key fields' }, { status: 400 });
    }

    const newKey = await db.createAccessKey({
      name,
      category,
      username,
      password_encrypted,
      notes: notes || ''
    });

    return NextResponse.json(newKey, { status: 201 });
  } catch (error) {
    console.error('Failed to create access key:', error);
    return NextResponse.json({ error: 'Failed to create access key' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin']);
    if (authError) return authError;

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Access Key ID is required' }, { status: 400 });
    }

    const updated = await db.updateAccessKey(id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update access key:', error);
    return NextResponse.json({ error: 'Failed to update access key' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin']);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Access Key ID is required' }, { status: 400 });
    }

    await db.deleteAccessKey(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete access key:', error);
    return NextResponse.json({ error: 'Failed to delete access key' }, { status: 500 });
  }
}
