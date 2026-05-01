import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PlanStatus {
  isExpired: boolean;
  isBlocked: boolean;
  limitReached: boolean;
  currentAppointments: number;
  maxAppointments: number | null;
  daysRemaining: number;
  subscriptionStatus: string;
}

export async function checkPlanStatus(shopId: string): Promise<PlanStatus> {
  const shop = await prisma.barberShop.findUnique({
    where: { id: shopId },
    include: {
      plan: true,
      subscriptions: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!shop) {
    throw new Error('Barber shop not found');
  }

  const activeSubscription = shop.subscriptions[0];
  const now = new Date();
  
  // 1. Check Expiration
  let isExpired = false;
  let isBlocked = shop.status === 'blocked';
  let daysRemaining = 0;
  
  if (activeSubscription) {
    const expirationDate = new Date(activeSubscription.currentPeriodEnd);
    isExpired = now > expirationDate;
    
    const diffTime = expirationDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // 7 days grace period logic
    const blockDate = new Date(expirationDate);
    blockDate.setDate(blockDate.getDate() + 7);
    
    if (now > blockDate && shop.status !== 'blocked') {
      isBlocked = true;
      // Auto block in DB
      await prisma.barberShop.update({
        where: { id: shopId },
        data: { status: 'blocked' }
      });
      await prisma.systemLog.create({
         data: {
            userId: 'SYSTEM',
            action: 'AUTO_BLOCK',
            target: shop.name,
            details: 'Shop automatically blocked 7 days after subscription expiration.',
            type: 'warning'
         }
      })
    } else if (isExpired && shop.status === 'active') {
      // Mark as expired in DB
      await prisma.barberShop.update({
        where: { id: shopId },
        data: { status: 'expired' }
      });
      await prisma.systemLog.create({
         data: {
            userId: 'SYSTEM',
            action: 'AUTO_EXPIRE',
            target: shop.name,
            details: 'Shop subscription expired, entering grace period.',
            type: 'info'
         }
      })
    }
  } else {
    isExpired = true; // No active subscription means expired/inactive
    
    // If shop was still active, block it if it has no active subscriptions
    if (shop.status === 'active' || shop.status === 'trial') {
        isBlocked = true;
        await prisma.barberShop.update({
            where: { id: shopId },
            data: { status: 'blocked' }
        });
    }
  }

  // 2. Check Monthly Limit
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const currentMonthAppointments = await prisma.appointment.count({
    where: {
      shopId: shopId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: { not: 'cancelled' }
    },
  });

  const maxAppointments = shop.plan?.maxAppointments ?? null;
  const limitReached = maxAppointments !== null && currentMonthAppointments >= maxAppointments;

  return {
    isExpired,
    isBlocked,
    limitReached,
    currentAppointments: currentMonthAppointments,
    maxAppointments,
    daysRemaining,
    subscriptionStatus: activeSubscription?.status || 'none',
  };
}
