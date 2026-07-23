import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function run() {
  const msgs = await prisma.mockMessage.findMany({
    where: {
      text: { contains: 'Отлично! Вы подтвердили участие!' }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log('Found confirmed participation msgs:', msgs.length);
  for (const m of msgs) {
    console.log(`TG ID: ${m.telegramId} | CreatedAt: ${m.createdAt} | Text: ${m.text.slice(0, 60)}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
