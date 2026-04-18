import { useState, useEffect, useCallback } from 'react';
import type { SupportTicket, TicketMessage } from '@/lib/saas-types';

export function useTickets(shopId?: string) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('barber_auth_token');
      const url = shopId ? `/api/tickets?shopId=${shopId}` : '/api/tickets';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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

  const createTicket = useCallback(async (data: { subject: string, description: string, priority?: string, category?: string, shopId?: string }) => {
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
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  }, []);

  const addMessage = useCallback(async (ticketId: string, content: string) => {
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
      console.error('Error adding message:', error);
    }
  }, []);

  const closeTicket = useCallback(async (ticketId: string) => {
    try {
      const token = localStorage.getItem('barber_auth_token');
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'closed' })
      });
      if (res.ok) {
        const updated = await res.json();
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
        return updated;
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  }, []);

  return {
    tickets,
    loading,
    fetchTickets,
    fetchTicket,
    createTicket,
    addMessage,
    closeTicket
  };
}
