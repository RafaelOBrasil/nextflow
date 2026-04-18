import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const plans = await prisma.plan.findMany({
      include: { shops: true }
    });
    console.log('Plans:', JSON.stringify(plans, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
