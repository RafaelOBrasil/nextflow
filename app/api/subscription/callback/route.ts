import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 10000 } 
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const slug = searchParams.get('slug');
  const planId = searchParams.get('planId');
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  console.log('Mercado Pago Callback:', { slug, planId, paymentId, status });

  if (!slug || !paymentId) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

    try {
    const payment = new Payment(client);
    const paymentDetails = await payment.get({ id: paymentId });
    const paymentStatus = paymentDetails.status;
    const paymentStatusDetail = paymentDetails.status_detail;
    const amountPaid = paymentDetails.transaction_amount || 0;

    const shop = await prisma.barberShop.findUnique({
      where: { slug },
      include: { plan: true }
    });

    const targetPlan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : null;
    const planName = targetPlan?.name || shop?.plan?.name || 'Desconhecido';

    if (shop) {
      let translatedStatus = 'failed';
      let statusMessage = `Assinatura - Plano ${planName}`;

      if (paymentStatus === 'approved') {
        translatedStatus = 'succeeded';
        statusMessage = `Aprovado - Plano ${planName}`;
      } else if (paymentStatus === 'pending' || paymentStatus === 'in_process') {
        translatedStatus = 'pending';
        statusMessage = `Pendente - Plano ${planName}`;
      } else if (paymentStatus === 'rejected') {
        translatedStatus = 'failed';
        if (paymentStatusDetail === 'cc_rejected_duplicated_payment') {
          statusMessage = `Rejeitado (Pagamento Duplicado) - Plano ${planName}`;
        } else if (paymentStatusDetail === 'cc_rejected_insufficient_amount') {
          statusMessage = `Recusado (Saldo Insuficiente) - Plano ${planName}`;
        } else {
          statusMessage = `Rejeitado (${paymentStatusDetail || 'Desconhecido'}) - Plano ${planName}`;
        }
      }

      const fullDescription = `${statusMessage} (ID: ${paymentId})`;

      const existingPayment = await prisma.payment.findFirst({
        where: {
          shopId: shop.id,
          description: {
            contains: `(ID: ${paymentId})`
          }
        }
      });

      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            shopId: shop.id,
            amount: amountPaid,
            method: paymentDetails.payment_type_id || 'credit_card',
            status: translatedStatus,
            description: fullDescription
          }
        });
      } else {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: amountPaid,
            status: translatedStatus,
            description: fullDescription
          }
        });
      }
    }

      if (paymentStatus === 'approved' && shop && planId) {
      await prisma.barberShop.update({
        where: { slug },
        data: { 
          status: 'active',
          planId 
        }
      });
      
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      const daysToAdd = plan?.interval === 'year' ? 365 : 30;
      
      const activeSub = await prisma.subscription.findFirst({
        where: { shopId: shop.id },
        orderBy: { createdAt: 'desc' }
      });

      const baseDate = activeSub && activeSub.currentPeriodEnd.getTime() > Date.now() 
        ? activeSub.currentPeriodEnd 
        : new Date();

      if (activeSub) {
        await prisma.subscription.update({
          where: { id: activeSub.id },
          data: {
            status: 'active',
            planId,
            currentPeriodEnd: new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.subscription.create({
          data: {
            shopId: shop.id,
            planId,
            status: 'active',
            currentPeriodEnd: new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
          }
        });
      }
    }

    return NextResponse.json({ status: paymentStatus });
  } catch (error) {
    console.error('Error processing Mercado Pago callback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Mercado Pago Webhook:', body);

    const paymentId = body?.data?.id || body?.id;
    const type = body?.type || body?.action;

    if (!paymentId || (type !== 'payment' && type !== 'payment.updated' && type !== 'payment.created')) {
      return NextResponse.json({ status: 'ignored' });
    }

    const payment = new Payment(client);
    const paymentDetails = await payment.get({ id: paymentId });
    const paymentStatus = paymentDetails.status;
    const paymentStatusDetail = paymentDetails.status_detail;
    const amountPaid = paymentDetails.transaction_amount || 0;
    const externalReference = paymentDetails.external_reference; // shopId|planId

    if (!externalReference) {
      return NextResponse.json({ error: 'No external reference' }, { status: 400 });
    }

    const [shopId, planId] = externalReference.split('|');

    const shop = await prisma.barberShop.findUnique({
      where: { id: shopId },
      include: { plan: true }
    });

    const targetPlan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : null;
    const planName = targetPlan?.name || shop?.plan?.name || 'Desconhecido';

    if (shop) {
      let translatedStatus = 'failed';
      let statusMessage = `Assinatura - Plano ${planName}`;

      if (paymentStatus === 'approved') {
        translatedStatus = 'succeeded';
        statusMessage = `Aprovado - Plano ${planName}`;
      } else if (paymentStatus === 'pending' || paymentStatus === 'in_process') {
        translatedStatus = 'pending';
        statusMessage = `Pendente - Plano ${planName}`;
      } else if (paymentStatus === 'rejected') {
        translatedStatus = 'failed';
        if (paymentStatusDetail === 'cc_rejected_duplicated_payment') {
          statusMessage = `Rejeitado (Pagamento Duplicado) - Plano ${planName}`;
        } else if (paymentStatusDetail === 'cc_rejected_insufficient_amount') {
          statusMessage = `Recusado (Saldo Insuficiente) - Plano ${planName}`;
        } else {
          statusMessage = `Rejeitado (${paymentStatusDetail || 'Desconhecido'}) - Plano ${planName}`;
        }
      }

      const fullDescription = `${statusMessage} (ID: ${paymentId})`;

      const existingPayment = await prisma.payment.findFirst({
        where: {
          shopId: shop.id,
          description: {
            contains: `(ID: ${paymentId})`
          }
        }
      });

      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            shopId: shop.id,
            amount: amountPaid,
            method: paymentDetails.payment_type_id || 'credit_card',
            status: translatedStatus,
            description: fullDescription
          }
        });
      } else {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: amountPaid,
            status: translatedStatus,
            description: fullDescription
          }
        });
      }

      // If approved, update subscription
      if (paymentStatus === 'approved') {
        const finalPlanId = planId || shop.planId;
        
        await prisma.barberShop.update({
          where: { id: shop.id },
          data: { 
            status: 'active',
            planId: finalPlanId || undefined
          }
        });
        
        const plan = finalPlanId ? await prisma.plan.findUnique({ where: { id: finalPlanId } }) : null;
        const daysToAdd = plan?.interval === 'year' ? 365 : 30;
        
        const activeSub = await prisma.subscription.findFirst({
          where: { shopId: shop.id },
          orderBy: { createdAt: 'desc' }
        });

        const baseDate = activeSub && activeSub.currentPeriodEnd.getTime() > Date.now() 
          ? activeSub.currentPeriodEnd 
          : new Date();

        if (activeSub) {
          await prisma.subscription.update({
            where: { id: activeSub.id },
            data: {
              status: 'active',
              planId: finalPlanId || undefined,
              currentPeriodEnd: new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
              updatedAt: new Date()
            }
          });
        } else if (finalPlanId) {
          await prisma.subscription.create({
            data: {
              shopId: shop.id,
              planId: finalPlanId,
              status: 'active',
              currentPeriodEnd: new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
            }
          });
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Mercado Pago webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
