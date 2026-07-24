import { db } from '../src/lib/db';
import { sendTelegramMessage } from '../src/lib/telegram-api';

async function main() {
  console.log('Starting broadcast of Multi-Project Check-in logic to all volunteers...');

  const users = await db.getUsers();
  const volunteers = users.filter(u => u.role === 'volunteer' && u.telegram_id);

  console.log(`Targeting ${volunteers.length} volunteers with Telegram IDs.`);

  const messageText = `💡 *ВАЖНОЕ ПРАВИЛО: ЧЕК-ИН ПРИ УЧАСТИИ В НЕСКОЛЬКИХ ПРОЕКТАХ* 🩺

Дорогие волонтёры! Если вы участвуете в нескольких проектах или акциях, пожалуйста, обратите внимание на порядок учёта смен:

📌 *1. Отдельный Чек-ин для каждого проекта:*
Каждая смена и отработанные часы привязываются к конкретному проекту. Поэтому для каждого проекта нужно делать *📍 Начать смену* и *🏁 Завершить смену* отдельно.

📌 *2. Как правильно отмечаться:*
• Если у вас смены на разных проектах — завершите смену на первом проекте (*🏁 Завершить смену*), перед тем как начать смену на втором (*📍 Начать смену*).
• Если вы помогаете на одном большом общем мероприятии — достаточно сделать *1 Чек-ин* при приходе и *1 Чек-аут* в конце дня.

Так ваши часы и рейтинг зачислятся без ошибок! ❤️

───────────────────────────

💡 *MUHIM QO'IDA: BIR NECHTA LOYIHADA CHECK-IN QILISH* 🩺

Aziz volontyorlar! Agar siz bir nechta loyihada qatnashayotgan bo'lsangiz, smenani belgilash tartibiga e'tibor bering:

📌 *1. Har bir loyiha uchun alohida Check-in:*
Har bir smena va ishlangan soatlar muayyan loyihaga biriktiriladi. Shuning uchun, har bir loyiha uchun alohida *📍 Начать смену* va *🏁 Завершить смену* tugmalarini bosing.

📌 *2. Qanday to'g mebelgilanish kerak:*
• Birinchi loyihadagi smenani tugatib (*🏁 Завершить смену*), keyin ikkinchi loyihada smenani boshlang (*📍 Начать смену*).
• Agar bitta katta tadbirda bo'lsangiz — kun boshida *1 marta Check-in* va kun oxirida *1 marta Check-out* qilish kifoya.

Rahmat! Barchaga omadli smena tilaymiz! ❤️✨`;

  const keyboard = [
    [{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }],
    [{ text: '👤 Мой Профиль', callback_data: 'cmd_profile' }]
  ];

  let successCount = 0;
  for (const v of volunteers) {
    try {
      const ok = await sendTelegramMessage(Number(v.telegram_id), messageText, keyboard, 'Markdown');
      if (ok) successCount++;
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      console.error(`Failed to send to ${v.full_name} (${v.telegram_id}):`, e);
    }
  }

  console.log(`Broadcast finished. Successfully delivered to ${successCount} / ${volunteers.length} volunteers.`);
}

main().catch(console.error);
