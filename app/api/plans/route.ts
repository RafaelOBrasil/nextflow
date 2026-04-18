import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force re-compilation to fix module resolution issues (e.g. "./1331.js")
// Last updated: 2026-04-16T16:57:00Z
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      take: 50,
      orderBy: { price: 'asc' }
    });
    
    // Parse features back to array
    const formattedPlans = plans.map(plan => {
      let features = [];
      try {
        features = JSON.parse(plan.features);
      } catch (e) {
        console.error('Error parsing features for plan:', plan.name, plan.features, e);
      }
      return {
        ...plan,
        features
      };
    });
    
    return NextResponse.json(formattedPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, interval, features, maxAppointments, isPopular, discount, monthlyPlanId } = body;

    if (interval === 'year' && !monthlyPlanId) {
      return NextResponse.json({ error: 'Annual plans must be linked to a monthly plan' }, { status: 400 });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        price,
        interval,
        features: JSON.stringify(features || []),
        maxAppointments,
        isPopular: isPopular || false,
        discount,
        monthlyPlanId
      }
    });

    return NextResponse.json({
      ...plan,
      features: JSON.parse(plan.features)
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
