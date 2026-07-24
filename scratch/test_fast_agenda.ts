import { prisma } from '../src/lib/db';

async function main() {
  console.log('=== FAST AGENDA TEST ===');
  const now = Date.now();
  const days = 7;
  const minTime = new Date(now - days * 24 * 60 * 60 * 1000);

  const messages = await prisma.chatMessage.findMany({
    where: {
      createdAt: { gte: minTime }
    },
    include: {
      chat: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${messages.length} chat messages in the last 7 days!`);
  if (messages.length > 0) {
    console.log('Sample 3 messages:');
    messages.slice(0, 3).forEach(m => {
      console.log(`- Chat: "${m.chat?.title}", Author: "${m.senderName}", Text: "${m.text.slice(0, 50)}"`);
    });
  }
}

main().catch(console.error);
