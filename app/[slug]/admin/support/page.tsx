'use client';

import { useTickets } from '@/hooks/use-tickets';
import SupportCenter from '@/components/Support/SupportCenter';
import { useParams } from 'next/navigation';
import { useBarberData } from '@/hooks/use-barber-data';

export default function ShopSupportPage() {
  const { slug } = useParams();
  const { getShopBySlug } = useBarberData();
  const shop = getShopBySlug(slug as string);
  const { tickets, loading, createTicket, addMessage, closeTicket, fetchTicket } = useTickets(shop?.id);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Suporte</h2>
        <p className="text-neutral-500">Precisa de ajuda? Abra um chamado para nossa equipe.</p>
      </div>

      <SupportCenter 
        tickets={tickets}
        loading={loading}
        onSendMessage={addMessage}
        onCreateTicket={async (data) => {
          // If the user doesn't have a shopId in their token (like SAAS_ADMIN),
          // we inject the current shopId from the context.
          return createTicket({
            ...data,
            shopId: data.shopId || shop?.id
          });
        }}
        onFetchTicket={fetchTicket}
        onUpdateStatus={async (id, status) => {
          if (status === 'closed') await closeTicket(id);
        }}
        isAdmin={false}
      />
    </div>
  );
}
