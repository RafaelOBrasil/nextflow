'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Calendar, Clock, MapPin, Phone, ChevronRight, CheckCircle2, User, Star, ShieldAlert, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { BarberShop, Service, Barber, Appointment, Review } from '@/lib/types';
import { usePlans } from '@/hooks/use-plans';
import { useBarberData } from '@/hooks/use-barber-data';
import { useSearchParams } from 'next/navigation';

interface ShopViewProps {
  shop: BarberShop;
}

export default function ShopView({ shop }: ShopViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addAppointment, addReview } = useBarberData();
  const { plans } = usePlans();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginStep, setLoginStep] = useState<'phone' | 'name'>('phone');
  const [activeTab, setActiveTab] = useState<'services' | 'appointments'>('services');
  const [appointmentFilter, setAppointmentFilter] = useState<'open' | 'completed'>('open');
  const [recentShops, setRecentShops] = useState<{name: string, slug: string}[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAppointmentId, setReviewAppointmentId] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  
  // Load user and recent shops from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const reviewId = searchParams?.get('review');
    if (reviewId) {
      // Check if this appointment exists and is completed
      const apt = (shop.appointments || []).find(a => a.id === reviewId);
      if (apt && apt.status === 'completed') {
        setReviewAppointmentId(reviewId);
        setShowReviewModal(true);
      }
    }

    const savedUser = localStorage.getItem('barber_customer_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.name && parsed.phone) {
          setCustomerInfo(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Error parsing saved user');
      }
    }

    const savedRecent = localStorage.getItem('barber_recent_shops');
    if (savedRecent) {
      try {
        setRecentShops(JSON.parse(savedRecent));
      } catch (e) {
        console.error('Error parsing recent shops');
      }
    }
  }, [shop.slug, searchParams, shop.appointments]);

  const approvedReviews = (shop.reviews || []).filter(r => r.status === 'approved_for_display');

  useEffect(() => {
    if (approvedReviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentReviewIndex(prev => (prev + 1) % approvedReviews.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [approvedReviews.length]);

  const saveToRecentShops = () => {
    const updatedRecent = [
      { name: shop.name, slug: shop.slug },
      ...recentShops.filter(s => s.slug !== shop.slug)
    ].slice(0, 5); // Keep last 5
    
    setRecentShops(updatedRecent);
    localStorage.setItem('barber_recent_shops', JSON.stringify(updatedRecent));
  };

  const handleLogin = () => {
    if (customerInfo.name && customerInfo.phone) {
      localStorage.setItem('barber_customer_user', JSON.stringify(customerInfo));
      setIsLoggedIn(true);
      saveToRecentShops();
    }
  };

  const checkPhoneAndContinue = () => {
    if (!customerInfo.phone) return;
    
    // Check if phone exists in shop appointments
    const existingAppointment = (shop.appointments || []).find(apt => 
      apt.customerPhone.replace(/\D/g, '') === customerInfo.phone.replace(/\D/g, '')
    );

    if (existingAppointment) {
      setCustomerInfo(prev => ({ ...prev, name: existingAppointment.customerName }));
      localStorage.setItem('barber_customer_user', JSON.stringify({
        name: existingAppointment.customerName,
        phone: customerInfo.phone
      }));
      setIsLoggedIn(true);
      saveToRecentShops();
    } else {
      setLoginStep('name');
    }
  };

  useEffect(() => {
    console.log('Shop appointments updated:', shop.appointments?.length);
  }, [shop.appointments]);

  if (!shop || !shop.services || !shop.barbers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-neutral-500">Dados da barbearia incompletos.</p>
      </div>
    );
  }

  if (shop.status === 'blocked') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="text-rose-600 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Acesso Suspenso</h2>
        <p className="text-neutral-500 max-w-md">
          Esta barbearia está temporariamente indisponível. Por favor, entre em contato com o estabelecimento para mais informações.
        </p>
      </div>
    );
  }

  if (shop.status === 'expired') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
        <div className="w-24 h-24 bg-neutral-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
          <Clock className="text-neutral-300 w-12 h-12" />
        </div>
        <h2 className="text-4xl font-bold mb-4 tracking-tight">Sistema em Manutenção</h2>
        <p className="text-neutral-500 max-w-md leading-relaxed text-lg">
          Estamos realizando atualizações periódicas em nosso sistema para melhor atendê-lo. 
          Por favor, tente novamente em alguns instantes ou entre em contato diretamente com o estabelecimento.
        </p>
        <div className="mt-12 flex items-center gap-2 text-neutral-300">
          <Scissors className="w-5 h-5" />
          <span className="font-bold tracking-widest text-xs uppercase">Next Flow Barber</span>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === shop.planId) || plans[0];
  const currentMonthAppointments = (shop.appointments || []).filter(apt => {
    const aptDate = new Date(apt.date);
    const now = new Date();
    return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
  }).length;

  const handleBooking = () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !customerInfo.name) return;

    if (currentPlan.maxAppointments !== null && currentMonthAppointments >= currentPlan.maxAppointments) {
      alert('Esta barbearia atingiu o limite de agendamentos para este mês. Por favor, tente novamente no próximo mês ou entre em contato diretamente.');
      return;
    }

    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      shopId: shop.id,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      serviceId: selectedService.id,
      barberId: selectedBarber.id,
      date: selectedDate,
      time: selectedTime,
      status: 'pending'
    };

    addAppointment(shop.slug, newAppointment);
    saveToRecentShops();
    setIsSuccess(true);
  };

  const handleReviewSubmit = () => {
    if (!reviewAppointmentId || !reviewComment.trim()) return;
    
    const apt = (shop.appointments || []).find(a => a.id === reviewAppointmentId);
    if (!apt) return;

    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      appointmentId: reviewAppointmentId,
      customerName: apt.customerName,
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toISOString(),
      status: 'pending'
    };

    addReview(shop.slug, newReview);
    setShowReviewModal(false);
    router.push(`/${shop.slug}`);
  };

  const myAppointments = (shop.appointments || []).filter(apt => 
    apt.customerPhone.replace(/\D/g, '') === customerInfo.phone.replace(/\D/g, '')
  );

  const openAppointments = myAppointments.filter(apt => ['pending', 'confirmed'].includes(apt.status));
  const completedAppointments = myAppointments.filter(apt => ['completed', 'cancelled'].includes(apt.status));

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-emerald-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Agendamento Realizado!</h2>
          <p className="text-neutral-500 mb-8">
            Seu horário foi reservado com sucesso. Em breve você receberá uma confirmação.
          </p>
          <div className="bg-neutral-50 p-6 rounded-3xl text-left mb-8 border border-neutral-100">
            <div className="flex justify-between mb-2">
              <span className="text-neutral-400 text-sm">Serviço:</span>
              <span className="font-semibold">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-neutral-400 text-sm">Barbeiro:</span>
              <span className="font-semibold">{selectedBarber?.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-neutral-400 text-sm">Data:</span>
              <span className="font-semibold">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400 text-sm">Horário:</span>
              <span className="font-semibold">{selectedTime}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsSuccess(false);
              setStep(1);
              setSelectedService(null);
              setSelectedBarber(null);
              setSelectedDate('');
              setSelectedTime('');
              setActiveTab('appointments');
            }}
            className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all active:scale-95"
          >
            Ver Meus Agendamentos
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pb-20">
      {/* Banner */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img 
          src={shop.banner || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop'} 
          alt={shop.name}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
      </div>

      {/* Shop Info */}
      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-neutral-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {shop.logo && (
                <div className="w-20 h-20 bg-white rounded-3xl p-1 shadow-lg border border-neutral-100 mb-6 overflow-hidden -mt-16 relative z-20">
                  <img src={shop.logo} alt={`${shop.name} Logo`} className="w-full h-full object-cover rounded-2xl" />
                </div>
              )}
              <h1 className="text-4xl font-bold tracking-tight mb-2">{shop.name}</h1>
              <p className="text-neutral-500 mb-4 leading-relaxed">{shop.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {shop.address}
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" /> {shop.phone}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-full border border-neutral-100">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold">
                {shop.reviews && shop.reviews.length > 0 
                  ? (shop.reviews.reduce((acc, r) => acc + r.rating, 0) / shop.reviews.length).toFixed(1)
                  : '5.0'}
              </span>
              <span className="text-neutral-400 text-xs">({shop.reviews?.length || 0} avaliações)</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-2xl font-bold transition-all text-sm md:text-base ${activeTab === 'services' ? 'bg-neutral-900 text-white shadow-lg' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
          >
            <Scissors className="w-4 h-4 md:w-5 md:h-5" /> Serviços
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-2xl font-bold transition-all text-sm md:text-base ${activeTab === 'appointments' ? 'bg-neutral-900 text-white shadow-lg' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
          >
            <Calendar className="w-4 h-4 md:w-5 md:h-5" /> Meus Agendamentos
          </button>
        </div>

        {activeTab === 'services' ? (
          <>
            {!isLoggedIn ? (
              <div className="space-y-8">
                {/* Login Form Integrated */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-xl space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2 tracking-tight">Identifique-se para agendar</h2>
                    <p className="text-neutral-500 text-sm">Acesse seus agendamentos e reserve novos horários</p>
                  </div>

                  <AnimatePresence mode="wait">
                    {loginStep === 'phone' ? (
                      <motion.div 
                        key="phone-step"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-neutral-500 ml-1">WhatsApp</label>
                          <input 
                            type="tel" 
                            placeholder="(00) 00000-0000"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                            className="w-full px-5 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                          />
                        </div>
                        <button 
                          onClick={checkPhoneAndContinue}
                          disabled={!customerInfo.phone}
                          className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                          Continuar
                        </button>

                        {recentShops.length > 0 && (
                          <div className="pt-6 border-t border-neutral-100">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Barbearias Recentes</span>
                            <div className="space-y-2">
                              {recentShops.map((s) => (
                                <button
                                  key={s.slug}
                                  onClick={() => window.location.href = `/${s.slug}`}
                                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all text-left"
                                >
                                  <span className="text-sm font-semibold">{s.name}</span>
                                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="name-step"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-neutral-500 ml-1">Seu Nome</label>
                          <input 
                            type="text" 
                            placeholder="Como devemos te chamar?"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            className="w-full px-5 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                          />
                        </div>
                        <button 
                          onClick={handleLogin}
                          disabled={!customerInfo.name}
                          className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                          Acessar Agendamento
                        </button>
                        <button 
                          onClick={() => setLoginStep('phone')}
                          className="w-full text-neutral-400 text-xs font-bold hover:text-neutral-900 transition-all"
                        >
                          Voltar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reviews Carousel Section - Only show if NOT logged in */}
                {approvedReviews.length > 0 && (
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-neutral-100 overflow-hidden relative">
                    <h3 className="text-xl font-bold mb-6">O que dizem nossos clientes</h3>
                    <div className="relative h-[180px] md:h-[140px]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={approvedReviews[currentReviewIndex].id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="absolute inset-0 p-6 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{approvedReviews[currentReviewIndex].customerName}</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < approvedReviews[currentReviewIndex].rating ? 'text-amber-500 fill-current' : 'text-neutral-200'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-neutral-500 leading-relaxed italic">&quot;{approvedReviews[currentReviewIndex].comment}&quot;</p>
                          <p className="text-[10px] text-neutral-300 font-bold uppercase">{new Date(approvedReviews[currentReviewIndex].date).toLocaleDateString('pt-BR')}</p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    
                    {approvedReviews.length > 1 && (
                      <div className="flex justify-center gap-1.5 mt-4">
                        {approvedReviews.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentReviewIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentReviewIndex ? 'bg-neutral-900 w-4' : 'bg-neutral-200'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* User Info Box */}
                <div className="bg-neutral-50 p-4 md:p-6 rounded-[2rem] mb-8 border border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Agendando para:</p>
                    <h4 className="text-lg md:text-xl font-bold text-neutral-900">{customerInfo.name}</h4>
                    <p className="text-xs md:text-sm text-neutral-500">{customerInfo.phone}</p>
                  </div>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('barber_customer_user');
                      setIsLoggedIn(false);
                      setStep(1);
                    }}
                    className="text-[10px] text-neutral-400 font-bold hover:text-red-500 transition-all uppercase tracking-wider self-start sm:self-auto"
                  >
                    Alterar
                  </button>
                </div>

                {/* Booking Steps */}
                <div className="space-y-6">
          {/* Step 1: Services */}
          <div className={`bg-white rounded-3xl border ${step === 1 ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-100'} p-6 transition-all`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > 1 ? 'bg-emerald-500 text-white' : 'bg-neutral-900 text-white'}`}>
                  {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                </div>
                <h3 className="text-xl font-bold">Escolha o Serviço</h3>
              </div>
              {step > 1 && (
                <button onClick={() => setStep(1)} className="text-neutral-400 text-sm hover:text-neutral-900 font-medium">Alterar</button>
              )}
            </div>

            {step === 1 && (
              <div className="grid gap-3">
                {shop.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className="flex items-center justify-between p-5 rounded-2xl border border-neutral-100 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left group"
                  >
                    <div>
                      <h4 className="font-bold group-hover:text-neutral-900">{service.name}</h4>
                      <p className="text-sm text-neutral-400">{service.duration} min</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg">R$ {service.price}</span>
                      <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-900" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            {step > 1 && selectedService && (
              <div className="flex items-center justify-between px-2">
                <span className="font-medium text-neutral-600">{selectedService.name}</span>
                <span className="font-bold">R$ {selectedService.price}</span>
              </div>
            )}
          </div>

          {/* Step 2: Barber */}
          <div className={`bg-white rounded-3xl border ${step === 2 ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-100'} p-6 transition-all`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > 2 ? 'bg-emerald-500 text-white' : step < 2 ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-900 text-white'}`}>
                  {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
                </div>
                <h3 className={`text-xl font-bold ${step < 2 ? 'text-neutral-300' : ''}`}>Escolha o Barbeiro</h3>
              </div>
              {step > 2 && (
                <button onClick={() => setStep(2)} className="text-neutral-400 text-sm hover:text-neutral-900 font-medium">Alterar</button>
              )}
            </div>

            {step === 2 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {shop.barbers.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setSelectedBarber(barber);
                      setStep(3);
                    }}
                    className="p-4 md:p-5 rounded-2xl border border-neutral-100 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-center group"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden mx-auto mb-2 md:mb-3 border-2 border-transparent group-hover:border-neutral-900 transition-all">
                      <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="font-bold text-sm md:text-base">{barber.name}</h4>
                    <p className="text-[10px] md:text-xs text-neutral-400">{barber.role}</p>
                  </button>
                ))}
              </div>
            )}
            {step > 2 && selectedBarber && (
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={selectedBarber.avatar} alt={selectedBarber.name} className="w-full h-full object-cover" />
                </div>
                <span className="font-medium text-neutral-600">{selectedBarber.name}</span>
              </div>
            )}
          </div>

          {/* Step 3: Date & Time */}
          <div className={`bg-white rounded-3xl border ${step === 3 ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-100'} p-6 transition-all`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > 3 ? 'bg-emerald-500 text-white' : step < 3 ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-900 text-white'}`}>
                  {step > 3 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
                </div>
                <h3 className={`text-xl font-bold ${step < 3 ? 'text-neutral-300' : ''}`}>Data e Horário</h3>
              </div>
              {step > 3 && (
                <button onClick={() => setStep(3)} className="text-neutral-400 text-sm hover:text-neutral-900 font-medium">Alterar</button>
              )}
            </div>

            {step === 3 && mounted && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                    const dayNum = date.getDate();
                    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                    
                    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const dayKey = dayKeys[date.getDay()];
                    const hours = (shop.openingHours || {})[dayKey];
                    const isClosed = hours?.closed;

                    return (
                      <button
                        key={dateStr}
                        disabled={isClosed}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center ${
                          selectedDate === dateStr 
                            ? 'bg-neutral-900 border-neutral-900 text-white shadow-lg' 
                            : isClosed 
                              ? 'bg-neutral-50 border-neutral-100 text-neutral-300 cursor-not-allowed'
                              : 'border-neutral-100 hover:border-neutral-900'
                        }`}
                      >
                        <span className="capitalize">{dayName}</span>
                        <span className="text-[10px] font-normal opacity-60">{dayNum} {monthName}</span>
                        {isClosed && <span className="text-[8px] mt-1 uppercase">Fechado</span>}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {(() => {
                      const date = new Date(selectedDate + 'T00:00:00');
                      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                      const dayKey = dayKeys[date.getDay()];
                      const hours = (shop.openingHours || {})[dayKey];
                      
                      if (!hours || hours.closed) return null;

                      const slots: string[] = [];
                      let current = hours.open;
                      const end = hours.close;

                      const [endH, endM] = end.split(':').map(Number);
                      
                      while (true) {
                        const [currH, currM] = current.split(':').map(Number);
                        if (currH > endH || (currH === endH && currM >= endM)) break;
                        
                        // Check if it's today and the time has already passed
                        const now = new Date();
                        const todayStr = now.toISOString().split('T')[0];
                        if (selectedDate === todayStr) {
                          const currentHour = now.getHours();
                          const currentMin = now.getMinutes();
                          if (currH < currentHour || (currH === currentHour && currM <= currentMin)) {
                            // Skip past times
                            const nextM = currM + 30;
                            const nextH = currH + Math.floor(nextM / 60);
                            current = `${nextH.toString().padStart(2, '0')}:${(nextM % 60).toString().padStart(2, '0')}`;
                            continue;
                          }
                        }

                        slots.push(current);
                        const nextM = currM + 30;
                        const nextH = currH + Math.floor(nextM / 60);
                        current = `${nextH.toString().padStart(2, '0')}:${(nextM % 60).toString().padStart(2, '0')}`;
                      }

                      if (slots.length === 0) {
                        return <p className="col-span-full text-center py-4 text-neutral-400 text-sm italic">Não há horários disponíveis para este dia.</p>;
                      }

                      return slots.map((time) => (
                        <button
                          key={time}
                          onClick={() => {
                            setSelectedTime(time);
                            setStep(4);
                          }}
                          className={`py-3 rounded-xl border text-sm font-bold transition-all ${selectedTime === time ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-100 hover:border-neutral-900'}`}
                        >
                          {time}
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}
            {step > 3 && selectedDate && selectedTime && (
              <div className="flex items-center gap-6 px-2 text-neutral-600">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Calendar className="w-4 h-4" /> {selectedDate}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="w-4 h-4" /> {selectedTime}
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Confirmation */}
          <div className={`bg-white rounded-3xl border ${step === 4 ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-100'} p-6 transition-all`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step < 4 ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-900 text-white'}`}>
                4
              </div>
              <h3 className={`text-xl font-bold ${step < 4 ? 'text-neutral-300' : ''}`}>Seus Dados</h3>
            </div>

            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 text-sm">Cliente:</span>
                    <span className="font-bold">{customerInfo.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 text-sm">WhatsApp:</span>
                    <span className="font-bold">{customerInfo.phone}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleBooking}
                  className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                >
                  Finalizar Agendamento
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    )}
  </>
) : (
    <div className="space-y-6">
            {!isLoggedIn ? (
              <div className="bg-white rounded-[2.5rem] p-12 text-center border border-neutral-100 shadow-xl">
                <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-neutral-900/20">
                  <Scissors className="text-white w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2 tracking-tight">Acesse seus agendamentos</h2>
                <p className="text-neutral-500 mb-8">Identifique-se na aba &quot;Serviços&quot; para visualizar seu histórico</p>
                <button 
                  onClick={() => setActiveTab('services')}
                  className="bg-neutral-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all"
                >
                  Ir para Identificação
                </button>
              </div>
            ) : (
              <>
                {/* Appointment Sub-tabs */}
            <div className="flex bg-neutral-100 p-1 rounded-2xl w-full sm:w-fit mx-auto mb-8">
              <button
                onClick={() => setAppointmentFilter('open')}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${appointmentFilter === 'open' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Em Aberto ({openAppointments.length})
              </button>
              <button
                onClick={() => setAppointmentFilter('completed')}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${appointmentFilter === 'completed' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Concluídos ({completedAppointments.length})
              </button>
            </div>

            <div className="grid gap-4">
              {(appointmentFilter === 'open' ? openAppointments : completedAppointments).length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100">
                  <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="text-neutral-300 w-8 h-8" />
                  </div>
                  <p className="text-neutral-500 font-medium">Nenhum agendamento encontrado.</p>
                </div>
              ) : (
                (appointmentFilter === 'open' ? openAppointments : completedAppointments).map((apt) => {
                  const service = shop.services.find(s => s.id === apt.serviceId);
                  const barber = shop.barbers.find(b => b.id === apt.barberId);
                  
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-white">
                            <Scissors className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{service?.name || 'Serviço'}</h4>
                            <div className="flex items-center gap-3 text-sm text-neutral-500">
                              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {barber?.name}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service?.duration} min</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100">
                            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">Data e Hora</div>
                            <div className="text-sm font-bold">{new Date(apt.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {apt.time}</div>
                          </div>
                          
                          <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border ${
                            apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            apt.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            apt.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-neutral-50 text-neutral-400 border-neutral-100'
                          }`}>
                            {apt.status === 'confirmed' ? 'Confirmado' :
                             apt.status === 'pending' ? 'Pendente' :
                             apt.status === 'completed' ? 'Concluído' : 'Cancelado'}
                          </div>

                          {apt.status === 'completed' && shop.reviews && !shop.reviews.find(r => r.appointmentId === apt.id) && (
                            <button
                              onClick={() => {
                                setReviewAppointmentId(apt.id);
                                setShowReviewModal(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all"
                            >
                              <Star className="w-3 h-3" /> Avaliar
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    )}
  </div>

  <div className="max-w-xl mx-auto py-8 text-center">
        <button 
          onClick={() => router.push('/admin/saas')}
          className="text-neutral-300 hover:text-neutral-900 transition-colors text-xs font-bold uppercase tracking-widest"
          aria-label="Admin"
        >
          Painel Admin
        </button>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setShowReviewModal(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900"
              >
                <Scissors className="w-5 h-5 rotate-90" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="text-amber-500 w-8 h-8 fill-current" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Avalie seu atendimento</h2>
                <p className="text-neutral-500 text-sm">Sua opinião é muito importante para nós!</p>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 transition-transform active:scale-90"
                    >
                      <Star className={`w-10 h-10 ${star <= reviewRating ? 'text-amber-500 fill-current' : 'text-neutral-200'}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Seu comentário</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Conte como foi sua experiência..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium resize-none"
                  />
                </div>

                <button 
                  onClick={handleReviewSubmit}
                  disabled={!reviewComment.trim()}
                  className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  Enviar Avaliação <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
