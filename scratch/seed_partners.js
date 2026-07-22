const { PrismaClient } = require('@prisma/client');

// Using basic setup since src/lib/prisma might use neon edge config
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  const partner1 = await prisma.partner.create({
    data: {
      name: 'Университет Инха в Ташкенте',
      category: 'partner',
      anniversaryDate: '2014-10-02',
      contactPerson: 'Музаффар Джалалов (Ректор)',
      email: 'info@inha.uz',
      phone: '+998712899999',
      autoGreetEnabled: true,
      activities: {
        create: [
          {
            eventName: 'Хакатон "Tech for Good"',
            description: 'Предоставление площадки для проведения хакатона.',
            date: new Date('2025-05-15')
          },
          {
            eventName: 'Волонтерский тренинг',
            description: 'Организация серии лекций по цифровому волонтерству.',
            date: new Date('2025-08-20')
          }
        ]
      }
    }
  });

  const sponsor1 = await prisma.partner.create({
    data: {
      name: 'Корзинка',
      category: 'sponsor',
      anniversaryDate: '1996-12-01',
      contactPerson: 'Зафар Хашимов',
      email: 'info@korzinka.uz',
      phone: '+998781401414',
      autoGreetEnabled: true,
      activities: {
        create: [
          {
            eventName: 'Благотворительная ярмарка',
            description: 'Спонсорская помощь в виде продуктовых наборов для 100 семей.',
            date: new Date('2025-11-20')
          }
        ]
      }
    }
  });

  console.log('Partners and activities seeded successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
