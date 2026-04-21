import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'SAAS_ADMIN' } });
    if (!admin) {
      console.log('No admin');
      return;
    }
    
    // create a fake shop
    const shop = await prisma.barberShop.findFirst();
    if (!shop) {
      console.log('no shop found');
      return;
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject: 'Test subject',
        description: 'Test desc',
        priority: 'medium',
        category: 'support',
        shop: { connect: { id: shop.id } },
        user: { connect: { id: admin.id } },
        status: 'open'
      }
    });
    console.log('Created:', ticket);

    const fetched = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        messages: {
          include: {
            user: { select: { name: true, email: true, role: true } }
          }
        }
      }
    });
    console.log('Fetched:', fetched);
  } catch (e: any) {
    console.error('Prisma Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
