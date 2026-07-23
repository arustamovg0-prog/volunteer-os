import 'dotenv/config';
import { prisma } from '../src/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is missing in environment!');
  process.exit(1);
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function editMarkup(chatId: number, messageId: number): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] }
      })
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`[SUCCESS] Removed buttons for Telegram ID ${chatId} on message_id ${messageId}`);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function removeButtonsForUserFast(chatId: number) {
  // Check message IDs in parallel batches of 20 (from 1 to 500)
  const maxMsgId = 500;
  const batchSize = 20;
  let found = false;

  for (let start = maxMsgId; start >= 1; start -= batchSize) {
    const batch = [];
    for (let msgId = start; msgId > Math.max(0, start - batchSize); msgId--) {
      batch.push(editMarkup(chatId, msgId));
    }
    const results = await Promise.all(batch);
    if (results.some(r => r === true)) {
      found = true;
    }
    await sleep(40); // Respect Telegram API limits
  }

  return found;
}

async function run() {
  console.log('Starting FAST button removal process...');
  
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

  console.log(`Processing ${volunteers.length} volunteers in fast batches...`);

  let successCount = 0;
  const concurrency = 3; // 3 volunteers at a time

  for (let i = 0; i < volunteers.length; i += concurrency) {
    const chunk = volunteers.slice(i, i + concurrency);
    const promises = chunk.map(async (v) => {
      if (!v.telegramId) return false;
      return await removeButtonsForUserFast(Number(v.telegramId));
    });

    const results = await Promise.all(promises);
    successCount += results.filter(Boolean).length;
    console.log(`Processed ${Math.min(i + concurrency, volunteers.length)}/${volunteers.length} (Successful removals so far: ${successCount})`);
    await sleep(100);
  }

  console.log(`\n==============================================`);
  console.log(`FINISHED! Buttons successfully removed for ${successCount}/${volunteers.length} volunteers.`);
  console.log(`==============================================\n`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
