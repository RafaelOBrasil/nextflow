'use client';

import { useState, useEffect, Suspense } from 'react';
import { useBarberData } from '@/hooks/use-barber-data';
import ShopView from '@/components/ShopView';
import InstallPWA from '@/components/InstallPWA';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Scissors } from 'lucide-react';

export default function ShopPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const { getShopBySlug, fetchShopBySlug, loading, shops } = useBarberData();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (slug) {
      fetchShopBySlug(slug);
    }
  }, [slug, fetchShopBySlug]);

  const shop = getShopBySlug(slug);

  // If we are mounted and not loading, and still no shop, it's a 404
  const isNotFound = mounted && !loading && !shop;

  if (!mounted || (loading && !shop)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Scissors className="w-10 h-10 text-neutral-900" />
        </motion.div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
        <div className="w-20 h-20 bg-neutral-100 rounded-3xl flex items-center justify-center mb-8">
          <Scissors className="text-neutral-400 w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold mb-4 tracking-tight font-sans">Barbearia não encontrada</h1>
        <p className="text-neutral-500 mb-8 max-w-md leading-relaxed">
          O link <span className="font-bold text-neutral-900">/{slug}</span> ainda não foi reservado por nenhuma barbearia. 
          Deseja criar sua conta agora?
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => router.push(`/register?slug=${slug}`)}
            className="bg-neutral-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
          >
            Cadastrar esta Barbearia
          </button>
          <button 
            onClick={() => router.push('/')}
            className="bg-white text-neutral-900 border border-neutral-200 px-8 py-4 rounded-2xl font-bold hover:bg-neutral-50 transition-all active:scale-95"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Scissors className="w-10 h-10 text-neutral-900" />
        </motion.div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Scissors className="animate-spin" /></div>}>
      <ShopView shop={shop} />
      <InstallPWA />
    </Suspense>
  );
}
