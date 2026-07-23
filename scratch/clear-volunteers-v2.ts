import { prisma } from '../src/lib/db';

async function main() {
  await prisma.volunteerApplication.deleteMany({});
  await prisma.user.deleteMany({
    where: { role: 'VOLUNTEER' }
  });
  console.log('Successfully cleared all volunteers and applications!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
