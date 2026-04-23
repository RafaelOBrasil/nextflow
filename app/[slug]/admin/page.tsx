'use client';

import { useState, useEffect } from 'react';
import { useBarberData } from '@/hooks/use-barber-data';
import {
  montarAgendaAdmin,
  gerarIntervalosLivres,
  gerarHorariosDisponiveisDinamico,
  timeToMinutes
} from '@/lib/scheduling';
import { useParams, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  Calendar,
  Users,
  Scissors,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  User,
  Phone,
  XCircle,
  MessageCircle,
  Lock,
  Mail,
  ShieldAlert,
  Star,
  Menu,
  X,
  LifeBuoy,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { BarberShop, Service, Barber, Appointment } from '@/lib/types';
import { usePlans } from '@/hooks/use-plans';
import Link from 'next/link';
import { useTickets } from '@/hooks/use-tickets';
import SupportCenter from '@/components/Support/SupportCenter';

export default function AdminPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const { getShopBySlug, fetchShopBySlug, updateShop, shops, loading, updateAppointmentStatus, addAppointment } = useBarberData();
  const { plans } = usePlans();
  const shopInstance = getShopBySlug(slug);
  const { tickets, loading: ticketsLoading, createTicket, addMessage, closeTicket, fetchTicket } = useTickets(shopInstance?.id);
  const router = useRouter();
  const [shop, setShop] = useState<BarberShop | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'barbers' | 'settings' | 'reviews' | 'support'>('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'hours' | 'admin'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shopLoading, setShopLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState<'pending_confirmed' | 'completed' | 'cancelled'>('pending_confirmed');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [adminBookingData, setAdminBookingData] = useState({
    customerName: '',
    customerPhone: '',
    serviceId: '',
    barberId: '',
    date: new Date().toISOString().split('T')[0],
    time: ''
  });
  const [isBookingManual, setIsBookingManual] = useState(false);

  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setMounted(true);
    // Check if already logged in for this shop
    const session = localStorage.getItem(`admin_session_${slug}`);
    if (session === 'true') {
      setIsLoggedIn(true);
    } else {
      // Check for login flag from subscription redirect
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('login') === 'true') {
        setIsLoggedIn(true);
        localStorage.setItem(`admin_session_${slug}`, 'true');
      }
    }
  }, [slug]);

  useEffect(() => {
    if (mounted && shops.length > 0) {
      const updatedShop = getShopBySlug(slug);
      if (updatedShop) {
        setShop(updatedShop);
      }
    }
  }, [shops, slug, mounted, getShopBySlug]);

  useEffect(() => {
    let isMounted = true;

    const loadShop = async () => {
      if (!mounted) return;

      setShopLoading(true);
      let found: BarberShop | null | undefined = getShopBySlug(slug);

      if (!found) {
        found = await fetchShopBySlug(slug);
      }

      if (isMounted && found) {
        setShop(found);
        if (found.status === 'expired') {
          setShowExpiredModal(true);
        }
        if (found.adminEmail) {
          setEmail(prev => prev || found.adminEmail!);
        }
      }
      if (isMounted) {
        setShopLoading(false);
      }
    };

    loadShop();

    return () => {
      isMounted = false;
    };
  }, [slug, mounted, getShopBySlug, fetchShopBySlug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();

        // Check if user is SAAS_ADMIN or the admin for this specific shop
        const isSaasAdmin = data.user.role === 'SAAS_ADMIN';
        const isShopAdmin = data.user.shop?.slug === slug;

        if (isSaasAdmin || isShopAdmin) {
          setIsLoggedIn(true);
          localStorage.setItem(`admin_session_${slug}`, 'true');
          localStorage.setItem(`admin_token_${slug}`, data.token);
          localStorage.setItem('barber_auth_token', data.token); // Standardized token
          setLoginError('');
        } else {
          setLoginError('Você não tem permissão para acessar esta barbearia.');
        }
      } else {
        const data = await res.json();
        setLoginError(data.error || 'E-mail ou senha incorretos.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Erro ao conectar com o servidor.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(`admin_session_${slug}`);
  };

  const currentPlan = shop ? (plans.find(p => p.id === shop.planId) || plans[0]) : null;

  const hasFeature = (featureKey: string) => {
    if (!currentPlan) return false;
    return currentPlan.features.includes(featureKey);
  };

  const safeAppointments = shop?.appointments || [];
  const safeServices = shop?.services || [];
  const safeBarbers = shop?.barbers || [];
  const safeReviews = shop?.reviews || [];


  const handleSave = async () => {
    if (!shop) return;
    setIsSaving(true);
    await updateShop(slug, shop);

    // Clear password field after saving for security
    setShop(prev => prev ? { ...prev, adminPassword: '' } : null);

    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'banner' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setShop(prev => prev ? { ...prev, [field]: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendWhatsAppMessage = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleConfirmAppointment = (apt: Appointment) => {
    updateAppointmentStatus(slug, apt.id, 'confirmed');
    const service = shop?.services.find(s => s.id === apt.serviceId);
    const message = `Olá ${apt.customerName}! Seu agendamento para ${service?.name} no dia ${apt.date} às ${apt.time} foi CONFIRMADO. Te esperamos!`;
    sendWhatsAppMessage(apt.customerPhone, message);
  };

  const handleCompleteAppointment = (apt: Appointment) => {
    updateAppointmentStatus(slug, apt.id, 'completed');
    const service = shop?.services.find(s => s.id === apt.serviceId);
    const message = `Olá ${apt.customerName}! Seu atendimento de ${service?.name} foi finalizado. Gostaríamos de saber sua opinião! Deixe uma avaliação em: ${window.location.origin}/${slug}?review=${apt.id}`;
    sendWhatsAppMessage(apt.customerPhone, message);
  };

  const handleCancelAppointment = (apt: Appointment) => {
    updateAppointmentStatus(slug, apt.id, 'cancelled');
    const service = shop?.services.find(s => s.id === apt.serviceId);
    const message = `Olá ${apt.customerName}. Infelizmente precisamos CANCELAR seu agendamento para ${service?.name} no dia ${apt.date} às ${apt.time}. Por favor, entre em contato para reagendar.`;
    sendWhatsAppMessage(apt.customerPhone, message);
  };

  const handleContactCustomer = (apt: Appointment) => {
    const message = `Olá ${apt.customerName}! Tudo bem? Gostaria de falar sobre seu agendamento.`;
    sendWhatsAppMessage(apt.customerPhone, message);
  };

  const handleAdminBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !adminBookingData.serviceId || !adminBookingData.barberId || !adminBookingData.date || !adminBookingData.time || !adminBookingData.customerName) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsBookingManual(true);
    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      shopId: shop.id,
      customerName: adminBookingData.customerName,
      customerPhone: adminBookingData.customerPhone,
      serviceId: adminBookingData.serviceId,
      barberId: adminBookingData.barberId,
      date: adminBookingData.date,
      time: adminBookingData.time,
      status: 'confirmed' // Admin bookings are confirmed by default
    };

    try {
      await addAppointment(shop.slug, newAppointment);
      setIsBookingModalOpen(false);
      setAdminBookingData({
        customerName: '',
        customerPhone: '',
        serviceId: '',
        barberId: '',
        date: new Date().toISOString().split('T')[0],
        time: ''
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error: any) {
      alert(error.message || 'Erro ao realizar agendamento.');
    } finally {
      setIsBookingManual(false);
    }
  };

  const filteredAppointments = (shop?.appointments || []).filter(apt => {
    if (appointmentFilter === 'pending_confirmed') return apt.status === 'pending' || apt.status === 'confirmed';
    if (appointmentFilter === 'completed') return apt.status === 'completed';
    if (appointmentFilter === 'cancelled') return apt.status === 'cancelled';
    return true;
  }).sort((a, b) => {
    // Sort by date and time
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return b.time.localeCompare(a.time);
  });

  const generateTimeSlots = (dateStr: string) => {
    if (!shop || !shop.openingHours) return [];

    const date = new Date(dateStr + 'T00:00:00');
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[date.getDay()];
    const hours = (shop.openingHours || {})[dayKey];

    if (!hours || hours.closed) return [];

    const slots: string[] = [];
    let current = hours.open;
    const end = hours.close;
    const [endH, endM] = end.split(':').map(Number);
    const interval = shop.appointmentInterval || 30;

    while (true) {
      const [currH, currM] = current.split(':').map(Number);
      if (currH > endH || (currH === endH && currM >= endM)) break;
      slots.push(current);

      let nextM = currM + interval;
      let nextH = currH + Math.floor(nextM / 60);
      nextM = nextM % 60;

      current = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
    }
    return slots;
  };

  const generateAvailableTimeSlots = (dateStr: string, barberId: string) => {
    if (!shop || !shop.openingHours) return [];

    const date = new Date(dateStr + 'T00:00:00');
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[date.getDay()];
    const hours = (shop.openingHours || {})[dayKey];

    if (!hours || hours.closed) return [];

    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const minutesToTime = (m: number) => {
      const h = Math.floor(m / 60);
      const mins = m % 60;
      return `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    let currentInterval = shop.appointmentInterval || 30;
    if (shop.useDynamicInterval && adminBookingData.serviceId) {
      const selectedService = shop.services?.find(s => s.id === adminBookingData.serviceId);
      if (selectedService?.duration) {
        currentInterval = selectedService.duration;
      }
    }

    const currentDayAppointments = (shop.appointments || []).filter(
      apt => apt.date === dateStr && apt.barberId === barberId && apt.status !== 'cancelled'
    );

    const blockedIntervals = currentDayAppointments.map(apt => {
      const aptStart = timeToMinutes(apt.time);
      let aptDuration = shop.appointmentInterval || 30;
      if (shop.useDynamicInterval) {
        const aptService = shop.services?.find(s => s.id === apt.serviceId);
        if (aptService?.duration) {
          aptDuration = aptService.duration;
        }
      }
      return { start: aptStart, end: aptStart + aptDuration };
    });

    const slots: string[] = [];
    let currentM = timeToMinutes(hours.open);
    const endM = timeToMinutes(hours.close);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let skipPastM = 0;
    if (dateStr === todayStr) {
      skipPastM = now.getHours() * 60 + now.getMinutes();
    }

    while (currentM + currentInterval <= endM) {
      const slotEnd = currentM + currentInterval;
      
      const overlap = blockedIntervals.find(b => currentM < b.end && b.start < slotEnd);

      if (overlap) {
        currentM = overlap.end;
      } else {
        if (currentM >= skipPastM) {
          slots.push(minutesToTime(currentM));
        }
        currentM += currentInterval;
      }
    }

    return slots;
  };

  if (!mounted || shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50" suppressHydrationWarning>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Scissors className="w-10 h-10 text-neutral-900" />
        </motion.div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4 text-center">
        <div className="w-20 h-20 bg-neutral-100 rounded-3xl flex items-center justify-center mb-8">
          <Scissors className="text-neutral-400 w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Barbearia não encontrada</h1>
        <p className="text-neutral-500 mb-8 max-w-md leading-relaxed">
          Não foi possível encontrar o painel administrativo para esta barbearia.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-neutral-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  if (shop.status === 'blocked') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="text-rose-600 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Painel Suspenso</h2>
        <p className="text-neutral-500 max-w-md mb-8">
          O acesso administrativo para esta barbearia foi suspenso pelo administrador do sistema. Por favor, entre em contato com o suporte para regularizar sua situação.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-all"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-neutral-900/20">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Painel Administrativo</h2>
            <p className="text-neutral-500 text-sm">Acesse para gerenciar sua barbearia</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white rounded-[2rem] p-8 border border-neutral-200 shadow-xl space-y-4">
            {loginError && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold text-center">
                {loginError}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  placeholder="admin@barber.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 mt-2"
            >
              Entrar no Painel
            </button>
          </form>

          <p className="text-center mt-8 text-neutral-400 text-xs">
            Esqueceu sua senha? Entre em contato com o suporte.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-neutral-200 flex flex-col z-50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Expiration Modal */}
        <AnimatePresence>
          {showExpiredModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full relative z-10 shadow-2xl border border-neutral-100 text-center"
              >
                <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <ShieldAlert className="text-amber-600 w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Assinatura Expirada</h2>
                <p className="text-neutral-500 mb-8 leading-relaxed">
                  Sua assinatura expirou e o acesso público à sua barbearia foi temporariamente suspenso.
                  Renove seu plano agora para continuar recebendo agendamentos e gerindo seu negócio.
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/${slug}/admin/subscription`}
                    onClick={() => setShowExpiredModal(false)}
                    className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Renovar Assinatura
                  </Link>
                  <button
                    onClick={() => setShowExpiredModal(false)}
                    className="w-full bg-white text-neutral-400 py-4 rounded-2xl font-bold hover:text-neutral-900 transition-all text-sm"
                  >
                    Lembrar mais tarde
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Scissors className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">BarberFlow</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/10' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('services'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/10' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}
          >
            <Scissors className="w-5 h-5" /> Serviços
          </button>
          <button
            onClick={() => { setActiveTab('barbers'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'barbers' ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/10' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}
          >
            <Users className="w-5 h-5" /> Barbeiros
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/10' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}
          >
            <Settings className="w-5 h-5" /> Configurações
          </button>
          <button
            onClick={() => { setActiveTab('reviews'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'reviews' ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/10' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}
          >
            <MessageCircle className="w-5 h-5" /> Avaliações
          </button>
          <button
            onClick={() => { setActiveTab('support'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'support' ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/10' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}
          >
            <LifeBuoy className="w-5 h-5" /> Suporte
          </button>
          <Link
            href={`/${slug}/admin/subscription`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-amber-600 hover:bg-amber-50 transition-all mt-4"
          >
            <Star className="w-5 h-5" /> Meu Plano
          </Link>
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest hidden sm:block">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'services' && 'Gestão de Serviços'}
              {activeTab === 'barbers' && 'Equipe de Barbeiros'}
              {activeTab === 'settings' && 'Configurações da Loja'}
              {activeTab === 'reviews' && 'Avaliações dos Clientes'}
              {activeTab === 'support' && 'Suporte e Chamados'}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/${shop.slug}`);
                alert('Link copiado para a área de transferência!');
              }}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all border border-neutral-200"
            >
              <span className="hidden md:inline">Compartilhar</span> <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.open(`/${shop.slug}`, '_blank')}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all border border-neutral-200"
            >
              <span className="hidden md:inline">Ver Página</span> <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <Calendar className="text-neutral-900 w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <h3 className="text-neutral-400 text-sm font-bold mb-1">Total de Agendamentos</h3>
                    <p className="text-3xl font-bold">{shop.appointments?.length || 0}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <Scissors className="text-neutral-900 w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-neutral-400 text-sm font-bold mb-1">Serviços Ativos</h3>
                    <p className="text-3xl font-bold">{shop.services?.length || 0}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <Users className="text-neutral-900 w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-neutral-400 text-sm font-bold mb-1">Barbeiros na Equipe</h3>
                    <p className="text-3xl font-bold">{shop.barbers?.length || 0}</p>
                  </div>
                </div>

                {/* Daily Agenda View */}
                <div className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg">Agenda do Dia</h3>
                      <p className="text-xs text-neutral-400 font-medium font-mono uppercase tracking-wider">{adminBookingData.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={adminBookingData.date}
                        onChange={(e) => setAdminBookingData({ ...adminBookingData, date: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-100 font-bold text-xs focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(() => {
                      const dayAppointments = (shop?.appointments || []).filter(a => a.date === adminBookingData.date && a.status !== 'cancelled');
                      if (dayAppointments.length === 0) {
                        return <p className="col-span-full text-center py-6 text-neutral-400 font-medium italic">Nenhum agendamento para esta data.</p>;
                      }
                      
                      const agendaItems = montarAgendaAdmin(
                        dayAppointments,
                        shop?.services || [],
                        shop?.appointmentInterval || 30,
                        shop?.useDynamicInterval || false
                      );

                      return agendaItems.map(item => {
                        const barbeiro = shop?.barbers?.find(b => b.id === item.barberId)?.name || 'Todos';
                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl bg-neutral-900 border border-neutral-900 text-white shadow-md flex flex-col gap-2"
                          >
                            <div className="flex justify-between items-center pb-2 border-b border-white/10">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold font-mono">{item.inicio} - {item.fim}</span>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-1 rounded-md font-bold text-center">
                                {barbeiro.split(' ')[0]}
                              </span>
                            </div>
                            <div className="flex flex-col mt-1">
                              <span className="text-xs text-neutral-400">Cliente</span>
                              <span className="font-bold text-sm truncate" title={item.cliente}>{item.cliente || 'Sem Nome'}</span>
                            </div>
                            {item.original.serviceId && (
                              <div className="flex flex-col mt-1">
                                <span className="text-xs text-neutral-400">Serviço</span>
                                <span className="font-medium text-xs opacity-90">
                                  {shop?.services?.find(s => s.id === item.original.serviceId)?.name || 'Serviço'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Recent Appointments */}
                <div className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg">Agendamentos Recentes</h3>
                      <p className="text-xs text-neutral-400 font-medium">Gerencie o fluxo de clientes da sua barbearia</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setIsBookingModalOpen(true)}
                        className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                      >
                        <Plus className="w-4 h-4" /> Novo Agendamento
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="px-6 py-2 bg-neutral-50/50 border-b border-neutral-100 flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setAppointmentFilter('pending_confirmed')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${appointmentFilter === 'pending_confirmed' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                      Pendentes e Confirmados
                    </button>
                    <button
                      onClick={() => setAppointmentFilter('completed')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${appointmentFilter === 'completed' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                      Concluídos
                    </button>
                    <button
                      onClick={() => setAppointmentFilter('cancelled')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${appointmentFilter === 'cancelled' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                      Cancelados
                    </button>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    {filteredAppointments.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="text-neutral-200 w-8 h-8" />
                        </div>
                        <p className="text-neutral-400 font-medium">Nenhum agendamento encontrado nesta categoria.</p>
                      </div>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <div key={apt.id} className={`p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition-all ${apt.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : apt.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-400'}`}>
                              <User className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-bold text-sm md:text-base">{apt.customerName}</h4>
                                {apt.status === 'confirmed' && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Confirmado</span>}
                                {apt.status === 'cancelled' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Cancelado</span>}
                                {apt.status === 'completed' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Finalizado</span>}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs text-neutral-400 font-medium">
                                <span className="flex items-center gap-1"><Scissors className="w-3 h-3" /> {(shop.services || []).find(s => s.id === apt.serviceId)?.name}</span>
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {apt.customerPhone}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto mt-2 md:mt-0">
                            <div className="text-left md:text-right">
                              <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-neutral-900 mb-1">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-neutral-400" /> {apt.date}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-neutral-400">
                                <Clock className="w-3 h-3 md:w-4 md:h-4" /> {apt.time}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 border-l border-neutral-100 pl-4 md:pl-6">
                              {apt.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmAppointment(apt)}
                                    className="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                    title="Confirmar e avisar"
                                  >
                                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelAppointment(apt)}
                                    className="p-1.5 md:p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                                    title="Cancelar e avisar"
                                  >
                                    <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                                  </button>
                                </>
                              )}
                              {apt.status === 'confirmed' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCompleteAppointment(apt)}
                                    className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                    title="Finalizar atendimento"
                                  >
                                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelAppointment(apt)}
                                    className="p-1.5 md:p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                                    title="Cancelar e avisar"
                                  >
                                    <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                                  </button>
                                </div>
                              )}
                              {hasFeature('whatsapp_reminders') && (
                                <button
                                  onClick={() => handleContactCustomer(apt)}
                                  className="p-1.5 md:p-2 bg-neutral-100 text-neutral-600 rounded-xl hover:bg-neutral-200 transition-all"
                                  title="Entrar em contato"
                                >
                                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl md:text-2xl font-bold">Serviços</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 active:scale-95 disabled:opacity-70 disabled:scale-100"
                    >
                      {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                    </button>
                    <button
                      onClick={() => {
                        const newService: Service = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: 'Novo Serviço',
                          price: 0,
                          duration: 30
                        };
                        setShop({ ...shop, services: [...(shop.services || []), newService] });
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Serviço
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {(shop.services || []).map((service, index) => (
                    <div key={service.id} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-400 uppercase ml-1">
                              Nome do Serviço {service.active === false && <span className="text-amber-500 ml-2">(Desativado)</span>}
                            </label>
                            <input
                              type="text"
                              value={service.name}
                              onChange={(e) => {
                                const newServices = [...(shop.services || [])];
                                newServices[index].name = e.target.value;
                                setShop({ ...shop, services: newServices });
                              }}
                              className={`w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold ${service.active === false ? 'opacity-60 grayscale' : ''}`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Preço (R$)</label>
                              <input
                                type="number"
                                value={service.price}
                                onChange={(e) => {
                                  const newServices = [...(shop.services || [])];
                                  newServices[index].price = Number(e.target.value);
                                  setShop({ ...shop, services: newServices });
                                }}
                                className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Duração (min)</label>
                              <input
                                type="number"
                                value={service.duration}
                                onChange={(e) => {
                                  const newServices = [...(shop.services || [])];
                                  newServices[index].duration = Number(e.target.value);
                                  setShop({ ...shop, services: newServices });
                                }}
                                className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            const isAssociated = (shop.appointments || []).some(a => a.serviceId === service.id);
                            if (isAssociated) {
                              setShop({ ...shop, services: (shop.services || []).map(s => s.id === service.id ? { ...s, active: !s.active } : s) });
                            } else {
                              const newServices = (shop.services || []).filter(s => s.id !== service.id);
                              setShop({ ...shop, services: newServices });
                            }
                          }}
                          className={`p-3 rounded-xl transition-all ${(shop.appointments || []).some(a => a.serviceId === service.id)
                            ? service.active === false ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-red-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                          title={(shop.appointments || []).some(a => a.serviceId === service.id) ? (service.active === false ? 'Ativar serviço' : 'Desativar serviço (em uso)') : 'Excluir serviço'}
                        >
                          {(shop.appointments || []).some(a => a.serviceId === service.id)
                            ? (service.active === false ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />)
                            : <Trash2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'barbers' && (
              <motion.div
                key="barbers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl md:text-2xl font-bold">Equipe</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 active:scale-95 disabled:opacity-70 disabled:scale-100"
                    >
                      {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                    </button>
                    <button
                      onClick={() => {
                        const newBarber: Barber = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: 'Novo Barbeiro',
                          role: 'Barbeiro',
                          avatar: `https://picsum.photos/seed/${Math.random()}/200`
                        };
                        setShop({ ...shop, barbers: [...(shop.barbers || []), newBarber] });
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Barbeiro
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {(shop.barbers || []).map((barber, index) => (
                    <div key={barber.id} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex items-start gap-4">
                      <div className={`w-20 h-20 rounded-2xl overflow-hidden border border-neutral-100 flex-shrink-0 ${barber.active === false ? 'grayscale opacity-60' : ''}`}>
                        <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">Nome</label>
                            {barber.active === false && <span className="text-[10px] font-bold text-amber-500 uppercase">Desativado</span>}
                          </div>
                          <input
                            type="text"
                            value={barber.name}
                            onChange={(e) => {
                              const newBarbers = [...(shop.barbers || [])];
                              newBarbers[index].name = e.target.value;
                              setShop({ ...shop, barbers: newBarbers });
                            }}
                            className={`w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold text-lg ${barber.active === false ? 'opacity-60 grayscale' : ''}`}
                          />
                          <input
                            type="text"
                            value={barber.role}
                            onChange={(e) => {
                              const newBarbers = [...(shop.barbers || [])];
                              newBarbers[index].role = e.target.value;
                              setShop({ ...shop, barbers: newBarbers });
                            }}
                            className="w-full px-3 py-1 rounded-lg bg-transparent border-none focus:outline-none focus:bg-neutral-50 transition-all text-sm text-neutral-400 font-medium"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const isAssociated = (shop.appointments || []).some(a => a.barberId === barber.id);
                            if (isAssociated) {
                              setShop({ ...shop, barbers: (shop.barbers || []).map(b => b.id === barber.id ? { ...b, active: !b.active } : b) });
                            } else {
                              const newBarbers = (shop.barbers || []).filter(b => b.id !== barber.id);
                              setShop({ ...shop, barbers: newBarbers });
                            }
                          }}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-all ${(shop.appointments || []).some(a => a.barberId === barber.id)
                            ? barber.active === false ? 'text-emerald-500 hover:text-emerald-600' : 'text-amber-500 hover:text-amber-600'
                            : 'text-red-400 hover:text-red-500'
                            }`}
                          title={(shop.appointments || []).some(a => a.barberId === barber.id) ? (barber.active === false ? 'Ativar barbeiro' : 'Desativar barbeiro (em uso)') : 'Remover da Equipe'}
                        >
                          {(shop.appointments || []).some(a => a.barberId === barber.id)
                            ? (barber.active === false ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />)
                            : <Trash2 className="w-3.5 h-3.5" />}
                          {(shop.appointments || []).some(a => a.barberId === barber.id) ? (barber.active === false ? 'Ativar' : 'Desativar') : 'Remover da Equipe'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl md:text-2xl font-bold">Avaliações</h3>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-neutral-200 w-fit">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold">
                      {shop.reviews && shop.reviews.length > 0
                        ? (shop.reviews.reduce((acc, r) => acc + r.rating, 0) / shop.reviews.length).toFixed(1)
                        : '5.0'}
                    </span>
                    <span className="text-neutral-400 text-xs">({shop.reviews?.length || 0} total)</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  {!shop.reviews || shop.reviews.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] border border-neutral-200 text-center">
                      <MessageCircle className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                      <p className="text-neutral-400 font-medium">Nenhuma avaliação recebida ainda.</p>
                    </div>
                  ) : (
                    shop.reviews.map((review, index) => (
                      <div key={review.id} className="bg-white p-4 md:p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between gap-4 md:gap-6">
                        <div className="space-y-2 md:space-y-3 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm md:text-base">{review.customerName}</span>
                              <span className="text-[10px] md:text-xs text-neutral-400 font-medium">{new Date(review.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 md:w-4 md:h-4 ${i < review.rating ? 'text-amber-500 fill-current' : 'text-neutral-200'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-neutral-600 text-xs md:text-sm italic">&quot;{review.comment}&quot;</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                          <button
                            onClick={() => {
                              const newReviews = [...(shop.reviews || [])];
                              newReviews[index].status = 'pending';
                              setShop({ ...shop, reviews: newReviews });
                            }}
                            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${review.status === 'pending'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-900 hover:text-neutral-900'
                              }`}
                          >
                            Pendente
                          </button>
                          <button
                            onClick={() => {
                              const newReviews = [...(shop.reviews || [])];
                              newReviews[index].status = 'approved';
                              setShop({ ...shop, reviews: newReviews });
                            }}
                            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${review.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-900 hover:text-neutral-900'
                              }`}
                          >
                            Aprovado
                          </button>
                          <button
                            onClick={() => {
                              const newReviews = [...(shop.reviews || [])];
                              newReviews[index].status = 'approved_for_display';
                              setShop({ ...shop, reviews: newReviews });
                            }}
                            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${review.status === 'approved_for_display'
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : 'bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-900 hover:text-neutral-900'
                              }`}
                          >
                            Exibir no Site
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            const newReviews = shop.reviews?.filter(r => r.id !== review.id);
                            setShop({ ...shop, reviews: newReviews });
                          }}
                          className="p-1.5 md:p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-end md:self-auto"
                        >
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex bg-white p-2 rounded-2xl border border-neutral-100 shadow-sm gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveSettingsTab('general')}
                    className={`flex-1 min-w-[max-content] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      activeSettingsTab === 'general'
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    Informações Gerais
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab('hours')}
                    className={`flex-1 min-w-[max-content] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      activeSettingsTab === 'hours'
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    Horário de Funcionamento e Intervalos
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab('admin')}
                    className={`flex-1 min-w-[max-content] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      activeSettingsTab === 'admin'
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    Acesso Administrativo, Logotipo e Capa
                  </button>
                </div>

                {activeSettingsTab === 'general' && (
                <div className="bg-white p-4 md:p-8 rounded-[2rem] border border-neutral-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg md:text-xl font-bold">Informações Gerais</h3>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-900/10"
                    >
                      {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> <span className="hidden sm:inline">Salvar</span></>}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Nome da Barbearia</label>
                      <input
                        type="text"
                        value={shop.name}
                        onChange={(e) => setShop({ ...shop, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Link da Página (slug)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400 text-sm font-medium">/</span>
                        <input
                          type="text"
                          value={shop.slug}
                          onChange={(e) => setShop({ ...shop, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Descrição</label>
                    <textarea
                      value={shop.description}
                      onChange={(e) => setShop({ ...shop, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Endereço</label>
                      <input
                        type="text"
                        value={shop.address}
                        onChange={(e) => setShop({ ...shop, address: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Telefone</label>
                      <input
                        type="text"
                        value={shop.phone}
                        onChange={(e) => setShop({ ...shop, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
                )}

                {activeSettingsTab === 'hours' && (
                <div className="bg-white p-4 md:p-8 rounded-[2rem] border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg md:text-xl font-bold">Horário de Funcionamento e Intervalos</h3>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-900/10"
                      >
                        {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> <span className="hidden sm:inline">Salvar</span></>}
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Intervalo entre agendamentos (min)</label>
                        <input
                          type="number"
                          min="15"
                          step="5"
                          disabled={shop.useDynamicInterval}
                          value={shop.appointmentInterval || 30}
                          onChange={(e) => setShop({ ...shop, appointmentInterval: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium disabled:opacity-50"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <label className="flex items-center gap-2 cursor-pointer p-4 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-neutral-100">
                          <input
                            type="checkbox"
                            checked={shop.useDynamicInterval || false}
                            onChange={(e) => setShop({ ...shop, useDynamicInterval: e.target.checked })}
                            className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                          />
                          <span className="text-sm font-bold text-neutral-900">Calcular automaticamente pela duração do serviço</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(shop.openingHours || {}).map(([day, hours]) => (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-100 gap-4">
                          <div className="flex items-center gap-4 min-w-[100px]">
                            <span className="font-bold text-sm capitalize">
                              {day === 'monday' && 'Segunda'}
                              {day === 'tuesday' && 'Terça'}
                              {day === 'wednesday' && 'Quarta'}
                              {day === 'thursday' && 'Quinta'}
                              {day === 'friday' && 'Sexta'}
                              {day === 'saturday' && 'Sábado'}
                              {day === 'sunday' && 'Domingo'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
                            {!hours.closed ? (
                              <>
                                <div className="relative flex-1 min-w-[100px] max-w-[120px]">
                                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                                  <input
                                    type="time"
                                    value={hours.open}
                                    onChange={(e) => {
                                      const newHours = { ...(shop.openingHours || {}) };
                                      newHours[day].open = e.target.value;
                                      setShop({ ...shop, openingHours: newHours });
                                    }}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-bold focus:outline-none focus:border-neutral-900"
                                  />
                                </div>
                                <span className="text-neutral-400 text-xs font-bold">até</span>
                                <div className="relative flex-1 min-w-[100px] max-w-[120px]">
                                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                                  <input
                                    type="time"
                                    value={hours.close}
                                    onChange={(e) => {
                                      const newHours = { ...(shop.openingHours || {}) };
                                      newHours[day].close = e.target.value;
                                      setShop({ ...shop, openingHours: newHours });
                                    }}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-bold focus:outline-none focus:border-neutral-900"
                                  />
                                </div>
                              </>
                            ) : (
                              <span className="text-neutral-400 text-sm font-bold italic flex-1 text-center">Fechado</span>
                            )}

                            <label className="flex items-center gap-2 cursor-pointer ml-0 sm:ml-4">
                              <input
                                type="checkbox"
                                checked={hours.closed}
                                onChange={(e) => {
                                  const newHours = { ...(shop.openingHours || {}) };
                                  newHours[day].closed = e.target.checked;
                                  setShop({ ...shop, openingHours: newHours });
                                }}
                                className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                              />
                              <span className="text-xs font-bold text-neutral-500">Fechado</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'admin' && (
                  <div className="space-y-8">
                  <div className="bg-white p-4 md:p-8 rounded-[2rem] border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg md:text-xl font-bold">Acesso Administrativo</h3>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-900/10"
                      >
                        {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> <span className="hidden sm:inline">Salvar</span></>}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-400 uppercase ml-1">E-mail do Administrador</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="email"
                            value={shop.adminEmail || ''}
                            onChange={(e) => setShop({ ...shop, adminEmail: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Senha do Painel</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="password"
                            value={shop.adminPassword || ''}
                            onChange={(e) => setShop({ ...shop, adminPassword: e.target.value })}
                            placeholder="••••••••"
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400 ml-1 italic">Preencha apenas se desejar alterar a senha atual. Por segurança, a senha atual não é exibida.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm relative overflow-hidden">
                    {!hasFeature('page_customization') && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                          <Star className="text-amber-600 w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold mb-2">Funcionalidade Premium</h4>
                        <p className="text-neutral-500 text-sm mb-4 max-w-sm">
                          A personalização da página está disponível apenas no Plano Profissional.
                        </p>
                        <Link
                          href={`/${slug}/admin/subscription`}
                          className="bg-neutral-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                        >
                          Fazer Upgrade
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">Logotipo</h3>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-900/10"
                      >
                        {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> <span className="hidden sm:inline">Salvar</span></>}
                      </button>
                    </div>
                    <p className="text-neutral-400 text-xs mb-6">Recomendado: 500x500px (Máx. 5MB)</p>

                    <div className="relative h-32 w-32 rounded-[2rem] overflow-hidden border border-neutral-100 mb-4 bg-neutral-50 flex flex-col items-center justify-center mx-auto shadow-sm">
                      {shop.logo ? (
                        <img src={shop.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-neutral-300 mb-1" />
                      )}
                      <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                        <Upload className="w-6 h-6 text-white mb-1" />
                        <span className="text-white font-bold text-[10px] uppercase tracking-wider bg-black/40 px-2 py-1 rounded-full">Alterar</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!hasFeature('page_customization')}
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'logo')}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm relative overflow-hidden">
                    {!hasFeature('page_customization') && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                          <Star className="text-amber-600 w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold mb-2">Funcionalidade Premium</h4>
                        <p className="text-neutral-500 text-sm mb-4 max-w-sm">
                          A personalização da página está disponível apenas no Plano Profissional.
                        </p>
                        <Link
                          href={`/${slug}/admin/subscription`}
                          className="bg-neutral-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                        >
                          Fazer Upgrade
                        </Link>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">Imagem de Capa</h3>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-900/10"
                      >
                        {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> <span className="hidden sm:inline">Salvar</span></>}
                      </button>
                    </div>
                    <p className="text-neutral-400 text-xs mb-6">Recomendado: 1920x1080px (Máx. 5MB)</p>

                    <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-neutral-100 mb-4 bg-neutral-50 flex flex-col items-center justify-center">
                      {shop.banner ? (
                        <img src={shop.banner} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-neutral-300 mb-2" />
                      )}
                      <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                        <Upload className="w-8 h-8 text-white mb-2" />
                        <span className="text-white font-bold text-sm uppercase tracking-wider bg-black/40 px-4 py-2 rounded-full">Alterar Capa</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!hasFeature('page_customization')}
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'banner')}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'support' && (
                  <motion.div
                    key="support"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <SupportCenter
                      tickets={tickets}
                      loading={ticketsLoading}
                      onSendMessage={addMessage}
                      onCreateTicket={async (data) => {
                        return createTicket({
                          ...data,
                          shopId: data.shopId || shop?.id
                        });
                      }}
                      onFetchTicket={fetchTicket}
                      onUpdateStatus={async (id, status) => {
                        if (status === 'closed') await closeTicket(id);
                      }}
                      isAdmin={false}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
              </div>
      </main>

      {/* Manual Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full relative z-10 shadow-2xl border border-neutral-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
                    <Calendar className="text-white w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Novo Agendamento</h2>
                </div>
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdminBooking} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Cliente</label>
                    <input
                      type="text"
                      placeholder="Nome do cliente"
                      value={adminBookingData.customerName}
                      onChange={(e) => setAdminBookingData({ ...adminBookingData, customerName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Telefone</label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={adminBookingData.customerPhone}
                      onChange={(e) => setAdminBookingData({ ...adminBookingData, customerPhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Serviço</label>
                    <select
                      value={adminBookingData.serviceId}
                      onChange={(e) => setAdminBookingData({ ...adminBookingData, serviceId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold appearance-none"
                      required
                    >
                      <option value="">Selecionar...</option>
                      {shop.services.filter(s => s.active !== false).map(service => (
                        <option key={service.id} value={service.id}>{service.name} - R$ {service.price}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Barbeiro</label>
                    <select
                      value={adminBookingData.barberId}
                      onChange={(e) => setAdminBookingData({ ...adminBookingData, barberId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold appearance-none"
                      required
                    >
                      <option value="">Selecionar...</option>
                      {shop.barbers.filter(b => b.active !== false).map(barber => (
                        <option key={barber.id} value={barber.id}>{barber.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Data</label>
                    <input
                      type="date"
                      value={adminBookingData.date}
                      onChange={(e) => setAdminBookingData({ ...adminBookingData, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Horário</label>
                    <select
                      value={adminBookingData.time}
                      onChange={(e) => setAdminBookingData({ ...adminBookingData, time: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold appearance-none"
                      disabled={!adminBookingData.barberId || !adminBookingData.date}
                      required
                    >
                      <option value="">Selecionar...</option>
                      {generateAvailableTimeSlots(adminBookingData.date, adminBookingData.barberId).map(slot => {
                        return (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isBookingManual}
                    className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isBookingManual ? 'Agendando...' : 'Confirmar Agendamento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">Alterações salvas com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
