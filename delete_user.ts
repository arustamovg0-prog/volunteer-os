import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      login: 'VOL_128752'
    }
  });

  if (user) {
    await prisma.user.delete({
      where: { id: user.id }
    });
    console.log(`User ${user.login} (${user.fullName}) deleted successfully.`);
  } else {
    console.log('User not found.');
  }
}

main().catch(console.error).finally(() => process.exit(0));
