'use client';

import { useState, useEffect } from 'react';
import { useSaaSData } from '@/hooks/use-saas-data';
import { 
  Store, 
  Users, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function SaaSAdminDashboard() {
  const { getStats, shops, logs, payments, loading } = useSaaSData();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'cancellations' | 'logs'>('dashboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = getStats();

  const exportLogsToCSV = () => {
    if (logs.length === 0) return;

    const headers = ['ID', 'Usuário', 'Ação', 'Alvo', 'Detalhes', 'Timestamp', 'Tipo'];
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.userId,
        log.action,
        log.target,
        `"${log.details.replace(/"/g, '""')}"`, // Escape quotes
        log.timestamp,
        log.type
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted || loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;
  
  const cards = [
    { name: 'MRR (Receita Mensal)', value: `R$ ${stats.totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CreditCard, trend: '+12.5%', trendUp: true, color: 'bg-emerald-500' },
    { name: 'Barbearias Ativas', value: stats.activeShops, icon: Store, trend: '+3', trendUp: true, color: 'bg-indigo-500' },
    { name: 'Agendamentos Totais', value: stats.totalAppointments, icon: Calendar, trend: '+85', trendUp: true, color: 'bg-amber-500' },
    { name: 'Novas Lojas (Mês)', value: stats.newShopsThisMonth, icon: TrendingUp, trend: '-2', trendUp: false, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-neutral-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <h3 className="text-neutral-400 text-sm font-bold uppercase tracking-wider mb-1">{card.name}</h3>
            <p className="text-3xl font-bold tracking-tight">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-neutral-200 shadow-sm w-full md:w-fit">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
        >
          Visão Geral
        </button>
        <button 
          onClick={() => setActiveTab('finance')}
          className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'finance' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
        >
          Ganhos
        </button>
        <button 
          onClick={() => setActiveTab('cancellations')}
          className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'cancellations' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
        >
          Cancelamentos
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
        >
          Logs
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Crescimento de Receita</h3>
              <select className="bg-neutral-50 border border-neutral-200 px-4 py-2 rounded-xl text-sm font-bold focus:outline-none focus:border-neutral-900">
                <option>Últimos 6 meses</option>
                <option>Último ano</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByMonth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#171717" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#a3a3a3' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#a3a3a3' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#171717" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm">
            <h3 className="text-xl font-bold mb-8">Barbearias Recentes</h3>
            <div className="space-y-4">
              {shops.slice(0, 5).map((shop) => (
                <div key={shop.id} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-100 hover:border-neutral-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl border border-neutral-200 flex items-center justify-center font-bold text-neutral-400">
                      {shop.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{shop.name}</p>
                      <p className="text-xs text-neutral-400">{shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    shop.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {shop.status === 'active' ? 'Ativo' : 'Trial'}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-colors">
              Ver todas as barbearias
            </button>
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="bg-white p-4 md:p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-bold">Ganhos (Pagamentos Recentes)</h3>
            <CreditCard className="w-5 h-5 text-neutral-300 hidden sm:block" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400">
                  <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Data</th>
                  <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Barbearia</th>
                  <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Valor</th>
                  <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Método</th>
                  <th className="pb-4 font-semibold uppercase text-xs tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-400 italic">Nenhum pagamento encontrado.</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-4 text-neutral-600">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 font-bold">{p.shopName || p.shopId}</td>
                      <td className="py-4">
                        <span className="font-bold text-emerald-600">
                          {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: p.currency })}
                        </span>
                      </td>
                      <td className="py-4 uppercase text-xs font-bold text-neutral-500">
                        {p.method.replace('_', ' ')}
                      </td>
                      <td className="py-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'succeeded' ? 'bg-emerald-50 text-emerald-600' :
                          p.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'cancellations' && (
        <div className="bg-white p-4 md:p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-bold">Barbearias Canceladas / Expiradas</h3>
            <Store className="w-5 h-5 text-neutral-300 hidden sm:block" />
          </div>
          <div className="space-y-4">
            {shops.filter(s => s.status === 'expired' || s.status === 'blocked').length === 0 ? (
              <p className="text-neutral-400 text-sm italic text-center py-8">Nenhum cancelamento encontrado.</p>
            ) : (
              shops
                .filter(s => s.status === 'expired' || s.status === 'blocked')
                .map((shop) => (
                <div key={shop.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-100 hover:border-neutral-200 transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl border border-neutral-200 flex items-center justify-center font-bold text-neutral-400">
                      {shop.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{shop.name}</p>
                      <p className="text-xs text-neutral-400">Desde {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      shop.status === 'expired' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {shop.status === 'expired' ? 'Expirado' : 'Bloqueado'}
                    </span>
                    <button className="text-indigo-600 hover:text-indigo-700 text-xs font-bold transition-colors">
                      Ver Ficha
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white p-4 md:p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-bold">Atividade do Sistema</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={exportLogsToCSV}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs md:text-sm font-bold transition-all"
              >
                <Download className="w-4 h-4" /> Exportar CSV
              </button>
              <Activity className="w-5 h-5 text-neutral-300 hidden sm:block" />
            </div>
          </div>
          <div className="space-y-4 md:space-y-6">
            {logs.length === 0 ? (
              <p className="text-neutral-400 text-sm italic">Nenhuma atividade registrada ainda.</p>
            ) : (
              logs.slice(0, 20).map((log, i) => (
                <div key={log.id} className="flex gap-3 md:gap-4">
                  <div className="relative shrink-0">
                    <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full mt-1.5 ${
                      log.type === 'security' ? 'bg-neutral-900' : 
                      log.type === 'error' ? 'bg-rose-500' : 
                      log.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    {i < Math.min(logs.length, 20) - 1 && <div className="absolute top-4 left-1 md:left-1.5 bottom-[-16px] md:bottom-0 w-px bg-neutral-200" />}
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold">{log.details}</p>
                    <p className="text-[10px] md:text-xs text-neutral-400 mt-0.5">
                      {new Date(log.timestamp).toLocaleString('pt-BR')} • Por {log.userId}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
