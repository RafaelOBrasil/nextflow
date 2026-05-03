"use client";

import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginForm({ onLogin, error, shop }: { onLogin: (e: React.FormEvent, email: string, password: string) => void, error: string, shop: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans">
      {shop.primaryColor && (
        <style dangerouslySetInnerHTML={{
          __html: `
          .theme-bg { background-color: ${shop.primaryColor} !important; color: #fff !important; border-color: ${shop.primaryColor} !important; }
          .theme-bg-hover:hover { opacity: 0.9 !important; }
          .theme-text { color: ${shop.primaryColor} !important; }
          .theme-border { border-color: ${shop.primaryColor} !important; }
        `}} />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neutral-900 theme-bg rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-neutral-900/20">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Painel Administrativo</h2>
          <p className="text-neutral-500 text-sm">Acesse para gerenciar sua barbearia</p>
        </div>

        <form onSubmit={(e) => onLogin(e, email, password)} className="bg-white rounded-4xl p-8 border border-neutral-200 shadow-xl space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-neutral-400 uppercase ml-1">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="email"
                placeholder="admin@barber.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 py-6 rounded-xl bg-neutral-50 border border-neutral-100 theme-border"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-neutral-400 uppercase ml-1">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 py-6 rounded-xl bg-neutral-50 border border-neutral-100 theme-border"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-neutral-900 theme-bg text-white py-6 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 mt-2"
          >
            Entrar no Painel
          </Button>
        </form>

        <p className="text-center mt-8 text-neutral-400 text-xs">
          Esqueceu sua senha? Entre em contato com o suporte.
        </p>
      </motion.div>
    </div>
  );
}
