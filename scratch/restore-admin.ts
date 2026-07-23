import { prisma } from '../src/lib/db';
import { hashPassword } from '../src/lib/security';

async function main() {
  const adminPassword = hashPassword('admin');
  
  await prisma.user.upsert({
    where: { login: 'admin' },
    update: {
      passwordHash: adminPassword,
      role: 'admin',
      fullName: 'Admin System',
    },
    create: {
      login: 'admin',
      passwordHash: adminPassword,
      role: 'admin',
      fullName: 'Admin System',
      phone: '+998900000000'
    }
  });
  
  console.log('Admin user restored.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
