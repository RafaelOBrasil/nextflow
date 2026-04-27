import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // 1h cache

// ================= GET =================
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
      take: 50,
      select: {
        id: true,
        name: true,
        price: true,
        interval: true,
        features: true,
        maxAppointments: true,
        isPopular: true,
        discount: true,
        monthlyPlanId: true
      }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('GET_PLANS_ERROR:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    );
  }
}

// ================= POST =================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      price,
      interval,
      features = [],
      maxAppointments,
      isPopular = false,
      discount = 0,
      monthlyPlanId
    } = body;

    // Validação raiz (sem frescura)
    if (!name || typeof price !== 'number' || !interval) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    if (interval === 'year' && !monthlyPlanId) {
      return NextResponse.json(
        { error: 'Plano anual precisa de vínculo mensal' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
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
    console.error('CREATE_PLAN_ERROR:', error);

    return NextResponse.json(
      { error: 'Erro ao criar plano' },
      { status: 500 }
    );
  }
}
function safeJsonParse(value: string | null) {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}