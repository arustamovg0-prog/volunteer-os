import { db } from '../src/lib/db';
import { sendTelegramMessage } from '../src/lib/telegram-api';

async function main() {
  console.log('Starting broadcast of Check-in & Check-out briefing to all volunteers...');

  const users = await db.getUsers();
  const volunteers = users.filter(u => u.role === 'volunteer' && u.telegram_id);

  console.log(`Targeting ${volunteers.length} volunteers with Telegram IDs.`);

  const messageText = `📌 *НАПОМИНАНИЕ И ИНСТРУКТАЖ: ЧЕК-ИН И ЧЕК-АУТ* 🩺

Уважаемые волонтёры! Чтобы ваши часы помощи и рейтинг зафиксировались на проекте, обязательно отмечайте приход и уход через бота!

📍 *1. ПРИХОД НА СМЕНУ (ЧЕК-ИН):*
• Нажмите кнопку *📋 Мои Задачи* в меню (или отправьте /tasks).
• Нажмите кнопку *📍 Начать смену*.
• Нажмите кнопку *📍 Отправить локацию* внизу экрана — бот сверит ваше присутствие на объекте!

🏁 *2. ЗАВЕРШЕНИЕ СМЕНЫ (ЧЕК-АУТ):*
• В конце работы снова нажмите *📋 Мои Задачи*.
• Нажмите кнопку *🏁 Завершить смену* и отправьте гео-локацию.
• Часы и рейтинг сразу зачислятся в ваш профиль!

───────────────────────────

📌 *ESLATMA VA YO'RIQNOMA: CHECK-IN VA CHECK-OUT* 🩺

Hurmatli volontyorlar! Ish soatlaringiz va reytingingiz hisoblanishi uchun smena boshida va oxirida bot orqali belgilanishni unutmang!

📍 *1. KELIShNI BELGILASh (CHECK-IN):*
• Botda *📋 Мои Задачи* tugmasini bosing (yoki /tasks yuboring).
• *📍 Начать смену* tugmasini bosing.
• Pastdagi *📍 Отправить локацию* tugmasini bosib joylashuvingizni yuboring.

🏁 *2. SMENANI YAKUNLASH (CHECK-OUT):*
• Smena tugagach, *📋 Мои Задачи* -> *🏁 Завершить смену* tugmasini bosing.

Rahmat! Barchaga omadli va unumli smena tilaymiz! ❤️✨`;

  const keyboard = [
    [{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }],
    [{ text: '👤 Мой Профиль', callback_data: 'cmd_profile' }]
  ];

  let successCount = 0;
  for (const v of volunteers) {
    try {
      const ok = await sendTelegramMessage(Number(v.telegram_id), messageText, keyboard, 'Markdown');
      if (ok) successCount++;
      // Delay 50ms to avoid Telegram rate limits
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      console.error(`Failed to send to ${v.full_name} (${v.telegram_id}):`, e);
    }
  }

  console.log(`Broadcast finished. Successfully delivered to ${successCount} / ${volunteers.length} volunteers.`);
}

main().catch(console.error);
