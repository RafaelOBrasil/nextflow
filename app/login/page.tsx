'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.user?.shop?.slug) {
          localStorage.setItem(`admin_session_${data.user.shop.slug}`, 'true');
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('barber_auth_token', data.token); // Add this
          router.push(`/${data.user.shop.slug}/admin`);
        } else if (data.user?.role === 'SAAS_ADMIN') {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('barber_auth_token', data.token); // Add this
          router.push('/admin/saas');
        } else {
          setError('Usuário sem loja associada.');
        }
      } else {
        const data = await res.json();
        setError(data.error || 'E-mail ou senha incorretos.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-lg">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
            <Scissors className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">Next Flow Barber</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Login do Estabelecimento</h2>
        <p className="text-neutral-500 mb-8 text-center">Acesse o painel administrativo da sua barbearia.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">E-mail</label>
            <input 
              type="email" 
              autoFocus
              placeholder="admin@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Senha</label>
            <input 
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
