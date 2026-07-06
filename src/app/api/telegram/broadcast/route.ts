import { NextRequest, NextResponse } from 'next/server';
import { db, prisma } from '@/lib/db';
import { requirePrivilegedRequest } from '@/lib/security';
import { sendTelegramMessage } from '@/lib/telegram-api';

export async function POST(req: NextRequest) {
  try {
    // Check authorization: only admin or manager can broadcast
    const authError = requirePrivilegedRequest(req, ['admin', 'manager']);
    if (authError) return authError;

    const body = await req.json();
    const { message, roles } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Сообщение обязательно' }, { status: 400 });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: 'Не выбраны роли для рассылки' }, { status: 400 });
    }

    // Find all users matching the requested roles and with a valid telegramId
    const users = await prisma.user.findMany({
      where: {
        role: { in: roles },
        telegramId: { not: null }
      },
      select: {
        telegramId: true
      }
    });

    if (users.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'Нет пользователей с привязанным Telegram в выбранных группах' });
    }

    // Send messages in parallel (or batch them if there are thousands, but for 100+ parallel is fine)
    let successCount = 0;
    
    // Create an array of promises for sending messages
    const sendPromises = users.map(async (user) => {
      if (!user.telegramId) return;
      
      const success = await sendTelegramMessage(Number(user.telegramId), message);
      if (success) {
        successCount++;
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ 
      success: true, 
      count: successCount,
      totalAttempted: users.length 
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
