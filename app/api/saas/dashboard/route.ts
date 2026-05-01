import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'SAAS_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [shops, payments, logs, tickets, plans] = await Promise.all([
      prisma.barberShop.findMany({
        take: 20,
        include: {
          services: true,
          barbers: true,
          appointments: {
            take: 10,
            include: { service: true, barber: true }
          },
          reviews: { take: 10 },
          plan: true,
          users: true,
          subscriptions: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: { shop: true }
      }),
      prisma.systemLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50
      }),
      prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      prisma.plan.findMany()
    ]);
    
    return NextResponse.json({
        shops,
        payments,
        logs,
        tickets,
        plans
    });
  } catch (error) {
    console.error('Error fetching saas dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
