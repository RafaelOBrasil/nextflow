import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    if (user.role !== 'SAAS_ADMIN' && ticket.shopId !== user.shopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        content,
        ticketId: id,
        userId: user.userId,
        isAdmin: user.role === 'SAAS_ADMIN' && user.userId !== ticket.userId
      },
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    // Update ticket updatedAt
    await prisma.ticket.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating ticket message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
