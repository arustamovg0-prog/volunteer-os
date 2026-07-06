import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, isPrivilegedRequest } from '@/lib/security';

type Priority = 'high' | 'medium' | 'low';

interface AgendaItem {
  id: string;
  source: 'internal_chat' | 'telegram';
  source_label: string;
  chat_title: string;
  author: string;
  role: string;
  text: string;
  created_at: string;
  priority: Priority;
  categories: string[];
  mentions: string[];
  reason: string;
  action: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Риски': ['риск', 'проблем', 'жалоб', 'конфликт', 'не приш', 'опозд', 'отмен', 'срыв', 'провал', 'не хватает', 'нет волонтер', 'чс', 'авар', 'пожар', 'опасн'],
  'Срочно': ['срочно', 'сегодня', 'сейчас', 'asap', 'дедлайн', 'deadline', 'немедленно', 'горит', 'до вечера'],
  'Волонтеры': ['волонтер', 'волонтёр', 'команда', 'участник', 'смена', 'явка', 'координатор', 'дежур'],
  'Партнеры': ['партнер', 'партнёр', 'организац', 'нно', 'министерств', 'хокимият', 'спонсор', 'донор', 'uva'],
  'Финансы': ['деньги', 'бюджет', 'счет', 'счёт', 'оплат', 'расход', 'грант', 'закуп', 'инвойс'],
  'Медиа': ['фото', 'видео', 'пост', 'smm', 'сторис', 'отчет', 'отчёт', 'релиз', 'контент'],
  'Логистика': ['адрес', 'машина', 'транспорт', 'доставка', 'склад', 'инвентарь', 'материал', 'локац'],
};

