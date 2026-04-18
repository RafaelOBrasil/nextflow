'use client';

import { useSaaSData } from '@/hooks/use-saas-data';
import { Activity, Search, Filter, Shield, Info, AlertTriangle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function SaaSLogsManagement() {
  const { logs, loading } = useSaaSData();

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <h3 className="text-lg md:text-xl font-bold">Logs de Atividade</h3>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Buscar nos logs..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 text-sm font-medium"
              />
            </div>
            <button className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl hover:bg-neutral-100 transition-all">
              <Filter className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-neutral-50/50">
                <th className="px-6 md:px-8 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Tipo</th>
                <th className="px-6 md:px-8 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Ação</th>
                <th className="px-6 md:px-8 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Usuário</th>
                <th className="px-6 md:px-8 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Detalhes</th>
                <th className="px-6 md:px-8 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {logs.map((log) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-neutral-50/50 transition-all"
                >
                  <td className="px-6 md:px-8 py-4 md:py-6">
                    {log.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                    {log.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                    {log.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                    {log.type === 'security' && <Shield className="w-5 h-5 text-neutral-900" />}
                  </td>
                  <td className="px-6 md:px-8 py-4 md:py-6">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest px-2 py-1 bg-neutral-100 rounded-md">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 md:px-8 py-4 md:py-6 font-bold text-sm">{log.userId}</td>
                  <td className="px-6 md:px-8 py-4 md:py-6 text-sm text-neutral-500">{log.details}</td>
                  <td className="px-6 md:px-8 py-4 md:py-6 text-[10px] md:text-xs text-neutral-400 font-mono">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
