import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        shop: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
        messages: {
          include: {
            user: { select: { name: true, email: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    if (user.role !== 'SAAS_ADMIN' && ticket.shopId !== user.shopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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
    const { status, priority } = body;

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Only admin can change status/priority of any ticket
    // Shop owner can manage their own ticket (including reopening or setting to in progress if they want)
    if (user.role !== 'SAAS_ADMIN') {
      if (ticket.shopId !== user.shopId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Removed the restriction that shop owners can only close tickets 
      // so they can reopen or set them to in progress.
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: status || ticket.status,
        priority: priority || ticket.priority
      },
      include: {
        shop: { select: { name: true } }
      }
    });

    // Add log
    if (status && status !== ticket.status) {
      await prisma.systemLog.create({
        data: {
          userId: user.userId,
          action: 'UPDATE_TICKET_STATUS',
          target: updatedTicket.shop.name,
          details: `Status do chamado "${updatedTicket.subject}" alterado para ${status}`,
          type: 'info'
        }
      });
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
