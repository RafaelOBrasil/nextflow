import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PlanStatus {
  isExpired: boolean;
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
  let daysRemaining = 0;
  
  if (activeSubscription) {
    const expirationDate = new Date(activeSubscription.currentPeriodEnd);
    isExpired = now > expirationDate;
    
    const diffTime = expirationDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else {
    isExpired = true; // No active subscription means expired/inactive
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
    },
  });

  const maxAppointments = shop.plan?.maxAppointments ?? null;
  const limitReached = maxAppointments !== null && currentMonthAppointments >= maxAppointments;

  return {
    isExpired,
    limitReached,
    currentAppointments: currentMonthAppointments,
    maxAppointments,
    daysRemaining: Math.max(0, daysRemaining),
    subscriptionStatus: activeSubscription?.status || 'none',
  };
}
