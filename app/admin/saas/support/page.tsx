'use client';

import { useSaaSData } from '@/hooks/use-saas-data';
import { LifeBuoy } from 'lucide-react';
import SupportCenter from '@/components/Support/SupportCenter';

export default function SaaSSupportManagement() {
  const { 
    tickets, 
    loading, 
    updateTicketStatus, 
    addTicketMessage,
    fetchTickets,
    fetchTicket,
    createTicket,
    shops
  } = useSaaSData();

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Central de Suporte</h2>
          <p className="text-neutral-500">Gerencie os chamados de suporte de todas as barbearias.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <span className="text-sm font-bold">{tickets.filter(t => t.status === 'open').length} Tickets Pendentes</span>
          </div>
        </div>
      </div>

      <SupportCenter 
        tickets={tickets}
        loading={loading}
        onSendMessage={addTicketMessage}
        onCreateTicket={createTicket}
        onFetchTicket={fetchTicket}
        onUpdateStatus={updateTicketStatus}
        isAdmin={true}
        shops={shops.map(s => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
