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
        return NextResponse.json([]);
      }

      // Even if they try to pass a different shopId in query, we force their own shopId
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
    // If SAAS_ADMIN, use the shopId from payload if provided (ignoring empty strings).
    // Otherwise, default to user.shopId.
    const targetShopId = (user.role === 'SAAS_ADMIN' && typeof shopId === 'string' && shopId.trim() !== '') 
      ? shopId 
      : user.shopId;

    if (!targetShopId) {
      console.error('Ticket creation 400: targetShopId missing', {
        role: user.role,
        bodyShopId: shopId,
        userShopId: user.shopId
      });
      return NextResponse.json({ 
        error: 'Missing shopId',
        details: user.role === 'SAAS_ADMIN' 
          ? 'SAAS_ADMIN deve selecionar uma barbearia alvo.' 
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

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
