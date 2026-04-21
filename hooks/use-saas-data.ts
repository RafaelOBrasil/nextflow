'use client';

import { useState, useEffect, useCallback } from 'react';
import type { 
  Subscription, 
  Payment, 
  SuperUser, 
  SupportTicket, 
  SystemLog,
  SaaSStats 
} from '@/lib/saas-types';
import type { BarberShop, Plan } from '@/lib/types';
import { useBarberData } from './use-barber-data';
import { usePlans } from './use-plans';

const SAAS_STORAGE_KEY = 'barber_saas_global_data';

export function useSaaSData() {
  const { shops, updateShop, loading: shopsLoading } = useBarberData();
  const { plans, loading: plansLoading } = usePlans();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [superUsers, setSuperUsers] = useState<SuperUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    try {
      const token = localStorage.getItem('barber_auth_token');
      const res = await fetch('/api/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/saas/payments');
      if (res.ok) {
        const data = await res.json();
        // Map database Payment to SaaS Payment type
        const mappedPayments: Payment[] = data.map((p: any) => ({
          id: p.id,
          shopId: p.shopId,
          amount: p.amount,
          currency: p.currency,
          status: p.status as any,
          method: p.method as any,
          date: p.createdAt,
          description: p.description || ''
        }));
        setPayments(mappedPayments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/saas/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchPayments();
      fetchLogs();
      fetchTickets();
      const stored = localStorage.getItem(SAAS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSuperUsers(parsed.superUsers || [{ id: 'admin', name: 'SaaS Owner', email: 'owner@barberflow.com', role: 'admin' }]);
        } catch (e) {
          console.error('Error parsing SaaS global data');
        }
      } else {
        // Initial defaults
        setSuperUsers([{ id: 'admin', name: 'SaaS Owner', email: 'owner@barberflow.com', role: 'admin' }]);
        
        localStorage.setItem(SAAS_STORAGE_KEY, JSON.stringify({
          payments: [],
          tickets: [],
          superUsers: [{ id: 'admin', name: 'SaaS Owner', email: 'owner@barberflow.com', role: 'admin' }]
        }));
      }
    }
    setLoading(false);
  }, [shopsLoading, fetchLogs, fetchPayments, fetchTickets]);

  const saveSaaSData = useCallback((data: { payments?: Payment[], tickets?: SupportTicket[], superUsers?: SuperUser[] }) => {
    const current = JSON.parse(localStorage.getItem(SAAS_STORAGE_KEY) || '{}');
    const updated = { ...current, ...data };
    localStorage.setItem(SAAS_STORAGE_KEY, JSON.stringify(updated));
    if (data.payments) setPayments(data.payments);
    if (data.tickets) setTickets(data.tickets);
    if (data.superUsers) setSuperUsers(data.superUsers);
  }, []);

  const addLog = useCallback(async (action: string, target: string, details: string, type: SystemLog['type'] = 'info') => {
    try {
      const res = await fetch('/api/saas/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'admin', action, target, details, type })
      });
      if (res.ok) {
        const newLog = await res.json();
        setLogs(prev => [newLog, ...prev]);
      }
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }, []);

  // Automatic blocking logic
  useEffect(() => {
    if (!loading && shops.length > 0) {
      shops.forEach(shop => {
        const activeSubscription = shop.subscriptions?.[0];
        if (activeSubscription && shop.status !== 'blocked') {
          const expirationDate = new Date(activeSubscription.currentPeriodEnd);
          const sevenDaysAfterExpiration = new Date(expirationDate);
          sevenDaysAfterExpiration.setDate(sevenDaysAfterExpiration.getDate() + 7);
          
          if (new Date() > sevenDaysAfterExpiration) {
            updateShop(shop.slug, { status: 'blocked' });
            addLog('AUTO_BLOCK', shop.name, 'Shop automatically blocked due to expiration.');
          }
        }
      });
    }
  }, [loading, shops, updateShop, addLog]);

  const toggleShopStatus = useCallback((shopId: string) => {
    const shop = shops.find(s => s.id === shopId);
    if (shop) {
      const newStatus = shop.status === 'blocked' ? 'active' : 'blocked';
      updateShop(shop.slug, { status: newStatus });
      addLog(newStatus === 'blocked' ? 'BLOCK_SHOP' : 'ACTIVATE_SHOP', shop.name, `Shop status changed to ${newStatus}`);
    }
  }, [shops, updateShop, addLog]);

  const getStats = (): SaaSStats => {
    const activeShopsCount = shops.filter(s => s.status === 'active').length;
    const totalMRR = shops.reduce((acc, shop) => {
      const plan = plans.find(p => p.id === shop.planId);
      return acc + (shop.status === 'active' ? (plan?.price || 0) : 0);
    }, 0);

    return {
      totalMRR,
      activeShops: activeShopsCount,
      totalAppointments: shops.reduce((acc, s) => acc + (s.appointments?.length || 0), 0),
      newShopsThisMonth: shops.filter(s => s.createdAt && new Date(s.createdAt).getMonth() === new Date().getMonth()).length,
      churnRate: 2.5,
      revenueByMonth: [
        { month: 'Jan', amount: totalMRR * 0.8 },
        { month: 'Fev', amount: totalMRR * 0.9 },
        { month: 'Mar', amount: totalMRR },
      ]
    };
  };

  const fetchTicket = useCallback(async (ticketId: string) => {
    try {
      const token = localStorage.getItem('barber_auth_token');
      const res = await fetch(`/api/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const fullTicket = await res.json();
        setTickets(prev => prev.map(t => t.id === ticketId ? fullTicket : t));
        return fullTicket;
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  }, []);

  const updateTicketStatus = useCallback(async (ticketId: string, status: SupportTicket['status']) => {
    try {
      const token = localStorage.getItem('barber_auth_token');
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: updated.status } : t));
        addLog('UPDATE_TICKET', ticketId, `Ticket status changed to ${status}`);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  }, [addLog]);

  const addTicketMessage = useCallback(async (ticketId: string, content: string) => {
    try {
      const token = localStorage.getItem('barber_auth_token');
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        const newMessage = await res.json();
        setTickets(prev => prev.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              messages: [...(t.messages || []), newMessage],
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        }));
        return newMessage;
      }
    } catch (error) {
      console.error('Error adding ticket message:', error);
    }
  }, []);

  return {
    shops,
    plans,
    payments,
    tickets,
    logs,
    superUsers,
    loading: loading || shopsLoading || plansLoading,
    toggleShopStatus,
    updateShop,
    updateTicketStatus,
    addTicketMessage,
    fetchTicket,
    getStats,
    addLog,
    fetchTickets,
    createTicket: async (data: { subject: string, description: string, priority: string, category: string, shopId?: string }) => {
      try {
        const token = localStorage.getItem('barber_auth_token');
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const newTicket = await res.json();
          setTickets(prev => [newTicket, ...prev]);
          return newTicket;
        } else {
          const errData = await res.json();
          return { error: errData.message || errData.details || errData.error || 'Erro ao criar chamado na API' };
        }
      } catch (error: any) {
        console.error('Error creating ticket:', error);
        return { error: error.message || 'Erro de conexão' };
      }
    }
  };
}
