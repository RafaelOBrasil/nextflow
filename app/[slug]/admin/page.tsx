'use client';

import { useState, useEffect } from 'react';
import { useBarberData } from '@/hooks/use-barber-data';
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
  LifeBuoy
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
  const { getShopBySlug, fetchShopBySlug, updateShop, shops, loading, updateAppointmentStatus } = useBarberData();
  const { plans } = usePlans();
  const shopInstance = getShopBySlug(slug);
  const { tickets, loading: ticketsLoading, createTicket, addMessage, closeTicket, fetchTicket } = useTickets(shopInstance?.id);
  const router = useRouter();
  const [shop, setShop] = useState<BarberShop | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'barbers' | 'settings' | 'reviews' | 'support'>('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shopLoading, setShopLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  
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
    localStorage.removeItem(`admin_token_${slug}`);
    localStorage.removeItem('barber_auth_token');
    router.push(`/${slug}/admin`);
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
    const message = `Olá ${apt.customerName}, tudo bem? Estou entrando em contato sobre seu agendamento na ${shop?.name}.`;
    sendWhatsAppMessage(apt.customerPhone, message);
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50" suppressHydrationWarning>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Scissors className="w-10 h-10 text-neutral-900" />
        </motion.div>
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
              onClick={() => window.open(`/${shop.slug}`, '_blank')}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all"
            >
              <span className="hidden md:inline">Ver Página</span> <ExternalLink className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-neutral-900 text-white px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-lg shadow-neutral-900/10 active:scale-95 disabled:opacity-70 disabled:scale-100"
            >
              {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> <span className="hidden md:inline">Salvar Alterações</span></>}
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

                {/* Recent Appointments */}
                <div className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg">Agendamentos Recentes</h3>
                    <button className="text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-all">Ver todos</button>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {(shop.appointments || []).length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="text-neutral-200 w-8 h-8" />
                        </div>
                        <p className="text-neutral-400 font-medium">Nenhum agendamento realizado ainda.</p>
                      </div>
                    ) : (
                      (shop.appointments || []).map((apt) => (
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
                                <button 
                                  onClick={() => handleCompleteAppointment(apt)}
                                  className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                  title="Finalizar atendimento"
                                >
                                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
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
                    className="flex items-center justify-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Serviço
                  </button>
                </div>

                <div className="grid gap-4">
                  {(shop.services || []).map((service, index) => (
                    <div key={service.id} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Nome do Serviço</label>
                            <input 
                              type="text" 
                              value={service.name}
                              onChange={(e) => {
                                const newServices = [...(shop.services || [])];
                                newServices[index].name = e.target.value;
                                setShop({ ...shop, services: newServices });
                              }}
                              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
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
                            const newServices = (shop.services || []).filter(s => s.id !== service.id);
                            setShop({ ...shop, services: newServices });
                          }}
                          className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
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
                    className="flex items-center justify-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Barbeiro
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {(shop.barbers || []).map((barber, index) => (
                    <div key={barber.id} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex items-start gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-neutral-100 flex-shrink-0">
                        <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <input 
                            type="text" 
                            value={barber.name}
                            onChange={(e) => {
                              const newBarbers = [...(shop.barbers || [])];
                              newBarbers[index].name = e.target.value;
                              setShop({ ...shop, barbers: newBarbers });
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold text-lg"
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
                            const newBarbers = (shop.barbers || []).filter(b => b.id !== barber.id);
                            setShop({ ...shop, barbers: newBarbers });
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover da Equipe
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
                              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                review.status === 'pending' 
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
                              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                review.status === 'approved' 
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
                              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                review.status === 'approved_for_display' 
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
                <div className="bg-white p-4 md:p-8 rounded-[2rem] border border-neutral-200 shadow-sm space-y-6">
                  <h3 className="text-lg md:text-xl font-bold mb-6">Informações Gerais</h3>
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

                <div className="bg-white p-4 md:p-8 rounded-[2rem] border border-neutral-200 shadow-sm">
                  <h3 className="text-lg md:text-xl font-bold mb-6">Horário de Funcionamento</h3>
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

                <div className="bg-white p-4 md:p-8 rounded-[2rem] border border-neutral-200 shadow-sm">
                  <h3 className="text-lg md:text-xl font-bold mb-6">Acesso Administrativo</h3>
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
                  <h3 className="text-xl font-bold mb-6">Imagem de Capa</h3>
                  <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-neutral-100 mb-4">
                    <img src={shop.banner} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer">
                      <span className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">Alterar Imagem</span>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={shop.banner}
                    onChange={(e) => setShop({ ...shop, banner: e.target.value })}
                    placeholder="URL da imagem de capa"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all text-xs font-mono"
                    disabled={!hasFeature('page_customization')}
                  />
                </div>
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
