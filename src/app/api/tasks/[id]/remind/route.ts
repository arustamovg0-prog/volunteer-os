import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';
import { sendTelegramMessage } from '@/lib/telegram-api';

type Params = Promise<{ id: string }>;

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Ожидает принятия';
    case 'accepted':
      return 'В работе';
    case 'completed':
      return 'Выполнена';
    default:
      return status;
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { id } = await segmentData.params;
    const task = await db.getTask(id);

    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    if (!task.assigned_to) {
      return NextResponse.json({ error: 'У задачи нет ответственного сотрудника или волонтера' }, { status: 400 });
    }

    const assignee = await db.getUser(task.assigned_to);
    if (!assignee) {
      return NextResponse.json({ error: 'Ответственный пользователь не найден' }, { status: 404 });
    }

    if (!assignee.telegram_id) {
      return NextResponse.json({
        error: `У пользователя ${assignee.full_name} не привязан Telegram ID. Добавьте Telegram ID в профиле пользователя.`
      }, { status: 400 });
    }

    const project = await db.getProject(task.project_id);
    const deadline = new Date(task.deadline);
    const isOverdue = deadline.getTime() < Date.now();
    const senderName = auth.session.fullName || 'Руководитель';
    const text = `${isOverdue ? '🚨' : '🔔'} *Напоминание по задаче*\n\n` +
      `👤 *От:* ${senderName}\n` +
      `📌 *Задача:* ${task.title}\n` +
      `📂 *Проект:* ${project?.title || 'Не указан'}\n` +
      `📊 *Статус:* ${statusLabel(task.status)}\n` +
      `⏰ *Дедлайн:* ${deadline.toLocaleDateString('ru-RU')} в ${deadline.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `${isOverdue ? 'Срок уже просрочен. Пожалуйста, срочно обновите статус или сдайте отчет.' : 'Пожалуйста, проверьте задачу и обновите статус выполнения.'}`;

    const delivered = await sendTelegramMessage(assignee.telegram_id, text, [
      [{ text: '✍️ Сдать отчет', callback_data: `report_${task.id}` }],
      [{ text: '📋 Мои задачи', callback_data: 'cmd_tasks' }]
    ]);

    if (!delivered) {
      return NextResponse.json({ error: 'Telegram API не принял сообщение. Проверьте Bot Token и доступ пользователя к боту.' }, { status: 502 });
    }

    if (isOverdue && !task.is_overdue) {
      await db.updateTask(task.id, { is_overdue: true });
    }

    return NextResponse.json({
      success: true,
      task_id: task.id,
      assignee_id: assignee.id,
      assignee_name: assignee.full_name,
      telegram_id: assignee.telegram_id
    });
  } catch (error) {
    console.error('Failed to send task reminder:', error);
    return NextResponse.json({ error: 'Не удалось отправить напоминание в Telegram' }, { status: 500 });
  }
}
