import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, interval, features, maxAppointments, isPopular, discount, monthlyPlanId } = body;

    if (interval === 'year' && !monthlyPlanId) {
      return NextResponse.json({ error: 'Annual plans must be linked to a monthly plan' }, { status: 400 });
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        price,
        interval,
        features,
        maxAppointments,
        isPopular,
        discount,
        monthlyPlanId
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if any shops are using this plan
    const shopsCount = await prisma.barberShop.count({
      where: { planId: id }
    });

    if (shopsCount > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir um plano que possui barbearias vinculadas. Desvincule as barbearias primeiro.' 
      }, { status: 400 });
    }

    await prisma.plan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Erro interno ao excluir o plano.' }, { status: 500 });
  }
}
