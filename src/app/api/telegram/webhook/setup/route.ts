import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePrivilegedRequest } from '@/lib/security';

// Retrieve webhook info from Telegram
export async function GET(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin']);
    if (authError) return authError;

    const config = await db.getBotConfig();
    const token = config.bot_token || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return NextResponse.json({ 
        status: 'not_configured', 
        message: 'Токен Telegram-бота не настроен ни в БД, ни в переменных окружения' 
      });
    }

    const tgUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;
    const res = await fetch(tgUrl);
    
    if (!res.ok) {
      return NextResponse.json({ 
        status: 'error', 
        message: `Ошибка Telegram API: ${res.status} ${res.statusText}` 
      }, { status: 400 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get webhook info:', error);
    return NextResponse.json({ error: 'Failed to fetch webhook info' }, { status: 500 });
  }
}

// Setup or delete Telegram webhook
export async function POST(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin']);
    if (authError) return authError;

    const body = await req.json();
    const { action } = body; // 'connect' or 'disconnect'

    if (!action || !['connect', 'disconnect'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "connect" or "disconnect"' }, { status: 400 });
    }

    const config = await db.getBotConfig();
    const token = config.bot_token || process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      return NextResponse.json({ error: 'Telegram Bot Token is not configured' }, { status: 400 });
    }

    if (action === 'connect') {
      const webhookUrl = config.webhook_url;
      if (!webhookUrl) {
        return NextResponse.json({ error: 'Webhook URL is not configured' }, { status: 400 });
      }

      // Ensure webhook URL points to the webhook route endpoint
      const fullWebhookUrl = webhookUrl.endsWith('/') 
        ? `${webhookUrl}api/telegram/webhook` 
        : `${webhookUrl}/api/telegram/webhook`;

      const tgUrl = `https://api.telegram.org/bot${token}/setWebhook`;
      const webhookBody: Record<string, string> = { url: fullWebhookUrl };
      if (process.env.TELEGRAM_WEBHOOK_SECRET) {
        webhookBody.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
      }
      const res = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookBody),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        return NextResponse.json({ 
          error: data.description || 'Failed to connect webhook via Telegram API' 
        }, { status: 400 });
      }

      return NextResponse.json({ 
        ok: true, 
        message: 'Webhook успешно подключен к Telegram!',
        details: data 
      });
    } else {
      // Disconnect
      const tgUrl = `https://api.telegram.org/bot${token}/deleteWebhook`;
      const res = await fetch(tgUrl);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        return NextResponse.json({ 
          error: data.description || 'Failed to delete webhook via Telegram API' 
        }, { status: 400 });
      }

      return NextResponse.json({ 
        ok: true, 
        message: 'Webhook успешно отключен от Telegram!',
        details: data 
      });
    }
  } catch (error) {
    console.error('Failed to setup webhook:', error);
    return NextResponse.json({ error: 'Failed to execute webhook action' }, { status: 500 });
  }
}
