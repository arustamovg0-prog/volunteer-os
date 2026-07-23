const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result1 = await prisma.telegramMockMessage.deleteMany({});
  console.log('Deleted TelegramMockMessages:', result1.count);
  const result2 = await prisma.chatMessage.deleteMany({});
  console.log('Deleted ChatMessages:', result2.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
