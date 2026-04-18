'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando redefinição de senha para userId:', userId);
    
    if (!userId) {
      setError('ID do usuário não encontrado na URL.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Enviando requisição para /api/auth/change-password');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword }),
      });

      console.log('Resposta recebida, status:', res.status);
      const data = await res.json();
      console.log('Dados da resposta:', data);

      if (res.ok) {
        alert('Senha alterada com sucesso!');
        router.push('/admin/saas');
      } else {
        setError(data.error || 'Erro ao alterar senha.');
      }
    } catch (err) {
      console.error('Erro na redefinição de senha:', err);
      setError('Erro ao conectar com o servidor.');
    } finally {
      console.log('Finalizando redefinição de senha');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-neutral-800 rounded-[2.5rem] p-10 border border-neutral-700 shadow-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Redefinir Senha</h1>
        <p className="text-neutral-400">Por favor, defina uma nova senha para sua conta.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-sm font-bold text-center border border-rose-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-500 uppercase ml-1 tracking-widest">Nova Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input 
              type="password" 
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
          {loading ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans">
      <Suspense fallback={<div className="text-white">Carregando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
