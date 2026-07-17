import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/security';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token to get user role
    const sessionUser = verifySessionToken(token);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role !== 'admin' && sessionUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = id;

    // Fetch the target user to get their telegramId
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Only admins can delete other admins or managers
    if (targetUser.role !== 'volunteer' && sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete staff members' }, { status: 403 });
    }

    // Delete related TelegramSession if it exists
    if (targetUser.telegramId) {
      await prisma.telegramSession.deleteMany({
        where: { telegramId: targetUser.telegramId },
      });
      // Delete any VolunteerApplications tied to this telegram_id
      await prisma.volunteerApplication.deleteMany({
        where: { telegramId: targetUser.telegramId },
      });
    }

    // Delete the user (cascades should handle the rest based on schema)
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
