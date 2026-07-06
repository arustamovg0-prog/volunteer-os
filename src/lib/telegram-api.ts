import { db } from './db';

export interface TelegramButton {
  text: string;
  callback_data?: string;
  request_contact?: boolean;
}

/**
 * Sends a message to a Telegram user.
 * If the bot token is not available, it logs the message to the DB for simulator display.
 */
export async function sendTelegramMessage(
  telegramId: number,
  text: string,
  keyboard?: TelegramButton[][]
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

  // 1. Log to DB so simulator can display it
  try {
    await db.createMockMessage(telegramId, 'bot', text, keyboard);
  } catch (e) {
    console.error('Failed to log mock message:', e);
  }

  // 2. Send real telegram message if token exists
  if (token && token !== 'MOCK_BOT_TOKEN' && token !== '') {
    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const body = {
        chat_id: telegramId,
        text,
        parse_mode: 'Markdown',
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
    } catch (error) {
      console.error('Network error sending to Telegram:', error);
      return false;
    }
  }

  console.log(`[Mock Bot Notification] Sent to TG ID ${telegramId}: "${text}"`);
  return true;
}
