import { prisma } from '../src/lib/db';

async function main() {
  await prisma.user.deleteMany({});
  await prisma.telegramSession.deleteMany({});
  console.log('Database cleared of users and sessions.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
