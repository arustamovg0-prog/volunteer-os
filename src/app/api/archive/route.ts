import { NextRequest, NextResponse } from 'next/server';
import { db, prisma } from '@/lib/db';
import { requirePrivilegedRequest } from '@/lib/security';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const items = await db.getArchiveItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch archive items:', error);
    return NextResponse.json({ error: 'Failed to fetch archive items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'cleanup') {
      const authError = requirePrivilegedRequest(req, ['admin', 'manager']);
      if (authError) return authError;

      // Find empty chats and delete them using Prisma
      const chats = await db.getChats();
      let initialChatCount = chats.length;
      if (initialChatCount === 0) {
        return NextResponse.json({ deletedCount: 0, message: 'No chats to clean' });
      }

      // Filter chats that have at least one message
      let activeChatsCount = 0;
      for (const chat of chats) {
        const messages = await db.getChatMessages(chat.id);
        if (messages.length > 0) {
          activeChatsCount++;
        } else {
          // It's empty, delete it
          await prisma.chat.delete({ where: { id: chat.id } });
        }
      }

      const deletedCount = initialChatCount - activeChatsCount;

      return NextResponse.json({
        success: true,
        deletedCount,
        message: `Успешно удалено пустых чатов: ${deletedCount}`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to run archive cleanup:', error);
    return NextResponse.json({ error: 'Failed to run cleanup' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin', 'manager']);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Archive item ID is required' }, { status: 400 });
    }

    await db.deleteArchiveItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete archive item:', error);
    return NextResponse.json({ error: 'Failed to delete archive item' }, { status: 500 });
  }
}
