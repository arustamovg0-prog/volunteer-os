import 'dotenv/config';
import { prisma } from '../src/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is missing in environment!');
  process.exit(1);
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function removeButtonsForUser(telegramId: number) {
  // Try recent message_ids (e.g. from 200 down to 1)
  // Most chats have message_id between 1 and 100
  for (let msgId = 150; msgId >= 1; msgId--) {
    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          message_id: msgId,
          reply_markup: { inline_keyboard: [] }
        })
      });

      const data = await res.json();
      if (data.ok) {
        console.log(`[SUCCESS] Removed buttons for Telegram ID ${telegramId} on message_id ${msgId}`);
        return true;
      }
      
      // If error is "message is not modified" or similar (meaning keyboard already removed or not present), check details
      if (data.description && data.description.includes('message is not modified')) {
        console.log(`[INFO] Keyboard already removed or not modified for ${telegramId} on message_id ${msgId}`);
        return true;
      }

      // Small delay between attempts for a single user
      await sleep(25);
    } catch (e) {
      console.error(`Error for user ${telegramId} msg ${msgId}:`, e);
    }
  }
  return false;
}

async function run() {
  console.log('Starting button removal process...');
  
  // Get all volunteers with telegramId
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

  console.log(`Processing ${volunteers.length} volunteers...`);

  let successCount = 0;
  for (let i = 0; i < volunteers.length; i++) {
    const v = volunteers[i];
    if (!v.telegramId) continue;
    
    console.log(`[${i + 1}/${volunteers.length}] Processing volunteer: ${v.fullName || v.telegramId.toString()} (TG ID: ${v.telegramId})`);
    const ok = await removeButtonsForUser(Number(v.telegramId));
    if (ok) successCount++;

    // Pause slightly between users
    await sleep(50);
  }

  console.log(`Finished! Successfully removed buttons for ${successCount}/${volunteers.length} volunteers.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
