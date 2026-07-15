import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing old data...');
  await prisma.checkIn.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.volunteerOrganization.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');
  const admin = await prisma.user.create({
    data: {
      role: 'admin',
      fullName: 'John Admin',
      login: 'admin',
      passwordHash: 'hashed_password', // mock
      phone: '+998901234567',
      rating: 5.0,
      xp: 1500,
      level: 5,
      availabilityStatus: 'online'
    }
  });

  const manager = await prisma.user.create({
    data: {
      role: 'manager',
      fullName: 'Sarah Coordinator',
      login: 'manager',
      passwordHash: 'hashed_password',
      phone: '+998901234568',
      rating: 4.8,
      xp: 1200,
      level: 4,
      availabilityStatus: 'online'
    }
  });

  const vol1 = await prisma.user.create({
    data: {
      role: 'volunteer',
      fullName: 'Alex Volunteer',
      login: 'alex',
      phone: '+998901111111',
      rating: 4.5,
      xp: 500,
      level: 2,
      availabilityStatus: 'online'
    }
  });

  const vol2 = await prisma.user.create({
    data: {
      role: 'volunteer',
      fullName: 'Maria Helper',
      login: 'maria',
      phone: '+998902222222',
      rating: 4.9,
      xp: 850,
      level: 3,
      availabilityStatus: 'offline'
    }
  });

  console.log('Seeding Organizations...');
  const org1 = await prisma.volunteerOrganization.create({
    data: {
      name: 'Eco Warriors',
      description: 'Environmental protection organization',
      category: 'Ecology',
      contacts: 'eco@example.com'
    }
  });

  const org2 = await prisma.volunteerOrganization.create({
    data: {
      name: 'City Care',
      description: 'Helping homeless people in the city',
      category: 'Social',
      contacts: 'care@example.com'
    }
  });

  console.log('Seeding Projects...');
  const proj1 = await prisma.project.create({
    data: {
      title: 'Park Cleanup 2026',
      description: 'Annual city park cleanup event',
      status: 'active',
      orgId: org1.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  });

  const proj2 = await prisma.project.create({
    data: {
      title: 'Food Drive',
      description: 'Collecting and distributing food',
      status: 'active',
      orgId: org2.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    }
  });

  console.log('Seeding Tasks...');
  await prisma.task.createMany({
    data: [
      {
        projectId: proj1.id,
        title: 'Gather equipment',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'pending',
        assignedTo: vol1.id
      },
      {
        projectId: proj1.id,
        title: 'Coordinate volunteers',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'accepted',
        assignedTo: manager.id
      },
      {
        projectId: proj2.id,
        title: 'Pack food boxes',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'completed',
        assignedTo: vol2.id
      }
    ]
  });

  console.log('Seeding Check-ins...');
  await prisma.checkIn.createMany({
    data: [
      {
        userId: vol1.id,
        projectId: proj1.id,
        textReport: 'Spent 2 hours gathering garbage bags and gloves.',
        hours: 2,
        kpiScore: 10,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        userId: vol2.id,
        projectId: proj2.id,
        textReport: 'Packed 50 food boxes. Everything went smoothly.',
        hours: 4,
        kpiScore: 15,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        userId: vol1.id,
        projectId: proj1.id,
        textReport: 'Helped coordinate the morning shift.',
        hours: 3.5,
        kpiScore: 12,
        createdAt: new Date()
      }
    ]
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
