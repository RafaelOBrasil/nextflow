'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Plan, PlanFeature } from '@/lib/types';
import { ALL_FEATURES } from '@/lib/plans';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const addPlan = useCallback(async (plan: Omit<Plan, 'id'>) => {
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      if (res.ok) {
        const newPlan = await res.json();
        setPlans(prev => [...prev, newPlan]);
      }
    } catch (error) {
      console.error('Failed to add plan:', error);
    }
  }, []);

  const updatePlan = useCallback(async (updatedPlan: Plan) => {
    try {
      const res = await fetch(`/api/plans/${updatedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan)
      });
      if (res.ok) {
        const newPlan = await res.json();
        setPlans(prev => prev.map(p => p.id === newPlan.id ? newPlan : p));
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  }, []);

  const deletePlan = useCallback(async (planId: string) => {
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPlans(prev => prev.filter(p => p.id !== planId));
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      return { success: false, error: 'Erro de conexão ao excluir plano.' };
    }
  }, []);

  return { plans, loading, addPlan, updatePlan, deletePlan, allFeatures: ALL_FEATURES };
}

