import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function run() {
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
    take: 50
  });

  console.log('Found RSVP broadcast mock_messages:', rsvpMsgs.length);
  if (rsvpMsgs.length > 0) {
    const sample = rsvpMsgs[0];
    console.log('Sample text snippet:', sample.text.slice(0, 100));
    console.log('Sample keyboard:', sample.keyboard);
    console.log('Sample telegramId:', sample.telegramId.toString());
  }

  // Get distinct telegramIds from these messages
  const telegramIds = Array.from(new Set(rsvpMsgs.map(m => m.telegramId.toString())));
  console.log('Unique telegramIds in found messages:', telegramIds.length);
}

run().catch(console.error).finally(() => prisma.$disconnect());
