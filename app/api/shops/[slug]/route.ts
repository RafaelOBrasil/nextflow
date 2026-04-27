import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getAuthUser();

    // Primeiro busca básico (leve)
    const shop = await prisma.barberShop.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        logo: true,
        banner: true,
        status: true,
        primaryColor: true,
        openingHours: true,
        plan: true
      }
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const isAdmin =
      user && (user.role === 'SAAS_ADMIN' || user.shopId === shop.id);

    // ================= ADMIN =================
    if (isAdmin) {
      const fullData = await prisma.barberShop.findUnique({
        where: { id: shop.id },
        include: {
          services: { orderBy: { id: 'desc' } },
          barbers: { orderBy: { id: 'desc' } },
          appointments: {
            orderBy: { date: 'desc' },
            include: {
              service: true,
              barber: true
            }
          },
          reviews: {
            orderBy: { createdAt: 'desc' }
          },
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          },
          subscriptions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      const activeSub = fullData?.subscriptions?.[0];

      return NextResponse.json({
        ...fullData,
        openingHours: safeJson(fullData?.openingHours),
        subscriptions: fullData?.subscriptions.map(formatSub)
      });
    }

    // ================= PUBLIC =================
    const publicData = await prisma.barberShop.findUnique({
      where: { id: shop.id },
      include: {
        services: { orderBy: { id: 'desc' } },
        barbers: { orderBy: { id: 'desc' } },
        appointments: {
          where: {
            status: { in: ['pending', 'confirmed'] }
          },
          select: {
            id: true,
            date: true,
            time: true,
            barberId: true,
            serviceId: true,
            status: true,
            customerName: true,
            customerPhone: true
          }
        },
        reviews: {
          where: { status: 'approved_for_display' },
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({
      ...shop,
      openingHours: safeJson(shop.openingHours),
      services: publicData?.services.filter(s => s.active),
      barbers: publicData?.barbers.filter(b => b.active),
      appointments: publicData?.appointments,
      reviews: publicData?.reviews
    });

  } catch (error) {
    console.error('GET_SHOP_ERROR:', error);

    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}

// ================= UTILS =================
function safeJson(value?: string | null) {
  try {
    return value ? JSON.parse(value) : undefined;
  } catch {
    return undefined;
  }
}

function formatSub(sub: any) {
  return {
    ...sub,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString()
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getAuthUser();
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
          // Log deletion
          await prisma.systemLog.create({
            data: {
              userId: user?.userId || 'system',
              action: 'DELETE_SERVICE',
              target: currentShop.name,
              details: `Serviço "${service.name}" removido definitivamente.`,
              type: 'info'
            }
          });
        } catch (e) {
          console.error(`Could not delete service ${service.id}, it might have appointments.`);
        }
      }

      // Check for updates or activations/deactivations
      for (const s of body.services) {
        const existing = existingServices.find(es => es.id === s.id);
        if (existing && existing.active !== s.active) {
          await prisma.systemLog.create({
            data: {
              userId: user?.userId || 'system',
              action: s.active ? 'ACTIVATE_SERVICE' : 'DEACTIVATE_SERVICE',
              target: currentShop.name,
              details: `Serviço "${s.name}" foi ${s.active ? 'ativado' : 'desativado'}.`,
              type: 'info'
            }
          });
        } else if (!existing) {
          await prisma.systemLog.create({
            data: {
              userId: user?.userId || 'system',
              action: 'CREATE_SERVICE',
              target: currentShop.name,
              details: `Novo serviço criado: "${s.name}" (R$ ${s.price})`,
              type: 'info'
            }
          });
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
          // Log deletion
          await prisma.systemLog.create({
            data: {
              userId: user?.userId || 'system',
              action: 'DELETE_BARBER',
              target: currentShop.name,
              details: `Barbeiro "${barber.name}" removido definitivamente.`,
              type: 'info'
            }
          });
        } catch (e) {
          console.error(`Could not delete barber ${barber.id}, it might have appointments.`);
        }
      }

      // Check for updates or activations/deactivations
      for (const b of body.barbers) {
        const existing = existingBarbers.find(eb => eb.id === b.id);
        if (existing && existing.active !== b.active) {
          await prisma.systemLog.create({
            data: {
              userId: user?.userId || 'system',
              action: b.active ? 'ACTIVATE_BARBER' : 'DEACTIVATE_BARBER',
              target: currentShop.name,
              details: `Barbeiro "${b.name}" foi ${b.active ? 'ativado' : 'desativado'}.`,
              type: 'info'
            }
          });
        } else if (!existing) {
          await prisma.systemLog.create({
            data: {
              userId: user?.userId || 'system',
              action: 'CREATE_BARBER',
              target: currentShop.name,
              details: `Novo barbeiro adicionado: "${b.name}"`,
              type: 'info'
            }
          });
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

    // Log status change if applicable
    if (updateData.status && updateData.status !== currentShop.status) {
      await prisma.systemLog.create({
        data: {
          userId: user?.userId || 'system',
          action: 'SHOP_STATUS_CHANGED',
          target: shop.name,
          details: `Status da barbearia alterado de ${currentShop.status} para ${updateData.status}`,
          type: updateData.status === 'blocked' ? 'warning' : 'info'
        }
      });
    }

    // Register payment and update subscription if plan was updated
    if (isPlanUpdate && shop.plan) {
      // Log plan change
      await prisma.systemLog.create({
        data: {
          userId: user?.userId || 'system',
          action: 'SHOP_PLAN_CHANGED',
          target: shop.name,
          details: `Plano alterado para ${shop.plan.name} (${shop.plan.interval === 'year' ? 'Anual' : 'Mensal'})`,
          type: 'info'
        }
      });

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
