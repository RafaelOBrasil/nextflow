import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthUser();
    const isSaaSAdmin = user?.role === 'SAAS_ADMIN';

    const shops = await prisma.barberShop.findMany({
      take: 20, // Add pagination to prevent timeouts
      include: {
        services: true,
        barbers: true,
        appointments: {
          take: 10,
          include: {
            service: true,
            barber: true
          }
        },
        reviews: { take: 10 },
        plan: true,
        users: true,
        subscriptions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    // Check for expiration and format
    const now = new Date();
    const formattedShops = await Promise.all(shops.map(async (shop) => {
      let currentStatus = shop.status;
      let activeSubscription = null;

      if (shop.subscriptions && shop.subscriptions.length > 0) {
        activeSubscription = shop.subscriptions[0];
        if (activeSubscription && activeSubscription.currentPeriodEnd < now && currentStatus !== 'expired') {
          await prisma.barberShop.update({
            where: { id: shop.id },
            data: { status: 'expired' }
          });
          await prisma.subscription.update({
            where: { id: activeSubscription.id },
            data: { status: 'expired' }
          });
          currentStatus = 'expired';
          activeSubscription.status = 'expired';
        }
      }

      const shopData: any = {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        address: shop.address,
        phone: shop.phone,
        banner: shop.banner,
        status: currentStatus,
        planId: shop.planId,
        openingHours: shop.openingHours ? JSON.parse(shop.openingHours) : undefined,
        lunchBreak: shop.lunchBreak ? JSON.parse(shop.lunchBreak) : undefined,
        blackoutPeriods: shop.blackoutPeriods ? JSON.parse(shop.blackoutPeriods) : undefined,
        createdAt: shop.createdAt,
        updatedAt: shop.updatedAt,
        services: shop.services,
        barbers: shop.barbers,
        reviews: shop.reviews
      };

      if (isSaaSAdmin) {
        shopData.appointments = shop.appointments;
        shopData.adminEmail = shop.users?.[0]?.email;
        shopData.plan = shop.plan;
        shopData.subscriptions = shop.subscriptions?.map(sub => ({
          ...sub,
          createdAt: sub.createdAt.toISOString(),
          updatedAt: sub.updatedAt.toISOString(),
          currentPeriodEnd: sub.currentPeriodEnd.toISOString()
        }));
      }

      return shopData;
    }));

    return NextResponse.json(formattedShops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('POST /api/shops called');
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { 
      slug, name, description, address, phone, document, banner, 
      adminEmail, adminPassword, status, planId, openingHours,
      services, barbers
    } = body;

    console.log('Checking if slug exists:', slug);
    // Check if slug exists
    const existingShop = await prisma.barberShop.findUnique({ where: { slug } });
    if (existingShop) {
      console.log('Slug already exists:', slug);
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    console.log('Hashing password');
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let finalPlanId = planId;
    if (!finalPlanId || finalPlanId === 'p1') {
      const basicPlan = await prisma.plan.findFirst({
        where: { price: 0 }
      });
      if (basicPlan) {
        finalPlanId = basicPlan.id;
      }
    }

    console.log('Creating shop');
    const shop = await prisma.barberShop.create({
      data: {
        slug,
        name,
        description,
        address,
        phone,
        document,
        banner,
        status: 'trial',
        planId: finalPlanId,
        openingHours: openingHours ? JSON.stringify(openingHours) : undefined,
        users: {
          create: {
            email: adminEmail,
            password: hashedPassword,
            name: 'Admin',
            role: 'SHOP_ADMIN'
          }
        },
        services: {
          create: services?.map((s: any) => ({
            name: s.name,
            price: s.price,
            duration: s.duration,
            description: s.description
          })) || []
        },
        barbers: {
          create: barbers?.map((b: any) => ({
            name: b.name,
            role: b.role,
            avatar: b.avatar
          })) || []
        },
        subscriptions: {
          create: {
            planId: finalPlanId,
            status: 'trial',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      include: {
        services: true,
        barbers: true,
        appointments: {
          include: {
            service: true,
            barber: true
          }
        },
        reviews: true,
        subscriptions: true
      }
    });
    console.log('Shop created:', shop.id);

    return NextResponse.json({
      ...shop,
      openingHours: shop.openingHours ? JSON.parse(shop.openingHours) : undefined
    });
  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
