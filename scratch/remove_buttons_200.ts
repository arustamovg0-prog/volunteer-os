import 'dotenv/config';
import { prisma, db } from '../src/lib/db';

async function run() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  console.log('Bot token present:', !!token);

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

  console.log(`Found ${volunteers.length} volunteers with telegramId.`);
  if (volunteers.length > 0) {
    console.log('Sample volunteer telegramIds:', volunteers.slice(0, 5).map(v => v.telegramId?.toString()));
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
