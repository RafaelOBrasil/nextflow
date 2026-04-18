import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const annualPlans = await prisma.plan.findMany({ where: { interval: 'year' } });
  const annualPlanIds = annualPlans.map(p => p.id);

  const subs = await prisma.subscription.findMany({
    where: { planId: { in: annualPlanIds } }
  });

  for (const sub of subs) {
    const newEnd = new Date(sub.updatedAt.getTime() + 365 * 24 * 60 * 60 * 1000);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { currentPeriodEnd: newEnd }
    });
    console.log(`Updated sub ${sub.id} to end at ${newEnd}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
