'use client';

import { useState, useEffect } from 'react';
import { Lock, Mail, Scissors, LogOut, LayoutDashboard, Store, CreditCard, MessageSquare, Package, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, usePathname } from 'next/navigation';

export default function SaaSAdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('saas_admin_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        redirect: 'manual'
      });

      console.log('Response type:', res.type, 'URL:', res.url, 'Status:', res.status);
      
      const contentType = res.headers.get('content-type');
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        setError('Erro interno do servidor.');
        return;
      }
      
      console.log('Login response:', { status: res.status, data });

      if (data.mustChangePassword) {
        // Redirect to password reset page
        window.location.href = `/admin/reset-password?userId=${data.userId}`;
        return;
      }

      if (res.ok && data.user?.role === 'SAAS_ADMIN') {
        setIsLoggedIn(true);
        localStorage.setItem('saas_admin_token', data.token);
        localStorage.setItem('barber_auth_token', data.token); // Standardized token
        localStorage.setItem('saas_admin_user', JSON.stringify(data.user));
      } else if (res.ok) {
        setError('Acesso negado. Apenas administradores do sistema.');
      } else {
        setError(data.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      console.error('Login catch error:', err);
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('saas_admin_token');
    localStorage.removeItem('saas_admin_user');
    router.push('/');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-white/10">
              <Lock className="text-neutral-900 w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SaaS Control</h1>
            <p className="text-neutral-400">Acesso Restrito ao Administrador do Sistema</p>
          </div>

          <form onSubmit={handleLogin} className="bg-neutral-800 rounded-[2.5rem] p-10 border border-neutral-700 shadow-2xl space-y-6">
            {error && (
              <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-sm font-bold text-center border border-rose-500/20">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase ml-1 tracking-widest">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input 
                  type="email" 
                  placeholder="admin@Next Flow Barber.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-white transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase ml-1 tracking-widest">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-white transition-all font-medium"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-neutral-900 py-5 rounded-2xl font-bold hover:bg-neutral-100 transition-all shadow-xl active:scale-95 text-lg mt-4 disabled:opacity-50"
            >
              {loading ? 'Acessando...' : 'Acessar Painel'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin/saas', icon: LayoutDashboard },
    { name: 'Barbearias', path: '/admin/saas/shops', icon: Store },
    { name: 'Planos', path: '/admin/saas/plans', icon: Package },
    { name: 'Pagamentos', path: '/admin/saas/payments', icon: CreditCard },
    { name: 'Suporte', path: '/admin/saas/support', icon: MessageSquare },
  ];

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
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-neutral-900 text-white flex flex-col z-50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Scissors className="text-neutral-900 w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight">Next Flow Barber <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-400">SaaS</span></span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 hover:bg-neutral-800 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                router.push(item.path);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                pathname === item.path 
                  ? 'bg-white text-neutral-900 shadow-xl shadow-white/10' 
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-neutral-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="h-20 bg-white border-b border-neutral-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-[0.2em] hidden sm:block">
              {menuItems.find(i => i.path === pathname)?.name || 'Administração'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">Super Admin</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase">Sistema Central</p>
            </div>
            <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center border border-neutral-200">
              <Lock className="w-5 h-5 text-neutral-400" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
