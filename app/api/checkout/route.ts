import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 10000 } 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, shopId, slug, price, name, email } = body;

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Mercado Pago token not configured' }, { status: 500 });
    }

    const baseUrl = process.env.APP_URL || 'https://ais-dev-cqdlbpuoq5prfqqw3nwfaq-348845068113.us-east1.run.app';
    
    console.log('Constructed baseUrl:', baseUrl);
    console.log('Slug:', slug, 'PlanId:', planId);

    const preference = new Preference(client);

    const preferenceBody = {
  items: [
    {
      id: planId,
      title: name,
      quantity: 1,
      unit_price: Number(price), // 🔥 FIX
      currency_id: 'BRL',
    }
  ],
  payer: {
    email: email || "atendimento@barber.com", // Usuário solicitou usar email do cliente
  },
  back_urls: {
    success: `${baseUrl}/${slug}/admin/subscription/success?planId=${planId}`,
    failure: `${baseUrl}/${slug}/admin/subscription/failure`,
    pending: `${baseUrl}/${slug}/admin/subscription/pending`,
  },
  auto_return: 'approved',
  external_reference: `${shopId}|${planId}`, 
};

    console.log('Preference body:', JSON.stringify(preferenceBody, null, 2));

    const response = await preference.create({
      body: preferenceBody
    });

    return NextResponse.json({ init_point: response.init_point });
  } catch (error: any) {
    console.error('Error creating preference:', error?.response?.data || error.message || error);
    return NextResponse.json({ error: 'Failed to create preference', details: error?.response?.data || error.message }, { status: 500 });
  }
}
