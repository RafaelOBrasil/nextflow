import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { customerName, rating, comment, date, appointmentId } = body;

    const shop = await prisma.barberShop.findUnique({ where: { slug } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        customerName,
        rating,
        comment,
        date,
        appointmentId,
        shopId: shop.id
      }
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
