import { NextRequest, NextResponse } from 'next/server';
import { handleBotUpdate } from '@/lib/bot-logic';
import { db } from '@/lib/db';
import { rateLimitRequest, validateTelegramSecret } from '@/lib/security';
import { generateLeaderKnowledgeAnswer, isLeaderMention } from '@/lib/leader-ai';

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = rateLimitRequest(req, 'telegram-webhook', 120, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    if (!validateTelegramSecret(req)) {
      return NextResponse.json({ error: 'Invalid Telegram webhook secret' }, { status: 401 });
    }

    const update = await req.json();
    
    let telegramId: number | null = null;
    let text = '';
    let username = '';
    let phone: string | null = null;

    if (update.message) {
      telegramId = update.message.chat.id;
      username = update.message.from?.username || '';
      if (update.message.contact) {
        phone = update.message.contact.phone_number;
        text = '';
      } else if (update.message.voice) {
        text = '[Голосовое сообщение] Выполнена работа по задаче.';
      } else {
        text = update.message.text || '';
      }
    } else if (update.callback_query) {
      telegramId = update.callback_query.message.chat.id;
      username = update.callback_query.from?.username || '';
      text = update.callback_query.data || '';
    }

    if (telegramId === null) {
      return NextResponse.json({ ok: true });
    }

    const chatType = update.message?.chat?.type || update.callback_query?.message?.chat?.type || 'private';
    if (chatType === 'group' || chatType === 'supergroup') {
      if (text) {
        const groupTitle = update.message?.chat?.title || 'Telegram группа';
        const author = update.message?.from?.username ? `@${update.message.from.username}` : (update.message?.from?.first_name || 'участник');
        const groupText = `[Группа: ${groupTitle}] ${author}: ${text}`;
        await db.createMockMessage(telegramId, 'user', groupText);

        if (isLeaderMention(text)) {
          const answer = await generateLeaderKnowledgeAnswer(groupText);
          await db.createMockMessage(telegramId, 'bot', answer.text);

          return NextResponse.json({
            method: 'sendMessage',
            chat_id: telegramId,
            text: answer.text,
            reply_to_message_id: update.message?.message_id,
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Save message to simulator history as user input
    try {
      if (text || phone) {
        await db.createMockMessage(
          telegramId,
          'user',
          phone ? `📱 [Поделился контактом: ${phone}]` : text
        );
      }
    } catch (e) {
      console.error('Failed to save user mock message:', e);
    }

    // Process update through the state-machine
    const response = await handleBotUpdate(telegramId, text, username, phone);

    // Save bot response to simulator history
    try {
      await db.createMockMessage(
        telegramId,
        'bot',
        response.text,
        response.keyboard
      );
    } catch (e) {
      console.error('Failed to save bot mock message:', e);
    }

    // Format reply markup for Telegram
    let replyMarkup: any = undefined;
    if (response.keyboard) {
      const hasContactRequest = response.keyboard.some(row => row.some(btn => btn.request_contact));
      if (hasContactRequest) {
        replyMarkup = {
          keyboard: response.keyboard.map(row => 
            row.map(btn => ({
              text: btn.text,
              request_contact: btn.request_contact
            }))
          ),
          one_time_keyboard: true,
          resize_keyboard: true
        };
      } else {
        replyMarkup = {
          inline_keyboard: response.keyboard.map(row => 
            row.map(btn => ({
              text: btn.text,
              callback_data: btn.callback_data
            }))
          )
        };
      }
    }

    // Reply directly in the webhook HTTP response
    return NextResponse.json({
      method: 'sendMessage',
      chat_id: telegramId,
      text: response.text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

export async function GET() {
  return new Response('Telegram Webhook route is active. Send POST requests.');
}
