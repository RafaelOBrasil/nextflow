'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CreditCard, RefreshCw, X } from 'lucide-react';

interface PlanStatus {
  isExpired: boolean;
  limitReached: boolean;
  currentAppointments: number;
  maxAppointments: number | null;
  daysRemaining: number;
}

export default function PlanNotification({ shopId }: { shopId: string }) {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'expired' | 'limit' | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/plan-status?shopId=${shopId}`);
        const data = await res.json();
        setStatus(data);

        if (data.isExpired) {
          setPopupType('expired');
          setShowPopup(true);
        } else if (data.limitReached) {
          setPopupType('limit');
          setShowPopup(true);
        }
      } catch (error) {
        console.error('Failed to fetch plan status', error);
      }
    };

    if (shopId) {
      fetchStatus();
    }
  }, [shopId]);

  if (!showPopup || !popupType) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-zinc-200 dark:border-zinc-800"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-full ${popupType === 'expired' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                <AlertCircle size={28} />
              </div>
              <button 
                onClick={() => setShowPopup(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              {popupType === 'expired' ? 'Plano Expirado' : 'Limite Atingido'}
            </h3>
            
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {popupType === 'expired' 
                ? 'Seu plano expirou. Renove para continuar utilizando o sistema.' 
                : 'Você atingiu o limite de agendamentos do seu plano.'}
            </p>

            <div className="flex flex-col gap-3">
              {popupType === 'expired' ? (
                <button 
                  onClick={() => window.location.href = '/billing'}
                  className="w-full py-3 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <RefreshCw size={18} />
                  Renovar assinatura
                </button>
              ) : (
                <button 
                  onClick={() => window.location.href = '/billing'}
                  className="w-full py-3 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <CreditCard size={18} />
                  Trocar de plano
                </button>
              )}
              
              <button 
                onClick={() => setShowPopup(false)}
                className="w-full py-3 px-4 bg-transparent text-zinc-500 dark:text-zinc-400 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Lembrar mais tarde
              </button>
            </div>
          </div>
          
          {status && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-wider font-bold">
                <span>Status Atual</span>
                <span>{status.currentAppointments} / {status.maxAppointments || '∞'}</span>
              </div>
              <div className="mt-2 w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${popupType === 'expired' ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, (status.currentAppointments / (status.maxAppointments || 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
