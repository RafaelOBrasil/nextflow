'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { BarberShop, Appointment } from '@/lib/types';

interface BarberContextType {
  shops: BarberShop[];
  loading: boolean;
  addShop: (shop: BarberShop) => Promise<void>;
  updateShop: (slug: string, updates: Partial<BarberShop>) => Promise<BarberShop>;
  addAppointment: (slug: string, appointment: Appointment) => Promise<Appointment>;
  updateAppointmentStatus: (slug: string, appointmentId: string, status: Appointment['status']) => Promise<void>;
  addReview: (slug: string, review: any) => Promise<any>;
  getShopBySlug: (slug: string) => BarberShop | undefined;
  fetchShopBySlug: (slug: string, silent?: boolean) => Promise<BarberShop | null>;
  fetchShops: (force?: boolean) => Promise<void>;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

export function BarberProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<BarberShop[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchedRef = React.useRef(false);

  const fetchShops = useCallback(async (force?: boolean) => {
    if (fetchedRef.current && !force) return;
    try {
      setLoading(true);
      fetchedRef.current = true;
      let token = typeof window !== 'undefined' ? localStorage.getItem('saas_admin_token') : null;
      if (!token) token = typeof window !== 'undefined' ? localStorage.getItem('barber_auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/shops', { cache: 'no-store', headers });
      if (res.ok) {
        const data = await res.json();
        setShops(data);
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Removed automatic fetchShops to improve performance and scalability.
  // Each page should now fetch only the data it needs.
  
  const shopsRef = React.useRef(shops);
  useEffect(() => {
    shopsRef.current = shops;
  }, [shops]);

  const fetchShopBySlug = useCallback(async (slug: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      let token = typeof window !== 'undefined' ? localStorage.getItem('saas_admin_token') : null;
      if (!token) token = typeof window !== 'undefined' ? localStorage.getItem('barber_auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/shops/${slug}`, { 
        cache: 'no-store',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setShops(prev => {
          const exists = prev.find(s => s.slug === slug);
          if (exists) {
            return prev.map(s => s.slug === slug ? data : s);
          }
          return [...prev, data];
        });
        
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch shop:', error);
    } finally {
      if (!silent) setLoading(false);
    }
    return null;
  }, []);

  const addShop = useCallback(async (shop: BarberShop) => {
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shop)
      });
      if (res.ok) {
        const newShop = await res.json();
        setShops(prev => [...prev, newShop]);
        return newShop;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao criar barbearia');
      }
    } catch (error) {
      console.error('Failed to add shop:', error);
      throw error;
    }
  }, []);

  const updateShop = useCallback(async (slug: string, updates: Partial<BarberShop>) => {
    try {
      let token = typeof window !== 'undefined' ? localStorage.getItem('saas_admin_token') : null;
      if (!token) token = typeof window !== 'undefined' ? localStorage.getItem('barber_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/shops/${slug}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedShop = await res.json();
        setShops(prev => prev.map(s => s.slug === slug ? updatedShop : s));
        return updatedShop;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update shop');
      }
    } catch (error) {
      console.error('Failed to update shop:', error);
      throw error;
    }
  }, []);

  const addAppointment = useCallback(async (slug: string, appointment: Appointment) => {
    try {
      const res = await fetch(`/api/shops/${slug}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment)
      });
      if (res.ok) {
        const newAppointment = await res.json();
        setShops(prev => prev.map(s => {
          if (s.slug === slug) {
            if (s.appointments?.some(a => a.id === newAppointment.id)) return s;
            return { ...s, appointments: [...(s.appointments || []), newAppointment] };
          }
          return s;
        }));
        
        return newAppointment;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add appointment');
      }
    } catch (error) {
      console.error('Failed to add appointment:', error);
      throw error;
    }
  }, []);

  const updateAppointmentStatus = useCallback(async (slug: string, appointmentId: string, status: Appointment['status']) => {
    try {
      const res = await fetch(`/api/shops/${slug}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updatedAppointment = await res.json();
        setShops(prev => prev.map(s => {
          if (s.slug === slug) {
            return {
              ...s,
              appointments: s.appointments?.map(a => a.id === appointmentId ? updatedAppointment : a)
            };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  }, []);

  const addReview = useCallback(async (slug: string, review: any) => {
    try {
      const res = await fetch(`/api/shops/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      if (res.ok) {
        const newReview = await res.json();
        setShops(prev => prev.map(s => {
          if (s.slug === slug) {
            return { ...s, reviews: [...(s.reviews || []), newReview] };
          }
          return s;
        }));
        return newReview;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add review');
      }
    } catch (error) {
      console.error('Failed to add review:', error);
      throw error;
    }
  }, []);

  const getShopBySlug = useCallback((slug: string) => {
    return shops.find(s => s.slug === slug);
  }, [shops]);

  return (
    <BarberContext.Provider value={{ 
      shops, 
      loading, 
      addShop, 
      updateShop, 
      addAppointment, 
      updateAppointmentStatus, 
      addReview, 
      getShopBySlug, 
      fetchShopBySlug,
      fetchShops
    }}>
      {children}
    </BarberContext.Provider>
  );
}

export function useBarberContext() {
  const context = useContext(BarberContext);
  if (context === undefined) {
    throw new Error('useBarberContext must be used within a BarberProvider');
  }
  return context;
}
