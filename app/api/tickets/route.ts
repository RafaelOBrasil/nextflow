import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const shopIdQuery = searchParams.get('shopId');

  try {
    let tickets;
    if (user.role === 'SAAS_ADMIN') {
      // Super Admin can see everything or filter by shopId
      const where: any = {};
      if (shopIdQuery) {
        where.shopId = shopIdQuery;
      }

      tickets = await prisma.ticket.findMany({
        where,
        include: {
          shop: { select: { name: true, slug: true } },
          user: { select: { name: true, email: true } },
          _count: { select: { messages: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
    } else {
      // Regular Shop Admin can ONLY see their own shop's tickets
      if (!user.shopId) {
        return NextResponse.json({ error: 'User is not associated with a shop' }, { status: 403 });
      }

      tickets = await prisma.ticket.findMany({
        where: { shopId: user.shopId },
        include: {
          shop: { select: { name: true, slug: true } },
          user: { select: { name: true, email: true } },
          _count: { select: { messages: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
    }

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, description, priority, category, shopId } = body;

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
    }

    // Determine targetShopId: 
    // If SAAS_ADMIN, use the shopId from payload.
    // Otherwise, always force the logged-in user's shopId to prevent spoofing.
    const targetShopId = (user.role === 'SAAS_ADMIN' && typeof shopId === 'string' && shopId.trim() !== '') 
      ? shopId 
      : user.shopId;

    if (!targetShopId) {
      return NextResponse.json({ 
        error: 'Missing shopId',
        details: user.role === 'SAAS_ADMIN' 
          ? 'Administradores SaaS devem selecionar uma barbearia para o chamado.' 
          : 'Seu usuário não está vinculado a uma barbearia.'
      }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority: priority || 'medium',
        category: category || 'support',
        shop: { connect: { id: targetShopId } },
        user: { connect: { id: user.userId } },
        status: 'open'
      },
      include: {
        shop: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
        _count: { select: { messages: true } }
      }
    });

    // Add log
    await prisma.systemLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_TICKET',
        target: ticket.shop.name,
        details: `Novo chamado de suporte aberto: ${subject}`,
        type: 'info'
      }
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
