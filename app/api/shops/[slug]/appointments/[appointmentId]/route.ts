import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string, appointmentId: string }> }) {
  try {
    const user = await getAuthUser();
    const { appointmentId } = await params;
    const body = await request.json();
    const { status } = body;

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        shop: { select: { name: true } }
      }
    });

    // Add log
    await prisma.systemLog.create({
      data: {
        userId: user?.userId || 'system',
        action: 'UPDATE_APPOINTMENT_STATUS',
        target: appointment.shop.name,
        details: `Status do agendamento de ${appointment.customerName} alterado para ${status}`,
        type: 'info'
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
