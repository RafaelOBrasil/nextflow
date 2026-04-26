import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456789', 10);
  const user = await prisma.user.upsert({
    where: { email: 'superadmin@nextflowbarber.com' },
    update: {},
    create: {
      email: 'superadmin@nextflowbarber.com',
      password: password,
      name: 'Super Admin',
      role: 'SAAS_ADMIN',
    },
  });
  console.log('User created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
