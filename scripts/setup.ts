import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { DEFAULT_PLANS } from '../lib/plans';

async function main() {
  const adminExists = await prisma.user.findFirst({
    where: { role: 'SAAS_ADMIN' }
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin2024', 10);
    await prisma.user.create({
      data: {
        email: 'superadmin@nextflowbarber.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SAAS_ADMIN'
      }
    });
    console.log('Super admin created');
  }

  const plansCount = await prisma.plan.count();
  if (plansCount === 0) {
    for (const plan of DEFAULT_PLANS) {
      await prisma.plan.create({
        data: {
          name: plan.name,
          price: plan.price,
          interval: plan.interval,
          features: JSON.stringify(plan.features),
          maxAppointments: plan.maxAppointments,
          isPopular: plan.isPopular || false
        }
      });
    }
    console.log('Default plans created');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
