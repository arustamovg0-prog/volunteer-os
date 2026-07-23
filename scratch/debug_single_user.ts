import 'dotenv/config';
import { prisma } from '../src/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function run() {
  // Find recent mock messages to get active telegramIds and message details
  const msgs = await prisma.mockMessage.findMany({
    where: { sender: 'bot' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  for (const msg of msgs) {
    const tgId = Number(msg.telegramId);
    console.log(`\nTesting user ${tgId}:`);

    // Let's test calling sendMessage without keyboard or calling editMessageReplyMarkup
    // Wait, let's test msgId from 1 to 500
    for (let msgId = 1; msgId <= 50; msgId++) {
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
        console.log(`>>> SUCCESS! Removed buttons for chat ${tgId} on message_id ${msgId}`);
      } else if (!data.description.includes('message to edit not found')) {
        console.log(`Chat ${tgId} msg ${msgId} response:`, data.description);
      }
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
