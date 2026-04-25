'use client';

import { useSaaSData } from '@/hooks/use-saas-data';
import { ShieldCheck, Plus, Mail, MoreVertical, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function SaaSUsersManagement() {
  const { superUsers, loading } = useSaaSData();

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Usuários Administrativos</h2>
          <p className="text-sm md:text-base text-neutral-500">Gerencie quem tem acesso ao painel do SaaS.</p>
        </div>
        <button className="bg-neutral-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto">
          <Plus className="w-5 h-5" /> Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {superUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] border border-neutral-200 shadow-sm flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-neutral-100 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 border border-neutral-200">
              <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-neutral-900" />
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-1">{user.name}</h3>
            <p className="text-neutral-400 text-xs md:text-sm mb-4 md:mb-6 flex items-center gap-1.5 justify-center break-all">
              <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" /> {user.email}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 md:mb-8">
              <Shield className="w-3 h-3" /> {user.role}
            </div>
            <div className="flex gap-3 w-full">
              <button className="flex-1 py-2.5 md:py-3 border border-neutral-200 rounded-xl text-sm font-bold hover:bg-neutral-50 transition-all">Editar</button>
              <button className="p-2.5 md:p-3 border border-neutral-200 rounded-xl text-neutral-300 hover:text-neutral-900 transition-all">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
