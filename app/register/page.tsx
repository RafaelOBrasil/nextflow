'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scissors, ArrowRight, Mail, Lock, Store, MapPin, Phone, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useBarberData } from '@/hooks/use-barber-data';
import { usePlans } from '@/hooks/use-plans';
import type { BarberShop } from '@/lib/types';
import { maskPhone, maskCPF, maskCNPJ, validateCPF, validateCNPJ, normalizePhone, normalizeNumber } from '@/lib/utils';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addShop, shops, loading, fetchShops } = useBarberData();
  const { plans } = usePlans();

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    document: '',
    planId: searchParams?.get('planId') || 'p1'
  });

  useEffect(() => {
    if (formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .normalize('NFD') // Normaliza para separar acentos
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, '-') // Espaços para hífens
        .replace(/-+/g, '-'); // Evita múltiplos hífens
      
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name]);

  const [error, setError] = useState('');

  useEffect(() => {
    const slugParam = searchParams?.get('slug');
    const nameParam = searchParams?.get('name');
    if (slugParam) {
      setFormData(prev => ({ ...prev, slug: slugParam }));
    }
    if (nameParam) {
      setFormData(prev => ({ ...prev, name: nameParam }));
    }
  }, [searchParams]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: maskPhone(e.target.value) });
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = normalizeNumber(e.target.value);
    if (val.length <= 11) {
      setFormData({ ...formData, document: maskCPF(e.target.value) });
    } else {
      setFormData({ ...formData, document: maskCNPJ(e.target.value) });
    }
  };

  const [step, setStep] = useState(1);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || loadingSubmit) return;
    setLoadingSubmit(true);
    setError('');

    const slug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    if (!slug) {
      setError('Por favor, insira um link válido.');
      setLoadingSubmit(false);
      return;
    }

    if (shops.find(s => s.slug.toLowerCase() === slug.toLowerCase())) {
      setError('Este link já está em uso. Escolha outro.');
      setLoadingSubmit(false);
      return;
    }

    const doc = normalizeNumber(formData.document);
    if (doc.length === 11) {
      if (!validateCPF(formData.document)) {
        setError('CPF inválido.');
        setLoadingSubmit(false);
        return;
      }
    } else if (doc.length === 14) {
      if (!validateCNPJ(formData.document)) {
        setError('CNPJ inválido.');
        setLoadingSubmit(false);
        return;
      }
    } else {
      setError('Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos).');
      setLoadingSubmit(false);
      return;
    }

    const selectedPlan = plans.find(p => p.id === formData.planId);
    if (!selectedPlan) {
      setError('Plano inválido.');
      setLoadingSubmit(false);
      return;
    }

    const newShop: BarberShop = {
      id: Math.random().toString(36).substr(2, 9),
      slug,
      name: formData.name,
      description: `Bem-vindo à ${formData.name}! Oferecemos os melhores serviços de corte e barba.`,
      address: formData.address || 'Endereço não informado',
      phone: formData.phone || '(00) 00000-0000',
      document: formData.document,
      banner: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop',
      adminEmail: formData.email,
      adminPassword: formData.password,
      status: 'trial',
      planId: selectedPlan.id,
      createdAt: new Date().toISOString(),
      services: [
        { id: '1', name: 'Corte Social', price: 35, duration: 30 },
        { id: '2', name: 'Barba', price: 25, duration: 20 },
      ],
      barbers: [
        { id: 'b1', name: 'Barbeiro Principal', role: 'Master Barber', avatar: `https://picsum.photos/seed/${slug}/200` }
      ],
      appointments: [],
      openingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      }
    };

    const autoLogin = async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(`admin_session_${slug}`, 'true');
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('barber_auth_token', data.token);
        } else {
          localStorage.setItem(`admin_session_${slug}`, 'true');
        }
      } catch (err) {
        localStorage.setItem(`admin_session_${slug}`, 'true');
      }
    };

    if (selectedPlan.price === 0) {
      try {
        await addShop(newShop);
        await autoLogin();
        router.push(`/${slug}/admin`);
      } catch (err: any) {
        setError(err.message || 'Erro ao criar barbearia. Tente novamente.');
        setLoadingSubmit(false);
      }
    } else {
      // Payment flow
      try {
        await addShop(newShop);
        await autoLogin();
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            planId: selectedPlan.id, 
            shopId: newShop.id,
            slug: newShop.slug,
            price: selectedPlan.price,
            name: selectedPlan.name
          })
        });
        
        if (res.ok) {
          const { init_point } = await res.json();
          window.location.href = init_point;
        } else {
          const data = await res.json();
          setError(data.error || 'Erro ao iniciar pagamento.');
          setLoadingSubmit(false);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao processar cadastro e pagamento.');
        setLoadingSubmit(false);
      }
    }
    setLoadingSubmit(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-neutral-900/20">
            <Scissors className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Cadastre sua Barbearia</h1>
          <p className="text-neutral-500">Passo {step} de 3</p>
          <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-4">
            <div className="bg-neutral-900 h-1.5 rounded-full transition-all" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-neutral-200 shadow-xl space-y-8">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Informações da Loja</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Nome da Barbearia</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text" 
                    placeholder="Ex: Barber Shop"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 opacity-80">
                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Link Personalizado (Automático)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">/</span>
                  <input 
                    type="text" 
                    placeholder="link-gerado-automaticamente"
                    value={formData.slug}
                    readOnly
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-neutral-100 border border-neutral-100 focus:outline-none cursor-not-allowed font-medium text-neutral-500"
                    title="O link é gerado automaticamente com base no nome da barbearia"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">CPF ou CNPJ</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text" 
                    placeholder="000.000.000-00"
                    value={formData.document}
                    onChange={handleDocumentChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                Próximo <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Acesso Administrativo</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">E-mail do Administrador</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input 
                    type="email" 
                    placeholder="admin@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Endereço</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text" 
                    placeholder="Rua, Número - Bairro"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full bg-neutral-100 text-neutral-900 py-4 rounded-xl font-bold hover:bg-neutral-200 transition-all"
                >
                  Voltar
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Escolha seu Plano</h3>
              
              <div className="grid grid-cols-1 gap-2">
                {plans.map(plan => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, planId: plan.id })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${formData.planId === plan.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-100'}`}
                  >
                    <div className="font-bold">{plan.name}</div>
                    <div className="text-sm text-neutral-500">
                      {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)} / ${plan.interval === 'month' ? 'mês' : 'ano'}`}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-neutral-100 text-neutral-900 py-4 rounded-xl font-bold hover:bg-neutral-200 transition-all"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  disabled={loadingSubmit}
                  className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                >
                  {loadingSubmit ? 'Processando...' : 'Finalizar Cadastro'}
                </button>
              </div>
            </div>
          )}
        </form>
        
        <p className="text-center mt-8 text-neutral-400 text-sm">
          Já tem uma conta? <button onClick={() => router.push('/')} className="text-neutral-900 font-bold hover:underline">Entre aqui</button>
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50"><Scissors className="animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
