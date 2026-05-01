'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBarberData } from '@/hooks/use-barber-data';
import { usePlans } from '@/hooks/use-plans';
import { Check, ArrowLeft, Crown, Zap, ShieldCheck, Star, Info, AlertCircle, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

export default function SubscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const { getShopBySlug, updateShop } = useBarberData();
  const { plans, allFeatures } = usePlans();
  const shop = getShopBySlug(slug);
  const [loading, setLoading] = useState(false);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentPlan = useMemo(() => {
    if (!shop || !plans.length) return null;
    return plans.find(p => p.id === shop.planId);
  }, [shop, plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter(p => p.interval === interval).sort((a, b) => a.price - b.price);
  }, [plans, interval]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="text-neutral-500">Barbearia não encontrada.</p>
      </div>
    );
  }

  const handleSubscribe = async (planId: string, price: number, name: string) => {
    // Prevent downgrade from paid to free
    if (currentPlan && currentPlan.price > 0 && price === 0) {
      setToast({ message: 'Você já possui um plano pago ativo. Para voltar ao plano gratuito, entre em contato com o suporte.', type: 'error' });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    if (price === 0) {
      // Free plan, just update the shop
      await updateShop(slug, { planId: planId });
      setToast({ message: 'Plano gratuito ativado com sucesso!', type: 'success' });
      setTimeout(() => {
        setToast(null);
        router.push(`/${slug}/admin?login=true`);
      }, 2000);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          shopId: shop.id,
          slug: shop.slug,
          price,
          name,
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        window.open(data.init_point, '_blank');
      } else {
        setToast({ message: 'Erro ao iniciar pagamento. Tente novamente.', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({ message: 'Erro ao iniciar pagamento. Tente novamente.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <Link href={`/${slug}/admin`} className="p-2.5 bg-white hover:bg-neutral-100 rounded-2xl border border-neutral-200 shadow-sm transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight">Assinatura</h1>
              <p className="text-neutral-500 text-xs md:text-sm font-medium">Gerencie seu plano e recursos</p>
            </div>
          </div>
          
          {currentPlan && (
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-100 rounded-2xl">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-700">Plano {currentPlan.name} Ativo</span>
            </div>
          )}
        </div>

        {/* Current Plan Overview */}
        {currentPlan && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-neutral-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-neutral-900/20"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full -ml-10 -mb-10 blur-3xl" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  Seu Plano Atual
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-4">{currentPlan.name}</h2>
                <p className="text-neutral-400 text-lg mb-8 max-w-md">
                  Você está aproveitando o melhor da nossa plataforma. Confira seus benefícios ativos abaixo.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Status</p>
                    <p className="text-emerald-400 font-bold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Ativo
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Renovação</p>
                    <p className="font-bold">
                      {shop.subscriptions?.[0]?.currentPeriodEnd 
                        ? new Date(shop.subscriptions[0].currentPeriodEnd).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> Principais Benefícios
                </h3>
                <div className="space-y-4">
                  {allFeatures.filter(f => currentPlan.features.includes(f.key)).slice(0, 5).map((feature) => (
                    <div key={feature.id} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-neutral-300 text-sm font-medium">{feature.name}</span>
                    </div>
                  ))}
                  {currentPlan.features.length > 5 && (
                    <p className="text-neutral-500 text-xs font-bold pl-8">+ {currentPlan.features.length - 5} outros recursos</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Plan Selection */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Escolha o plano ideal para crescer</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto mb-10 font-medium">
            Selecione o plano que melhor se adapta ao tamanho da sua barbearia. 
            Economize até 20% assinando o plano anual.
          </p>
          
          {/* Interval Toggle */}
          <div className="inline-flex items-center p-1.5 bg-white rounded-[2rem] border border-neutral-200 shadow-xl mb-8">
            <button
              onClick={() => setInterval('month')}
              className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
                interval === 'month' ? 'bg-neutral-900 text-white shadow-lg' : 'text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all relative ${
                interval === 'year' ? 'bg-neutral-900 text-white shadow-lg' : 'text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              Anual
              <span className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20 animate-bounce">
                -20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <AnimatePresence mode="wait">
            {filteredPlans.map((plan, i) => {
              const previousPlan = i > 0 ? filteredPlans[i - 1] : null;
              const specificFeatures = allFeatures.filter(f => plan.features.includes(f.key));
              const isCurrentPlan = shop.planId === plan.id;
              const isUpgrade = currentPlan ? plan.price > currentPlan.price : plan.price > 0;
              const isDisabled = isCurrentPlan || (currentPlan && currentPlan.price > 0 && plan.price === 0);

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-white rounded-[3rem] p-10 border-2 flex flex-col relative transition-all duration-500 hover:translate-y-[-8px] ${
                    isCurrentPlan 
                      ? 'border-neutral-900 shadow-2xl shadow-neutral-900/10' 
                      : plan.isPopular 
                        ? 'border-amber-500 shadow-2xl shadow-amber-500/10' 
                        : 'border-neutral-100 hover:border-neutral-900/20 shadow-xl'
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                      <ShieldCheck className="w-4 h-4" />
                      Plano Ativo
                    </div>
                  )}
                  
                  {!isCurrentPlan && plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                      <Crown className="w-4 h-4" />
                      Recomendado
                    </div>
                  )}

                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-3xl font-black tracking-tight">{plan.name}</h3>
                      {plan.discount && plan.discount > 0 && (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-lg">
                          -{plan.discount}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[44px] font-black tracking-tighter">R$ {plan.price.toFixed(2)}</span>
                      <span className="text-neutral-400 text-sm font-bold uppercase tracking-widest">
                        /{plan.interval === 'month' ? 'mês' : 'ano'}
                      </span>
                    </div>
                    <p className="text-neutral-400 text-sm font-bold mt-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      {plan.maxAppointments === null 
                        ? 'Agendamentos ilimitados' 
                        : `Até ${plan.maxAppointments} agendamentos/mês`}
                    </p>
                  </div>

                  <div className="space-y-5 mb-12 flex-grow">
                    <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-2">O que está incluso</p>
                    
                    {previousPlan && (
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 rounded-full p-1 bg-neutral-900 text-white">
                          <Plus className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-neutral-900">
                            Tudo do plano {previousPlan.name}
                          </span>
                        </div>
                      </div>
                    )}

                    {specificFeatures.filter(f => !previousPlan || !previousPlan.features.includes(f.key)).map((feature) => (
                      <div key={feature.id} className="flex items-start gap-4">
                        <div className="mt-0.5 rounded-full p-1 bg-emerald-500 text-white">
                          <Check className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-neutral-900">
                            {feature.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium">{feature.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.id, plan.price, plan.name)}
                    disabled={isDisabled || loading}
                    className={`w-full py-5 rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-3 text-lg active:scale-95 ${
                      isCurrentPlan
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : isDisabled
                          ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed border border-neutral-100'
                          : isUpgrade
                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/40'
                            : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-xl shadow-neutral-900/20'
                    }`}
                  >
                    {loading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Zap className="w-5 h-5" />
                      </motion.div>
                    ) : isCurrentPlan ? (
                      'Plano Atual'
                    ) : isDisabled ? (
                      'Indisponível'
                    ) : isUpgrade ? (
                      <>
                        <Crown className="w-5 h-5" /> Fazer Upgrade
                      </>
                    ) : (
                      'Assinar Agora'
                    )}
                  </button>
                  
                  {isDisabled && !isCurrentPlan && (
                    <p className="mt-4 text-[10px] text-center text-neutral-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      <Info className="w-3.5 h-3.5" /> Downgrade via suporte
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Comparison Banner */}
        <div className="mt-20 bg-white rounded-[3rem] border border-neutral-200 p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center md:text-left">
              <h3 className="text-2xl font-black mb-4">Precisa de algo mais robusto?</h3>
              <p className="text-neutral-500 font-medium">
                Nossos planos empresariais oferecem suporte prioritário, integrações customizadas e treinamento para sua equipe.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <button className="px-8 py-4 bg-neutral-100 hover:bg-neutral-200 rounded-2xl font-bold transition-all text-sm">
                Falar com Consultor
              </button>
              <button className="px-8 py-4 bg-neutral-900 text-white hover:bg-neutral-800 rounded-2xl font-bold shadow-lg transition-all text-sm flex items-center justify-center gap-2">
                Ver Planos Enterprise <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {/* FAQ/Notice */}
        <div className="mt-12 flex items-center justify-center gap-3 text-neutral-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Todas as transações são processadas de forma segura via Mercado Pago.</p>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-white font-bold ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
