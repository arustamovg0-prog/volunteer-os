import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

type Params = Promise<{ id: string; resourceId: string }>;

// DELETE /api/kb/articles/[id]/resources/[resourceId]
export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { resourceId } = await segmentData.params;
    await db.deleteKBResource(resourceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete KB resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
