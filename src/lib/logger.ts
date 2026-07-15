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
  source: 'client' | 'server' | 'cron' = 'server'
) {
  try {
    // 1. Save log to database
    await prisma.systemLog.create({
      data: {
        level,
        message,
        details: details || {},
        source,
      },
    });

    // 2. If it's an error, notify admin via Telegram
    if (level === 'ERROR') {
      try {
        // Find admin users with a linked Telegram ID
        const admins = await prisma.user.findMany({
          where: {
            role: 'admin',
            telegramId: {
              not: null,
            },
          },
        });

        const alertMessage = `🚨 *КРИТИЧЕСКАЯ ОШИБКА*\n\n*Сообщение:* ${message}\n*Источник:* ${source}\n\nПожалуйста, проверьте панель мониторинга!`;

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
    // Fallback if DB is down
    console.error('CRITICAL: Failed to write system log to database:', dbError);
  }
}
