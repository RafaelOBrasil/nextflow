import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { customerName, customerPhone, date, time, serviceId, barberId } = body;

    const shop = await prisma.barberShop.findUnique({ where: { slug } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    const status = service?.autoAccept ? 'confirmed' : 'pending';

    // Check for overlaps
    const dayAppointments = await prisma.appointment.findMany({
      where: {
        shopId: shop.id,
        date,
        barberId,
        status: { not: 'cancelled' }
      },
      include: { service: true }
    });

    const newStart = timeToMinutes(time);
    const newEnd = newStart + (service?.duration || shop.appointmentInterval || 30);

    const hasOverlap = dayAppointments.some(apt => {
      const aptStart = timeToMinutes(apt.time);
      const aptDuration = apt.service?.duration || shop.appointmentInterval || 30;
      const aptEnd = aptStart + aptDuration;
      
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      return newStart < aptEnd && newEnd > aptStart;
    });

    if (hasOverlap) {
      return NextResponse.json({ 
        error: 'Slot already taken', 
        message: 'Este horário tem conflito de tempo com outro agendamento neste barbeiro.' 
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
        shopId: shop.id,
        status
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
