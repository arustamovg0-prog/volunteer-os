import { prisma } from '../src/lib/db';
import { hashPassword } from '../src/lib/security';

async function main() {
  console.log('Seeding Neon database...');
  
  const adminPassword = hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      id: 'u_admin_001',
      role: 'admin',
      fullName: 'Руководитель Ширин',
      login: 'admin',
      passwordHash: adminPassword,
      phone: '+79990001122',
      rating: 5.0,
      xp: 10000,
      level: 99,
      availabilityStatus: 'available'
    }
  });
  console.log('Created admin:', admin.login);

  const coordPassword = hashPassword('coord123');
  const coord1 = await prisma.user.upsert({
    where: { login: 'alexey' },
    update: {},
    create: {
      id: 'u_coord_001',
      role: 'coordinator',
      fullName: 'Алексей (Координатор экологии)',
      login: 'alexey',
      passwordHash: coordPassword,
      phone: '+79991112233',
      rating: 4.8,
      xp: 5000,
      level: 10,
      availabilityStatus: 'available'
    }
  });
  console.log('Created coordinator:', coord1.login);

  const project = await prisma.project.upsert({
    where: { id: 'p_event_001' },
    update: {},
    create: {
      id: 'p_event_001',
      title: 'Большое Мероприятие (100+ участников)',
      description: 'Тестовый проект для основного ивента.',
      status: 'active'
    }
  });
  console.log('Created project:', project.title);

  await prisma.task.upsert({
    where: { id: 't_test_001' },
    update: {},
    create: {
      id: 't_test_001',
      projectId: project.id,
      title: 'Организовать регистрацию на входе',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      status: 'pending',
      isOverdue: false
    }
  });
  console.log('Created task.');
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
