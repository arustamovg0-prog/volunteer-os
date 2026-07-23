const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.volunteerApplication.deleteMany({});
  await prisma.user.deleteMany({
    where: { role: 'volunteer' }
  });
  console.log('Volunteers and applications cleared.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
