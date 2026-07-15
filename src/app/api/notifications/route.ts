import { NextRequest, NextResponse } from 'next/server';
import { requireSessionRequest } from '@/lib/security';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { session, response } = requireSessionRequest(req);
  if (response) return response;

  try {
    const notifications = await db.getNotifications(session!.userId);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    
    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { session, response } = requireSessionRequest(req);
  if (response) return response;

  try {
    const { id } = await req.json();
    if (!id) {
      // Mark all as read
      const notifications = await db.getNotifications(session!.userId);
      for (const n of notifications) {
        if (!n.is_read) {
          await db.markNotificationAsRead(n.id);
        }
      }
      return NextResponse.json({ success: true, message: 'All marked as read' });
    }

    await db.markNotificationAsRead(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
