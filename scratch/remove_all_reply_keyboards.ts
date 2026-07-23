import 'dotenv/config';
import { prisma } from '../src/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is missing!');
  process.exit(1);
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function sendRemoveKeyboard(tgId: number): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: tgId,
        text: 'Iltimos, ushbu botdagi xabarlarni kuzatib boring. Har bir blok bo‘yicha sizga alohida ma’lumot yuboriladi.\n\nПожалуйста, следите за сообщениями в данном боте. Мы будем направлять отдельную информацию по каждому блоку.',
        reply_markup: {
          remove_keyboard: true
        }
      })
    });

    const data = await res.json();
    if (data.ok) {
      return true;
    }

    if (res.status === 429 || (data.parameters && data.parameters.retry_after)) {
      const waitSec = data.parameters?.retry_after || 3;
      console.log(`[Rate Limit for ${tgId}] Sleeping ${waitSec}s...`);
      await sleep((waitSec + 1) * 1000);
      return await sendRemoveKeyboard(tgId);
    }

    console.error(`Failed for ${tgId}:`, data.description);
    return false;
  } catch (e) {
    console.error(`Network error for ${tgId}:`, e);
    return false;
  }
}

async function run() {
  console.log('Broadcasting remove_keyboard to all volunteers...');

  const volunteers = await prisma.user.findMany({
    where: {
      role: 'volunteer',
      telegramId: { not: null }
    },
    select: {
      id: true,
      telegramId: true,
      fullName: true
    }
  });

  console.log(`Targeting ${volunteers.length} volunteers with Telegram IDs...`);

  let successCount = 0;
  for (let i = 0; i < volunteers.length; i++) {
    const v = volunteers[i];
    if (!v.telegramId) continue;

    const ok = await sendRemoveKeyboard(Number(v.telegramId));
    if (ok) {
      successCount++;
    }

    if ((i + 1) % 20 === 0 || i === volunteers.length - 1) {
      console.log(`Progress: ${i + 1}/${volunteers.length} sent (Success: ${successCount})`);
    }

    // 40ms delay = 25 requests per second (Telegram safe limit)
    await sleep(40);
  }

  console.log(`\n==================================================`);
  console.log(`COMPLETED! Successfully removed keyboard for ${successCount}/${volunteers.length} volunteers.`);
  console.log(`==================================================\n`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
