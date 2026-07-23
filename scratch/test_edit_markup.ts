import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function run() {
  const count = await prisma.mockMessage.count();
  console.log('Total mock_messages in DB:', count);

  const sampleMsgs = await prisma.mockMessage.findMany({
    where: { sender: 'bot' },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('Sample bot messages count:', sampleMsgs.length);
  if (sampleMsgs.length > 0) {
    console.log('Latest bot message text snippet:', sampleMsgs[0].text.slice(0, 100));
    console.log('Latest bot message keyboard:', sampleMsgs[0].keyboard);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
