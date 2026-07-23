import { prisma } from './db';
import { sendTelegramMessage } from './telegram-api';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

/**
 * Logs a message to the SystemLog table in the database.
 * If the level is 'ERROR', it attempts to notify the admin via Telegram.
 */
export async function logSystemEvent(
  level: LogLevel,
  message: string,
  details?: Record<string, any>,
  source: string = 'server'
) {
  try {
    // Extract section if passed inside details or fallback to source
    const section = details?.section || source || 'server';

    // 1. Save log to database
    await prisma.systemLog.create({
      data: {
        level,
        message,
        details: {
          ...details,
          section,
        },
        source,
      },
    });

    // 2. If it's an error, notify admin via Telegram
    if (level === 'ERROR') {
      try {
        const admins = await prisma.user.findMany({
          where: {
            role: 'admin',
            telegramId: {
              not: null,
            },
          },
        });

        const alertMessage = `🚨 *ОШИБКА НА ПЛАТФОРМЕ*\n\n📌 *Раздел:* ${section.toUpperCase()}\n💬 *Сообщение:* ${message}\n⚙️ *Источник:* ${source}\n\nПроверьте панель разработчика /dashboard/monitor`;

        for (const admin of admins) {
          if (admin.telegramId) {
            await sendTelegramMessage(Number(admin.telegramId), alertMessage);
          }
        }
      } catch (tgError) {
        console.error('Failed to send Telegram alert for error:', tgError);
      }
    }
  } catch (dbError) {
    console.error('CRITICAL: Failed to write system log to database:', dbError);
  }
}
