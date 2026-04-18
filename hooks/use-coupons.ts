'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/saas/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const addCoupon = useCallback(async (coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/saas/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupon)
      });
      if (res.ok) {
        const newCoupon = await res.json();
        setCoupons(prev => [newCoupon, ...prev]);
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.error };
      }
    } catch (error) {
      console.error('Failed to add coupon:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }, []);

  const updateCoupon = useCallback(async (updatedCoupon: Coupon) => {
    try {
      const res = await fetch(`/api/saas/coupons/${updatedCoupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCoupon)
      });
      if (res.ok) {
        const newCoupon = await res.json();
        setCoupons(prev => prev.map(c => c.id === newCoupon.id ? newCoupon : c));
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.error || 'Erro ao atualizar cupom' };
    } catch (error) {
      console.error('Failed to update coupon:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }, []);

  const deleteCoupon = useCallback(async (couponId: string) => {
    try {
      const res = await fetch(`/api/saas/coupons/${couponId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.error || 'Erro ao excluir cupom' };
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }, []);

  return { coupons, loading, addCoupon, updateCoupon, deleteCoupon, refreshCoupons: fetchCoupons };
}
