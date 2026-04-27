import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { DEFAULT_PLANS } from '@/lib/plans';

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('admin2026', 10);
    await prisma.user.upsert({
      where: { email: 'adm@superadmin.com' },
      update: {
        password: hashedPassword,
        role: 'SAAS_ADMIN'
      },
      create: {
        email: 'adm@superadmin.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SAAS_ADMIN'
      }
    });

    // Check if plans exist
    const plansCount = await prisma.plan.count();
    if (plansCount === 0) {
      for (const plan of DEFAULT_PLANS) {
        await prisma.plan.create({
          data: {
            name: plan.name,
            price: plan.price,
            interval: plan.interval,
            features: plan.features,
            maxAppointments: plan.maxAppointments,
            isPopular: plan.isPopular || false
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
