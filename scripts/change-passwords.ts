import { prisma } from '../src/lib/db';
import { hashPassword } from '../src/lib/security';

async function main() {
  console.log('Changing passwords for initial users...');

  const adminLogin = 'admin';
  const newAdminPassword = 'VolunteerOS_Admin_2026!';
  const adminHashed = hashPassword(newAdminPassword);

  await prisma.user.update({
    where: { login: adminLogin },
    data: { passwordHash: adminHashed }
  });
  console.log(`Password updated for ${adminLogin}`);

  const coordLogin = 'alexey';
  const newCoordPassword = 'VolunteerOS_Coord_2026!';
  const coordHashed = hashPassword(newCoordPassword);

  await prisma.user.update({
    where: { login: coordLogin },
    data: { passwordHash: coordHashed }
  });
  console.log(`Password updated for ${coordLogin}`);

  console.log('Password update complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
