import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { customerName, customerPhone, date, time, serviceId, barberId } = body;

    const shop = await prisma.barberShop.findUnique({ where: { slug } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Check for existing appointment at same date, time, and barber
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        shopId: shop.id,
        date,
        time,
        barberId,
        status: { not: 'cancelled' }
      }
    });

    if (existingAppointment) {
      return NextResponse.json({ 
        error: 'Slot already taken', 
        message: 'Este horário já foi agendado com este barbeiro. Por favor, escolha outro horário.' 
      }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerName,
        customerPhone,
        date,
        time,
        serviceId,
        barberId,
        shopId: shop.id
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
