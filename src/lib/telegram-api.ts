import { db } from './db';

export interface TelegramButton {
  text: string;
  callback_data?: string;
  request_contact?: boolean;
}

export interface TelegramAttachment {
  buffer: Buffer | ArrayBuffer;
  fileName: string;
  fileType: string;
}

/**
 * Sends a message to a Telegram user with optional file attachment.
 * If the bot token is not available, it logs the message to the DB for simulator display.
 */
export async function sendTelegramMessage(
  telegramId: number,
  text: string,
  keyboard?: TelegramButton[][],
  parseMode: 'Markdown' | 'HTML' = 'Markdown',
  attachment?: TelegramAttachment
): Promise<boolean> {
  const config = await db.getBotConfig();
  const token = config.bot_token || process.env.TELEGRAM_BOT_TOKEN;
  
  // Format reply markup for Telegram
  let replyMarkup: any = undefined;
  if (keyboard) {
    // If it's a contact request button, Telegram needs keyboard, else inline_keyboard
    const hasContactRequest = keyboard.some(row => row.some(btn => btn.request_contact));
    
    if (hasContactRequest) {
      replyMarkup = {
        keyboard: keyboard.map(row => 
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
        inline_keyboard: keyboard.map(row => 
          row.map(btn => ({
            text: btn.text,
            callback_data: btn.callback_data
          }))
        )
      };
    }
  }

  // 1. Format message text for logging & simulator if attachment is present
  const logText = attachment
    ? `📎 [Файл: ${attachment.fileName}]\n\n${text}`
    : text;

  try {
    await db.createMockMessage(telegramId, 'bot', logText, keyboard);
  } catch (e) {
    console.error('Failed to log mock message:', e);
  }

  // 2. Send real telegram message if token exists
  if (token && token !== 'MOCK_BOT_TOKEN' && token !== '') {
    try {
      if (attachment) {
        // Send file with caption to Telegram using FormData
        const formData = new FormData();
        formData.append('chat_id', telegramId.toString());
        formData.append('caption', text);
        formData.append('parse_mode', parseMode);
        if (replyMarkup) {
          formData.append('reply_markup', JSON.stringify(replyMarkup));
        }

        const fileBlob = new Blob([new Uint8Array(attachment.buffer)], { type: attachment.fileType || 'application/octet-stream' });
        
        let method = 'sendDocument';
        let fieldName = 'document';

        if (attachment.fileType.startsWith('image/')) {
          method = 'sendPhoto';
          fieldName = 'photo';
        } else if (attachment.fileType.startsWith('video/')) {
          method = 'sendVideo';
          fieldName = 'video';
        }

        formData.append(fieldName, fileBlob, attachment.fileName);

        const url = `https://api.telegram.org/bot${token}/${method}`;
        const res = await fetch(url, {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          // If sendPhoto or sendVideo fails (e.g. invalid format), fallback to sendDocument
          if (method !== 'sendDocument') {
            const fallbackFormData = new FormData();
            fallbackFormData.append('chat_id', telegramId.toString());
            fallbackFormData.append('caption', text);
            fallbackFormData.append('parse_mode', parseMode);
            if (replyMarkup) {
              fallbackFormData.append('reply_markup', JSON.stringify(replyMarkup));
            }
            fallbackFormData.append('document', fileBlob, attachment.fileName);
            
            const fallbackRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
              method: 'POST',
              body: fallbackFormData
            });
            if (!fallbackRes.ok) {
              console.error(`Telegram API fallback error: ${fallbackRes.status} ${fallbackRes.statusText}`, await fallbackRes.text());
              return false;
            }
            return true;
          }

          console.error(`Telegram API error: ${res.status} ${res.statusText}`, await res.text());
          return false;
        }
        return true;
      } else {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const body = {
          chat_id: telegramId,
          text,
          parse_mode: parseMode,
          reply_markup: replyMarkup
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          console.error(`Telegram API error: ${res.status} ${res.statusText}`, await res.text());
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Network error sending to Telegram:', error);
      return false;
    }
  }

  console.log(`[Mock Bot Notification] Sent to TG ID ${telegramId}: "${logText}"`);
  return true;
}
