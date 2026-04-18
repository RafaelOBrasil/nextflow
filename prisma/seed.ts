import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_PLANS } from '../lib/plans';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const hashedPassword = await bcrypt.hash('admin2026', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'adm@superadmin.com' },
    update: {
      password: hashedPassword,
      role: 'SAAS_ADMIN'
    },
    create: {
      email: 'adm@superadmin.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SAAS_ADMIN'
    }
  });
  
  console.log(`Ensured super admin exists: ${admin.email}`);

  // Check if plans exist
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
      console.log(`Created plan: ${plan.name}`);
    }
  } else {
    console.log('Plans already exist.');
  }

  // Create mock shop for testing
  const mockShopId = 'shop-123';
  const basicPlan = await prisma.plan.findFirst({ where: { name: 'Plano Básico' } });
  
  if (basicPlan) {
    const shop = await prisma.barberShop.upsert({
      where: { id: mockShopId },
      update: {},
      create: {
        id: mockShopId,
        name: 'Barbearia Teste',
        slug: 'barbearia-teste',
        description: 'Uma barbearia de teste para o sistema.',
        address: 'Rua de Teste, 123',
        phone: '11999999999',
        planId: basicPlan.id,
      }
    });
    console.log(`Ensured mock shop exists: ${shop.name}`);

    // Create subscription for the shop
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    await prisma.subscription.upsert({
      where: { id: 'sub-mock-123' },
      update: {
        currentPeriodEnd: thirtyDaysFromNow,
        status: 'active',
      },
      create: {
        id: 'sub-mock-123',
        shopId: mockShopId,
        planId: basicPlan.id,
        currentPeriodEnd: thirtyDaysFromNow,
        status: 'active',
      }
    });
    console.log('Ensured mock subscription exists');
    
    // Create some mock appointments to test limits
    const appointmentsCount = await prisma.appointment.count({ where: { shopId: mockShopId } });
    if (appointmentsCount === 0) {
      // Create a service and barber first
      const service = await prisma.service.create({
        data: {
          id: 'service-id',
          name: 'Corte Simples',
          price: 30,
          duration: 30,
          shopId: mockShopId,
        }
      });
      const barber = await prisma.barber.create({
        data: {
          id: 'barber-id',
          name: 'João Barbeiro',
          role: 'Master',
          shopId: mockShopId,
        }
      });

      // Create 39 appointments (limit is 40)
      for (let i = 0; i < 39; i++) {
        await prisma.appointment.create({
          data: {
            customerName: `Cliente ${i}`,
            customerPhone: '11999999999',
            date: '2026-03-14',
            time: '10:00',
            serviceId: service.id,
            barberId: barber.id,
            shopId: mockShopId,
          }
        });
      }
      console.log('Created 39 mock appointments for testing limits');
    }

    // Create an expired shop for testing
    const expiredShopId = 'shop-expired';
    const expiredShop = await prisma.barberShop.upsert({
      where: { id: expiredShopId },
      update: {},
      create: {
        id: expiredShopId,
        name: 'Barbearia Expirada',
        slug: 'barbearia-expirada',
        description: 'Uma barbearia com plano expirado.',
        address: 'Rua de Teste, 456',
        phone: '11888888888',
        planId: basicPlan.id,
      }
    });
    console.log(`Ensured expired shop exists: ${expiredShop.name}`);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.subscription.upsert({
      where: { id: 'sub-expired-123' },
      update: {
        currentPeriodEnd: yesterday,
        status: 'active',
      },
      create: {
        id: 'sub-expired-123',
        shopId: expiredShopId,
        planId: basicPlan.id,
        currentPeriodEnd: yesterday,
        status: 'active',
      }
    });
    console.log('Ensured expired subscription exists');
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
