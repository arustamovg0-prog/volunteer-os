import { prisma } from '../src/lib/db';

async function main() {
  const msgs = await prisma.mockMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(msgs, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