const NEGATIVE_KEYWORDS = ['не ', 'нет ', 'невозможно', 'срыв', 'конфликт', 'жалоба', 'опасн', 'проблем', 'отмен', 'опозд'];

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function classify(text: string): Pick<AgendaItem, 'priority' | 'categories' | 'mentions' | 'reason' | 'action'> {
  const normalized = text.toLowerCase();
  const categories = Object.entries(CATEGORY_KEYWORDS)
    .filter(([, words]) => includesAny(normalized, words))
    .map(([category]) => category);

  if (categories.length === 0) categories.push('Общее');

  const mentions = Array.from(new Set([
    ...(text.match(/@[a-zA-Z0-9_]+/g) || []),
    ...(text.match(/#[\p{L}0-9_]+/gu) || []),
  ])).slice(0, 8);

  const hasRisk = categories.includes('Риски') || includesAny(normalized, NEGATIVE_KEYWORDS);
  const isUrgent = categories.includes('Срочно');
  const hasFinance = categories.includes('Финансы');
  const hasPartner = categories.includes('Партнеры');

  let priority: Priority = 'low';
  if (hasRisk || isUrgent) priority = 'high';
  else if (hasFinance || hasPartner || categories.includes('Логистика')) priority = 'medium';

  const reason = priority === 'high'
    ? 'Есть признаки срочности или операционного риска.'
    : priority === 'medium'
      ? 'Нужно управленческое внимание, но нет явного кризиса.'
      : 'Информационное сообщение для контекста.';

  const action = priority === 'high'
    ? 'Назначить ответственного, уточнить статус в течение 30 минут и зафиксировать следующее действие.'
    : priority === 'medium'
      ? 'Проверить владельца вопроса и добавить в план ближайшего координационного созвона.'
      : 'Оставить в мониторинге и вернуться при появлении новых упоминаний.';

  return { priority, categories, mentions, reason, action };
}

function compact(text: string, max = 420) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, '')}...`;
}

function withinPeriod(createdAt: string, period: string) {
  if (period === 'all') return true;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const days = period === 'today' ? 1 : period === '30d' ? 30 : 7;
  return created >= now - days * 24 * 60 * 60 * 1000;
}

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if ((!session || !['admin', 'manager'].includes(session.role)) && !isPrivilegedRequest(req, ['admin', 'manager'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';
    const category = searchParams.get('category') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const source = searchParams.get('source') || 'all';
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    const chats = await db.getChats();
    const chatItems: AgendaItem[] = [];
    for (const chat of chats) {
      const messages = await db.getChatMessages(chat.id);
      for (const message of messages) {
        const classified = classify(message.text);
        chatItems.push({
          id: `chat:${message.id}`,
          source: 'internal_chat',
          source_label: 'Внутренний чат',
          chat_title: chat.title,
          author: message.sender_name,
          role: message.sender_role,
          text: compact(message.text),
          created_at: message.created_at,
          ...classified,
        });
      }
    }

    const mockMessages = await db.getAllMockMessages();
    const users = await db.getUsers();
    const telegramItems: AgendaItem[] = mockMessages
      .filter((message) => message.sender === 'user' || message.text.startsWith('Ответ ИИ-ассистента руководителя:'))
      .map((message) => {
        const volunteer = users.find((user) => Number(user.telegram_id) === Number(message.telegram_id));
        const isGroup = Number(message.telegram_id) < 0 || message.text.startsWith('[Группа:');
        const isLeaderAssistantReply = message.sender === 'bot' && message.text.startsWith('Ответ ИИ-ассистента руководителя:');
        const classified = classify(message.text);
        return {
          id: `telegram:${message.id}`,
          source: 'telegram' as const,
          source_label: isGroup ? 'Telegram группа' : 'Telegram бот',
          chat_title: isGroup ? 'Групповой поток Telegram' : `Telegram: ${volunteer?.full_name || message.telegram_id}`,
          author: isLeaderAssistantReply ? 'ИИ-ассистент руководителя' : (volunteer?.full_name || 'Telegram участник'),
          role: isLeaderAssistantReply ? 'assistant' : 'telegram',
          text: compact(message.text),
          created_at: message.created_at,
          ...classified,
        };
      });

    let items = [...chatItems, ...telegramItems]
      .filter((item) => withinPeriod(item.created_at, period))
      .filter((item) => source === 'all' || item.source === source)
      .filter((item) => priority === 'all' || item.priority === priority)
      .filter((item) => category === 'all' || item.categories.includes(category))
      .filter((item) => !q || `${item.text} ${item.author} ${item.chat_title} ${item.categories.join(' ')}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const priorityRank = { high: 3, medium: 2, low: 1 };
        const byPriority = priorityRank[b.priority] - priorityRank[a.priority];
        if (byPriority !== 0) return byPriority;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    items = items.slice(0, 120);

    const high = items.filter((item) => item.priority === 'high');
    const medium = items.filter((item) => item.priority === 'medium');
    const categoryCounts = Object.keys(CATEGORY_KEYWORDS).map((name) => ({
      name,
      count: items.filter((item) => item.categories.includes(name)).length,
    }));

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      filters: { period, category, priority, source, q },
      summary: {
        total: items.length,
        high: high.length,
        medium: medium.length,
      internal: items.filter((item) => item.source === 'internal_chat').length,
      telegram: items.filter((item) => item.source === 'telegram').length,
      auto_replies: items.filter((item) => item.role === 'assistant').length,
        top_categories: categoryCounts.filter((item) => item.count > 0).sort((a, b) => b.count - a.count),
      digest: high.slice(0, 3).map((item) => item.text),
      latest_replies: items.filter((item) => item.role === 'assistant').slice(0, 3).map((item) => item.text),
        recommended_actions: [
          high.length > 0 ? `Разобрать ${high.length} срочных сигналов и назначить владельцев.` : 'Срочных сигналов нет.',
          medium.length > 0 ? `Поставить ${medium.length} вопросов средней важности в план координации.` : 'Средних вопросов нет.',
          'Проверить новые Telegram-упоминания перед ежедневным созвоном.',
        ],
      },
      items,
    });
  } catch (error) {
    console.error('Agenda assistant failed:', error);
    return NextResponse.json({ error: 'Agenda assistant failed' }, { status: 500 });
  }
}
