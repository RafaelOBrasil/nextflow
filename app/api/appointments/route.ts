import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkPlanStatus } from '@/lib/plan-utils';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, customerName, customerPhone, date, time, serviceId, barberId } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    // Check plan status before allowing appointment creation
    const planStatus = await checkPlanStatus(shopId);

    if (planStatus.isExpired) {
      return NextResponse.json({ 
        error: 'Subscription expired', 
        code: 'PLAN_EXPIRED',
        message: 'Seu plano expirou. Renove para continuar utilizando o sistema.' 
      }, { status: 403 });
    }

    if (planStatus.limitReached) {
      return NextResponse.json({ 
        error: 'Limit reached', 
        code: 'LIMIT_REACHED',
        message: 'Você atingiu o limite de agendamentos do seu plano.' 
      }, { status: 403 });
    }

    // Create appointment if checks pass
    const appointment = await prisma.appointment.create({
      data: {
        customerName,
        customerPhone,
        date,
        time,
        serviceId,
        barberId,
        shopId,
      },
    });

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');

  if (!shopId) {
    return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: { shopId },
      include: {
        service: true,
        barber: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
