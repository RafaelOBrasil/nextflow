'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Scissors, TrendingUp, Plus } from 'lucide-react';
import PlanNotification from './PlanNotification';
import { useRouter } from 'next/navigation';

export default function Dashboard({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [stats, setStats] = useState({
    appointments: 0,
    maxAppointments: 0,
    isExpired: false,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/plan-status?shopId=${shopId}`);
        const data = await res.json();
        setStats({
          appointments: data.currentAppointments,
          maxAppointments: data.maxAppointments,
          isExpired: data.isExpired,
        });
      } catch (error) {
        console.error('Error fetching stats', error);
      }
    };
    fetchStats();
  }, [shopId]);

  const handleNewAppointment = async () => {
    // This would normally open a modal, but for demo we just call the API
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId,
        customerName: 'Cliente Teste',
        customerPhone: '11999999999',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        serviceId: 'service-id', // Mock
        barberId: 'barber-id', // Mock
      }),
    });

    const data = await res.json();
    if (data.error) {
      alert(data.message || data.error);
    } else {
      alert('Agendamento criado com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <PlanNotification shopId={shopId} />
      
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
            <p className="text-zinc-500">Bem-vindo de volta à sua barbearia.</p>
          </div>
          <button 
            onClick={handleNewAppointment}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={20} />
            Novo Agendamento
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard 
            title="Agendamentos" 
            value={stats.appointments.toString()} 
            sub={stats.maxAppointments ? `Limite: ${stats.maxAppointments}` : 'Ilimitado'}
            icon={<Calendar className="text-blue-500" />} 
          />
          <StatCard 
            title="Clientes" 
            value="124" 
            sub="+12%"
            icon={<Users className="text-purple-500" />} 
          />
          <StatCard 
            title="Serviços" 
            value="8" 
            sub="Ativos"
            icon={<Scissors className="text-amber-500" />} 
          />
          <StatCard 
            title="Faturamento" 
            value="R$ 4.250" 
            sub="Estimado"
            icon={<TrendingUp className="text-emerald-500" />} 
          />
          <StatCard 
            title="Ticket Médio" 
            value="R$ 53,12" 
            sub="Por serviço"
            icon={<TrendingUp className="text-sky-500" />} 
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-bold mb-4">Próximos Agendamentos</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                    C{i}
                  </div>
                  <div>
                    <h4 className="font-bold">Cliente {i}</h4>
                    <p className="text-sm text-zinc-500">Corte de Cabelo • 14:30</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase">Confirmado</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: { title: string, value: string, sub: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{title}</h3>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-zinc-400 font-medium">{sub}</span>
      </div>
    </div>
  );
}
