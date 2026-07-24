import { NextRequest, NextResponse } from 'next/server';
import { handleBotUpdate } from '@/lib/bot-logic';
import { db } from '@/lib/db';
import { rateLimitRequest, validateTelegramSecret } from '@/lib/security';
import { generateLeaderKnowledgeAnswer, isLeaderMention } from '@/lib/leader-ai';
import { waitUntil } from '@vercel/functions';

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = rateLimitRequest(req, 'telegram-webhook', 5000, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    if (!validateTelegramSecret(req)) {
      return NextResponse.json({ error: 'Invalid Telegram webhook secret' }, { status: 401 });
    }

    const update = await req.json();
    
    let telegramId: number | null = null;
    let text = '';
    let username = '';
    let firstName = '';
    let lastName = '';
    let phone: string | null = null;

    if (update.message) {
      telegramId = update.message.chat.id;
      username = update.message.from?.username || '';
      firstName = update.message.from?.first_name || '';
      lastName = update.message.from?.last_name || '';
      
      // Attempt to extract and archive files in background
      waitUntil(extractAndArchiveFile(update.message));

      if (update.message.contact) {
        phone = update.message.contact.phone_number;
        text = '';
      } else if (update.message.voice) {
        text = '[Голосовое сообщение] Выполнена работа по задаче.';
      } else if (update.message.location) {
        text = `[Локация] ${update.message.location.latitude},${update.message.location.longitude}`;
      } else {
        text = update.message.text || update.message.caption || '';
      }
    } else if (update.callback_query) {
      telegramId = update.callback_query.message.chat.id;
      username = update.callback_query.from?.username || '';
      firstName = update.callback_query.from?.first_name || '';
      lastName = update.callback_query.from?.last_name || '';
      text = update.callback_query.data || '';

      // Immediately edit and remove inline buttons from the clicked message
      if (update.callback_query.message?.message_id && process.env.TELEGRAM_BOT_TOKEN) {
        const msgId = update.callback_query.message.message_id;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        waitUntil(
          fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramId,
              message_id: msgId,
              reply_markup: { inline_keyboard: [] }
            })
          }).catch(e => console.error('Failed to clear inline keyboard on callback:', e))
        );
      }
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
        waitUntil(db.createMockMessage(telegramId, 'user', groupText).catch(e => console.error('Failed to save group mock message:', e)));

        if (isLeaderMention(text)) {
          const answer = await generateLeaderKnowledgeAnswer(groupText);
          waitUntil(db.createMockMessage(telegramId, 'bot', answer.text).catch(e => console.error('Failed to save bot mock message:', e)));

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

    // Save message to simulator history as user input (in background)
    if (text || phone) {
      waitUntil(
        db.createMockMessage(
          telegramId,
          'user',
          phone ? `📱 [Поделился контактом: ${phone}]` : text
        ).catch(e => console.error('Failed to save user mock message:', e))
      );
    }

    // Process update through the state-machine
    const response = await handleBotUpdate(telegramId, text, username, phone, firstName, lastName);

    // Save bot response to simulator history (in background)
    waitUntil(
      db.createMockMessage(
        telegramId,
        'bot',
        response.text,
        response.keyboard
      ).catch(e => console.error('Failed to save bot mock message:', e))
    );

    // Format reply markup for Telegram
    let replyMarkup: any = undefined;
    if (response.keyboard) {
      const hasSpecialRequest = response.keyboard.some(row => row.some(btn => btn.request_contact || btn.request_location));
      if (hasSpecialRequest) {
        replyMarkup = {
          keyboard: response.keyboard.map(row => 
            row.map(btn => ({
              text: btn.text,
              request_contact: btn.request_contact,
              request_location: btn.request_location
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

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      waitUntil(
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: response.text,
            parse_mode: 'Markdown',
            reply_markup: replyMarkup
          })
        })
        .then(async res => {
          const data = await res.json();
          if (!data.ok) {
            console.error('Telegram API error:', data);
            // Fallback: Retry sending without Markdown parse_mode if parsing failed
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: telegramId,
                text: response.text,
                reply_markup: replyMarkup
              })
            });
          }
        })
        .catch(e => console.error('Failed to send Telegram message:', e))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

async function extractAndArchiveFile(msg: any) {
  if (!msg.document && !msg.photo && !msg.video && !msg.audio && !msg.voice) return;

  let fileId = '';
  let fileName = '';
  let fileType: 'image' | 'document' | 'audio' | 'video' = 'document';
  let fileSize = 0;

  if (msg.document) {
    fileId = msg.document.file_id;
    fileName = msg.document.file_name || 'document';
    fileType = 'document';
    fileSize = msg.document.file_size || 0;
  } else if (msg.photo && msg.photo.length > 0) {
    const photo = msg.photo[msg.photo.length - 1]; // highest resolution
    fileId = photo.file_id;
    fileName = `photo_${photo.file_unique_id}.jpg`;
    fileType = 'image';
    fileSize = photo.file_size || 0;
  } else if (msg.video) {
    fileId = msg.video.file_id;
    fileName = msg.video.file_name || 'video.mp4';
    fileType = 'video';
    fileSize = msg.video.file_size || 0;
  } else if (msg.audio) {
    fileId = msg.audio.file_id;
    fileName = msg.audio.file_name || 'audio.mp3';
    fileType = 'audio';
    fileSize = msg.audio.file_size || 0;
  } else if (msg.voice) {
    fileId = msg.voice.file_id;
    fileName = `voice_${msg.voice.file_unique_id}.ogg`;
    fileType = 'audio';
    fileSize = msg.voice.file_size || 0;
  }

  if (fileId) {
    try {
      const chatTitle = msg.chat?.title || (msg.chat?.type === 'private' ? 'Личные сообщения' : 'Telegram группа');
      const fileUrl = `/api/telegram/file?file_id=${fileId}&file_name=${encodeURIComponent(fileName)}`;

      await db.createArchiveItem({
        chat_title: chatTitle,
        file_name: fileName,
        file_type: fileType,
        file_size: Math.max(1, Math.round(fileSize / 1024)),
        file_url: fileUrl
      });

      const username = msg.from?.username || '';
      const firstName = msg.from?.first_name || '';
      const lastName = msg.from?.last_name || '';
      
      const typeStr = fileType === 'image' ? 'Фото' : fileType === 'video' ? 'Видео' : fileType === 'audio' ? 'Аудио' : 'Документ';
      const mockMsgText = `[Файл] В ${chatTitle} загружен новый файл: ${typeStr} "${fileName}" от ${firstName} ${lastName} (@${username}). Ссылка: ${fileUrl}`;
      
      await db.createMockMessage(msg.chat.id, 'user', mockMsgText);

    } catch (e) {
      console.error('Failed to archive file:', e);
    }
  }
}

export async function GET() {
  return new Response('Telegram Webhook route is active. Send POST requests.');
}
