import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram-api';
import { requireSessionRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const tasks = (await db.getTasks()).filter(t => t.status !== 'completed' && t.assigned_to);
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    let alertsSent = 0;
    const details: string[] = [];

    for (const task of tasks) {
      const deadline = new Date(task.deadline);
      const volunteer = await db.getUser(task.assigned_to!);

      if (!volunteer || !volunteer.telegram_id) continue;

      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Overdue (Red status)
      if (diffTime < 0) {
        // Mark as overdue in DB if not already marked
        if (!task.is_overdue) {
          await db.updateTask(task.id, { is_overdue: true });
        }

        const text = `🚨 *СРОЧНО: Дедлайн пропущен!*\n\n📌 *Задача:* "${task.title}"\n📅 *Срок истек:* ${deadline.toLocaleDateString('ru-RU')} в ${deadline.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n\nПожалуйста, свяжитесь с вашим менеджером или отправьте отчет с помощью кнопки ниже:`;
        
        await sendTelegramMessage(volunteer.telegram_id, text, [
          [{ text: '✍️ Сдать отчет', callback_data: `report_${task.id}` }],
          [{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }]
        ]);
        alertsSent++;
        details.push(`Overdue notification sent to ${volunteer.full_name} for "${task.title}"`);
      }
      // Urgent (Yellow status - less than 3 days remaining)
      else if (diffDays <= 3) {
        const text = `⏳ *Внимание: Приближается дедлайн!*\n\n📌 *Задача:* "${task.title}"\n⏰ *Осталось:* менее ${diffDays} дн. (${deadline.toLocaleDateString('ru-RU')})\n\nПожалуйста, не забудьте завершить задачу вовремя! Сдать отчет можно по кнопке ниже:`;
        
        await sendTelegramMessage(volunteer.telegram_id, text, [
          [{ text: '✍️ Сдать отчет', callback_data: `report_${task.id}` }],
          [{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }]
        ]);
        alertsSent++;
        details.push(`Urgent notification sent to ${volunteer.full_name} for "${task.title}"`);
      }
    }

    return NextResponse.json({
      success: true,
      alerts_sent: alertsSent,
      notifications: details
    });
  } catch (error) {
    console.error('Failed to run deadline check:', error);
    return NextResponse.json({ error: 'Failed to run check' }, { status: 500 });
  }
}

// Support GET for testing trigger easily in browser
export async function GET(req: NextRequest) {
  return POST(req);
}
