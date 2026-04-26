'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Calendar, Shield, ArrowRight, Star, MapPin, Phone, Check, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlans } from '@/hooks/use-plans';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const { plans, allFeatures } = usePlans();
  const [mounted, setMounted] = useState(false);
  const [planType, setPlanType] = useState<'month' | 'year'>('month');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Scissors className="w-10 h-10 text-neutral-900 animate-spin" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 180 }}
              className="w-8 h-8 md:w-10 md:h-10 bg-neutral-900 rounded-lg md:rounded-xl flex items-center justify-center"
            >
              <Scissors className="text-white w-5 h-5 md:w-6 md:h-6" />
            </motion.div>
            <span className="font-bold text-lg md:text-xl tracking-tight">Next Flow Barber</span>
          </div>
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href="#features" className="hover:text-neutral-900 transition-colors">Recursos</a>
            <a href="#plans" className="hover:text-neutral-900 transition-colors">Planos</a>
            <a href="#demo" className="hover:text-neutral-900 transition-colors">Demonstração</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => router.push('/login')}
              className="text-neutral-600 hover:text-neutral-900 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all"
            >
              Entrar
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/register')}
              className="bg-neutral-900 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold hover:bg-neutral-800 transition-all shadow-md"
            >
              Começar Agora
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 md:pt-48 pb-16 md:pb-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-neutral-100 text-neutral-600 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-6">
              Gestão Inteligente para Barbearias
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-bold tracking-tight mb-6 md:mb-8 leading-[1.05]">
              Sua barbearia no <br />
              <span className="text-neutral-400 italic font-serif">próximo nível</span>
            </h1>
            <p className="text-base md:text-xl text-neutral-500 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Agendamentos online, gestão de barbeiros e controle total do seu negócio em uma única plataforma elegante e intuitiva.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/register')}
                className="w-full sm:w-auto bg-neutral-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-900/20 flex items-center justify-center gap-2"
              >
                Começar Gratuitamente <ArrowRight className="w-5 h-5" />
              </motion.button>
              <button 
                onClick={() => {
                  const el = document.getElementById('demo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
              >
                Ver Demonstração
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {[
              { icon: Calendar, title: "Agendamento 24/7", desc: "Seus clientes podem marcar horários a qualquer momento, sem precisar ligar ou enviar mensagens." },
              { icon: Shield, title: "Painel de Gestão", desc: "Controle total sobre seus serviços, barbeiros e horários em um painel administrativo completo." },
              { icon: Star, title: "Link Personalizado", desc: "Tenha um endereço exclusivo para sua barbearia (ex: nextflowbarber.com/sua-barbearia)." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                className="p-8 md:p-10 rounded-[2.5rem] border border-neutral-100 bg-neutral-50/30 hover:bg-neutral-50 transition-all group"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="text-neutral-900 w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{feature.title}</h3>
                <p className="text-sm md:text-base text-neutral-500 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-20 md:py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Planos simples
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-neutral-500 text-base md:text-xl max-w-2xl mx-auto mb-10"
            >
              Escolha o plano ideal para o momento da sua barbearia. Comece gratuitamente e evolua conforme seu negócio cresce.
            </motion.p>
            
            {/* Plan Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-bold ${planType === 'month' ? 'text-neutral-900' : 'text-neutral-400'}`}>Mensal</span>
              <button 
                onClick={() => setPlanType(planType === 'month' ? 'year' : 'month')}
                className="w-14 h-7 bg-neutral-200 rounded-full relative p-1 transition-colors hover:bg-neutral-300"
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${planType === 'year' ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${planType === 'year' ? 'text-neutral-900' : 'text-neutral-400'}`}>Anual</span>
                <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Economize 20%</span>
              </div>
            </div>
          </div>

          <div className="mb-20">
            <motion.div 
              key={planType}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto"
            >
              {plans.filter(p => p.interval === planType).map((plan) => (
                <motion.div 
                  key={plan.id}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className={`bg-white rounded-[2.5rem] p-8 md:p-10 border-2 relative flex flex-col w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)] max-w-md ${
                    plan.isPopular ? 'border-amber-500 shadow-2xl shadow-amber-500/10' : 'border-neutral-100 shadow-xl'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-1.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-lg">
                      <Crown className="w-4 h-4" />
                      Mais Popular
                    </div>
                  )}

                  <div className="mb-8 md:mb-10">
                    <h3 className="text-2xl md:text-3xl font-bold mb-3">{plan.name}</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl md:text-5xl font-bold">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                      </span>
                      {plan.price !== 0 && (
                        <span className="text-neutral-500 text-base font-medium">/{planType === 'month' ? 'mês' : 'ano'}</span>
                      )}
                    </div>
                    <p className="text-neutral-500 text-sm mt-3 font-medium">
                      {plan.maxAppointments === null 
                        ? 'Agendamentos ilimitados' 
                        : `Até ${plan.maxAppointments} agendamentos por mês`}
                    </p>
                  </div>

                  <div className="space-y-4 md:space-y-5 mb-10 md:mb-12 grow">
                    {allFeatures.map((feature) => {
                      const hasFeature = plan.features.includes(feature.key);
                      return (
                        <div key={feature.id} className="flex items-start gap-3.5">
                          <div className={`mt-1 rounded-full p-0.5 ${hasFeature ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}>
                            <Check className="w-4 h-4" />
                          </div>
                          <span className={`text-base md:text-lg ${hasFeature ? 'text-neutral-900 font-medium' : 'text-neutral-400 line-through'}`}>
                            {feature.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/register?planId=${plan.id}`)}
                    className={`w-full py-4 md:py-5 rounded-2xl font-bold transition-all text-base md:text-lg ${
                      plan.isPopular
                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg'
                    }`}
                  >
                    Começar Agora
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 md:py-40 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-neutral-900 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col md:flex-row items-stretch"
          >
            <div className="p-10 md:p-24 flex-1 flex flex-col justify-center">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                Veja como fica a <br />
                <span className="text-neutral-400 italic font-serif">página do seu cliente</span>
              </h2>
              <p className="text-neutral-400 text-lg md:text-xl mb-10 md:mb-12 leading-relaxed">
                Uma interface limpa, moderna e focada na conversão. Seus clientes vão amar a facilidade de agendar um corte em menos de 1 minuto.
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/rf-brasil')}
                className="bg-white text-neutral-900 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-neutral-100 transition-all flex items-center justify-center md:justify-start gap-3 w-full sm:w-auto"
              >
                Ver Demonstração <ArrowRight className="w-6 h-6" />
              </motion.button>
            </div>
            <div className="flex-1 relative min-h-100 md:min-h-full bg-neutral-800">
              <Image 
                src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop" 
                alt="Barber Shop Demo"
                fill
                className="object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-neutral-900 via-transparent to-transparent md:bg-linear-to-l" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-neutral-200 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
                <Scissors className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight">Next Flow Barber</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm font-bold uppercase tracking-widest text-neutral-400">
              <a href="#features" className="hover:text-neutral-900 transition-colors">Recursos</a>
              <a href="#plans" className="hover:text-neutral-900 transition-colors">Planos</a>
              <a href="#demo" className="hover:text-neutral-900 transition-colors">Demonstração</a>
              <button onClick={() => router.push('/login')} className="hover:text-neutral-900 transition-colors">Entrar</button>
            </nav>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-8 border-t border-neutral-100">
            <p className="text-neutral-500 text-sm font-medium text-center md:text-left">
              © 2024 Next Flow Barber. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/admin/saas')}
                className="text-neutral-300 hover:text-neutral-900 transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                Painel Admin
              </button>
              <div className="h-4 w-px bg-neutral-200" />
              <div className="flex items-center gap-6 text-neutral-400">
                <a href="#" title="Avaliações" className="hover:text-neutral-900 transition-colors"><Star className="w-5 h-5" /></a>
                <a href="#" title="Localização" className="hover:text-neutral-900 transition-colors"><MapPin className="w-5 h-5" /></a>
                <a href="#" title="Telefone" className="hover:text-neutral-900 transition-colors"><Phone className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
