import { db } from '../src/lib/db';
import { sendTelegramMessage } from '../src/lib/telegram-api';

async function main() {
  console.log('Starting resend of access links to approved volunteers...');
  const users = await db.getUsers();
  const volunteers = users.filter(u => u.role === 'volunteer' && u.telegram_id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://volunteer-os-zeta.vercel.app';

  let sentCount = 0;
  for (const v of volunteers) {
    const autoLoginUrl = `${appUrl}/api/auth/auto-login?tg_id=${v.telegram_id}`;
    const directLoginUrl = `${appUrl}/login?role=volunteer`;
    const message = `👋 *Здравствуйте, ${v.full_name}!*

Мы обновили платформу волонтеров для удобного входа в 1 клик!

🚀 *Войти в кабинет в 1 клик (без пароля):*
${autoLoginUrl}

---
🌐 Сайт (ручной вход): ${directLoginUrl}
👤 Ваш логин: <code>${v.login || 'Не указан'}</code>

Приятной работы! ✨`;

    try {
      await sendTelegramMessage(Number(v.telegram_id), message, undefined, 'HTML');
      console.log(`Sent access link to ${v.full_name} (ID: ${v.telegram_id})`);
      sentCount++;
    } catch (e) {
      console.error(`Failed to send to ${v.full_name}:`, e);
    }
  }

  console.log(`Successfully sent access links to ${sentCount} volunteers.`);
}

main().catch(console.error);
