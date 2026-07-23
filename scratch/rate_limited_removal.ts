import 'dotenv/config';
import { prisma } from '../src/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function editMarkupForUser(tgId: number) {
  // Test recent message IDs (e.g. from 1 to 50) sequentially with retry logic
  for (let msgId = 50; msgId >= 1; msgId--) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgId,
          message_id: msgId,
          reply_markup: { inline_keyboard: [] }
        })
      });

      const data = await res.json();

      if (data.ok) {
        console.log(`✅ SUCCESS: Removed buttons for user ${tgId} on message_id ${msgId}`);
        return true;
      }

      if (res.status === 429 || (data.parameters && data.parameters.retry_after)) {
        const waitSec = data.parameters?.retry_after || 3;
        console.log(`[Rate Limited] Waiting ${waitSec}s...`);
        await sleep((waitSec + 1) * 1000);
        msgId++; // retry same msgId
        continue;
      }

      if (data.description && data.description.includes('message is not modified')) {
        console.log(`ℹ️ Already modified for user ${tgId} on message_id ${msgId}`);
        return true;
      }

      // Small delay between requests to stay under rate limit (10 req/sec)
      await sleep(100);
    } catch (e) {
      console.error(`Error checking tgId ${tgId} msg ${msgId}:`, e);
      await sleep(200);
    }
  }
  return false;
}

async function run() {
  console.log('Testing rate-limited removal on recent RSVP users...');
  
  // Find users who received RSVP broadcast in mock_messages
  const rsvpMsgs = await prisma.mockMessage.findMany({
    where: {
      sender: 'bot',
      OR: [
        { text: { contains: 'Salomatlik' } },
        { text: { contains: 'qurultoyi' } },
        { text: { contains: 'слёта волонтёров' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 300
  });

  const tgIds = Array.from(new Set(rsvpMsgs.map(m => Number(m.telegramId))));
  console.log(`Found ${tgIds.length} target telegramIds in mock_messages.`);

  let successCount = 0;
  for (let i = 0; i < tgIds.length; i++) {
    const tgId = tgIds[i];
    console.log(`[${i + 1}/${tgIds.length}] Processing user TG ID ${tgId}...`);
    const ok = await editMarkupForUser(tgId);
    if (ok) successCount++;
    await sleep(200);
  }

  console.log(`\nDONE! Successfully removed buttons for ${successCount}/${tgIds.length} users.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
