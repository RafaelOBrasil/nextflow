'use client';

import { useSaaSData } from '@/hooks/use-saas-data';
import { 
  CreditCard, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useMemo } from 'react';

export default function SaaSPaymentsManagement() {
  const { payments, shops, loading } = useSaaSData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const shop = shops.find(s => s.id === payment.shopId);
      const searchLower = searchTerm.toLowerCase();
      return shop?.name.toLowerCase().includes(searchLower) || 
             payment.id.toLowerCase().includes(searchLower);
    });
  }, [payments, shops, searchTerm]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthPayments = payments.filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status === 'succeeded';
    });

    const totalProcessed = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const pendingCount = pendingPayments.length;
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentPayments = payments.filter(p => new Date(p.date) >= last30Days);
    const successRate = recentPayments.length > 0 
      ? (recentPayments.filter(p => p.status === 'succeeded').length / recentPayments.length) * 100
      : 100;

    return {
      totalProcessed,
      pendingCount,
      totalPending,
      successRate: successRate.toFixed(1)
    };
  }, [payments]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Total Processado (Mês)</p>
          <h3 className="text-3xl font-bold tracking-tight">R$ {stats.totalProcessed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-2">
            <ArrowUpRight className="w-3 h-3" /> Atualizado
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Pagamentos Pendentes</p>
          <h3 className="text-3xl font-bold tracking-tight">{stats.pendingCount}</h3>
          <p className="text-neutral-400 text-xs font-bold mt-2">Aguardando compensação</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Valores a Receber</p>
          <h3 className="text-3xl font-bold tracking-tight">R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-neutral-400 text-xs font-bold mt-2">Total pendente</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Taxa de Sucesso</p>
          <h3 className="text-3xl font-bold tracking-tight">{stats.successRate}%</h3>
          <p className="text-neutral-400 text-xs font-bold mt-2">Últimos 30 dias</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <h3 className="text-lg md:text-xl font-bold">Histórico de Transações</h3>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Buscar por barbearia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 text-sm font-medium"
              />
            </div>
            <button className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl hover:bg-neutral-100 transition-all">
              <Filter className="w-5 h-5 text-neutral-400" />
            </button>
            <button className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl hover:bg-neutral-100 transition-all hidden sm:block">
              <Download className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-neutral-50/50">
                <th className="px-4 md:px-8 py-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-400">Barbearia</th>
                <th className="px-4 md:px-8 py-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-400">Valor</th>
                <th className="px-4 md:px-8 py-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-400">Método</th>
                <th className="px-4 md:px-8 py-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-400">Status</th>
                <th className="px-4 md:px-8 py-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-400">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredPayments.map((payment) => {
                const shop = shops.find(s => s.id === payment.shopId);
                return (
                  <motion.tr 
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-neutral-50/50 transition-all"
                  >
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center font-bold text-neutral-400 text-xs shrink-0">
                          {shop?.name.charAt(0)}
                        </div>
                        <span className="font-bold text-sm truncate max-w-[150px] md:max-w-none">{shop?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 font-bold text-sm">
                      R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                        <CreditCard className="w-4 h-4 opacity-40 shrink-0" />
                        {payment.method}
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex flex-col gap-1.5">
                        <div className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider w-fit ${
                          payment.status === 'succeeded' ? 'bg-emerald-50 text-emerald-600' : 
                          payment.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {payment.status === 'succeeded' ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : 
                           payment.status === 'pending' ? <Clock className="w-3 h-3 shrink-0" /> : 
                           <AlertCircle className="w-3 h-3 shrink-0" />}
                          {payment.status === 'succeeded' ? 'Sucesso' : payment.status === 'pending' ? 'Pendente' : 'Falhou'}
                        </div>
                        {payment.description && (
                          <span className="text-[10px] text-neutral-400 max-w-[200px] truncate" title={payment.description}>
                            {payment.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm text-neutral-400">
                      {new Date(payment.date).toLocaleDateString('pt-BR')}
                    </td>
                  </motion.tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-neutral-400 font-medium">
                    Nenhum pagamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
