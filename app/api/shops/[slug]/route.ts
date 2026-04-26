import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    let shop = await prisma.barberShop.findUnique({
      where: { slug },
      include: {
        services: true,
        barbers: true,
        appointments: {
          orderBy: { createdAt: 'desc' },
          include: { 
            service: true,
            barber: true
          }
        },
        reviews: {
          orderBy: { createdAt: 'desc' }
        },
        users: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Check for expiration
    const activeSubscription = shop.subscriptions[0];
    if (activeSubscription && activeSubscription.currentPeriodEnd < new Date() && shop.status !== 'expired') {
      // Free plans might not expire, but let's assume they do if currentPeriodEnd is set
      // Actually, if it's a free plan, maybe it shouldn't expire? Let's just check the date.
      await prisma.barberShop.update({
        where: { id: shop.id },
        data: { status: 'expired' }
      });
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { status: 'expired' }
      });
      shop.status = 'expired';
      activeSubscription.status = 'expired';
    }

    return NextResponse.json({
      ...shop,
      adminEmail: shop.users?.[0]?.email,
      openingHours: shop.openingHours ? JSON.parse(shop.openingHours) : undefined,
      subscriptions: shop.subscriptions.map(sub => ({
        ...sub,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    
    const { adminEmail, adminPassword } = body;

    // Sanitize body to only include valid BarberShop fields
    const allowedFields = [
      'name', 'description', 'address', 'phone', 'document', 
      'logo', 'banner', 'status', 'planId', 'openingHours',
      'appointmentInterval', 'useDynamicInterval', 'primaryColor'
    ];
    
    const updateData: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    // Convert openingHours to string if it exists
    if (updateData.openingHours) {
      updateData.openingHours = JSON.stringify(updateData.openingHours);
    }

    // Check if plan is being updated
    const currentShop = await prisma.barberShop.findUnique({ 
      where: { slug },
      include: { plan: true }
    });
    
    if (!currentShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    const isPlanUpdate = body.planId && body.planId !== currentShop.planId;

    if (isPlanUpdate) {
      const newPlan = await prisma.plan.findUnique({ where: { id: body.planId } });
      if (!newPlan) {
        return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
      }
      
      // Prevent downgrade from paid to free
      if (currentShop.plan && currentShop.plan.price > 0 && newPlan.price === 0) {
        return NextResponse.json({ error: 'Downgrade para plano gratuito não permitido automaticamente.' }, { status: 403 });
      }
    }

    if (body.services) {
      const existingServices = await prisma.service.findMany({ where: { shopId: currentShop.id } });
      const incomingServiceIds = body.services.map((s: any) => s.id);
      const servicesToDelete = existingServices.filter(s => !incomingServiceIds.includes(s.id));
      
      for (const service of servicesToDelete) {
        try {
          await prisma.service.delete({ where: { id: service.id } });
        } catch (e) {
          console.error(`Could not delete service ${service.id}, it might have appointments.`);
        }
      }

      updateData.services = {
        upsert: body.services.map((s: any) => ({
          where: { id: s.id },
          update: { name: s.name, price: s.price, duration: s.duration, description: s.description, active: s.active, autoAccept: s.autoAccept },
          create: { id: s.id, name: s.name, price: s.price, duration: s.duration, description: s.description, active: s.active, autoAccept: s.autoAccept }
        }))
      };
    }

    if (body.barbers && currentShop) {
      const existingBarbers = await prisma.barber.findMany({ where: { shopId: currentShop.id } });
      const incomingBarberIds = body.barbers.map((b: any) => b.id);
      const barbersToDelete = existingBarbers.filter(b => !incomingBarberIds.includes(b.id));
      
      for (const barber of barbersToDelete) {
        try {
          await prisma.barber.delete({ where: { id: barber.id } });
        } catch (e) {
          console.error(`Could not delete barber ${barber.id}, it might have appointments.`);
        }
      }

      updateData.barbers = {
        upsert: body.barbers.map((b: any) => ({
          where: { id: b.id },
          update: { name: b.name, role: b.role, avatar: b.avatar, active: b.active },
          create: { id: b.id, name: b.name, role: b.role, avatar: b.avatar, active: b.active }
        }))
      };
    }

    if (body.reviews && currentShop) {
      const existingReviews = await prisma.review.findMany({ where: { shopId: currentShop.id } });
      const incomingReviewIds = body.reviews.map((r: any) => r.id);
      const reviewsToDelete = existingReviews.filter(r => !incomingReviewIds.includes(r.id));
      
      for (const review of reviewsToDelete) {
        try {
          await prisma.review.delete({ where: { id: review.id } });
        } catch (e) {
          console.error(`Could not delete review ${review.id}.`);
        }
      }

      // Filter out reviews without appointmentId or id
      const validReviews = body.reviews.filter((r: any) => r.id && r.appointmentId);

      updateData.reviews = {
        upsert: validReviews.map((r: any) => ({
          where: { id: r.id },
          update: { status: r.status },
          create: { 
            id: r.id, 
            customerName: r.customerName, 
            rating: r.rating, 
            comment: r.comment, 
            date: r.date, 
            status: r.status,
            appointmentId: r.appointmentId
          }
        }))
      };
    }

    // Update shop
    const shop = await prisma.barberShop.update({
      where: { slug },
      data: updateData,
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
        users: true,
        plan: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Register payment and update subscription if plan was updated
    if (isPlanUpdate && shop.plan) {
      await prisma.payment.create({
        data: {
          shopId: shop.id,
          amount: shop.plan.price,
          method: shop.plan.price === 0 ? 'pix' : 'credit_card', // Placeholder for free/manual
          status: 'succeeded',
          description: `Alteração Manual de Plano - ${shop.plan.name}`
        }
      });

      const daysToAdd = shop.plan.interval === 'year' ? 365 : 30;
      const newEndDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

      const activeSub = shop.subscriptions[0];
      if (activeSub) {
        await prisma.subscription.update({
          where: { id: activeSub.id },
          data: {
            planId: shop.plan.id,
            status: 'active',
            currentPeriodEnd: newEndDate
          }
        });
      } else {
        await prisma.subscription.create({
          data: {
            shopId: shop.id,
            planId: shop.plan.id,
            status: 'active',
            currentPeriodEnd: newEndDate
          }
        });
      }
      
      // Update shop status to active if it was expired
      if (shop.status === 'expired') {
        await prisma.barberShop.update({
          where: { id: shop.id },
          data: { status: 'active' }
        });
      }
    }

    // Update admin user if email or password provided
    if (adminEmail || adminPassword) {
      const adminUser = shop.users[0];
      if (adminUser) {
        const userUpdateData: any = {};
        if (adminEmail && adminEmail !== adminUser.email) {
          // Check if email is already in use
          const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
          if (existingUser) {
            return NextResponse.json({ error: 'Este e-mail já está sendo usado por outro administrador.' }, { status: 400 });
          }
          userUpdateData.email = adminEmail;
        }
        
        if (adminPassword) {
          userUpdateData.password = await bcrypt.hash(adminPassword, 10);
        }
        
        if (Object.keys(userUpdateData).length > 0) {
          await prisma.user.update({
            where: { id: adminUser.id },
            data: userUpdateData
          });
        }
      }
    }

    // Refetch to get updated subscriptions
    const updatedShop = await prisma.barberShop.findUnique({
      where: { slug },
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
        users: true,
        plan: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({
      ...updatedShop,
      adminEmail: adminEmail || updatedShop?.users?.[0]?.email,
      openingHours: updatedShop?.openingHours ? JSON.parse(updatedShop.openingHours) : undefined,
      subscriptions: updatedShop?.subscriptions.map(sub => ({
        ...sub,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString()
      }))
    });
  } catch (error: any) {
    console.error('Error updating shop:', error);
    if (error.code) {
      console.error('Prisma Error Code:', error.code);
      console.error('Prisma Error Meta:', error.meta);
    }
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}
