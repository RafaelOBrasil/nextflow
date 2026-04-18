'use client';

import { useState, Suspense } from 'react';
import ShopView from '@/components/ShopView';
import { BarberShop } from '@/lib/types';
import { Scissors } from 'lucide-react';

const MOCK_SHOP: BarberShop = {
  id: 'demo-shop',
  slug: 'demo',
  name: 'Barbearia Demo',
  description: 'Esta é uma demonstração do sistema BarberFlow. Aqui você pode testar todas as funcionalidades de agendamento sem afetar dados reais.',
  address: 'Avenida das Demonstrações, 999 - Tech City',
  phone: '(11) 98888-8888',
  banner: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop',
  services: [
    { id: 's1', name: 'Corte Moderno', price: 45, duration: 40, description: 'Corte degradê ou freestyle.' },
    { id: 's2', name: 'Barba Premium', price: 35, duration: 30, description: 'Barba com toalha quente e produtos exclusivos.' },
    { id: 's3', name: 'Combo Master', price: 70, duration: 60, description: 'Corte + Barba + Lavagem.' },
  ],
  barbers: [
    { id: 'b1', name: 'Mestre Yoda', role: 'Senior Barber', avatar: 'https://picsum.photos/seed/yoda/200' },
    { id: 'b2', name: 'Darth Vader', role: 'Barbeiro', avatar: 'https://picsum.photos/seed/vader/200' },
  ],
  appointments: [
    { id: 'a1', shopId: 'demo-shop', customerName: 'Luke Skywalker', customerPhone: '(11) 91111-1111', serviceId: 's1', barberId: 'b1', date: '2024-05-20', time: '10:00', status: 'completed' },
    { id: 'a2', shopId: 'demo-shop', customerName: 'Han Solo', customerPhone: '(11) 92222-2222', serviceId: 's2', barberId: 'b2', date: '2024-05-20', time: '11:00', status: 'completed' },
  ],
  reviews: [
    { id: 'r1', appointmentId: 'a1', customerName: 'Luke Skywalker', rating: 5, comment: 'O melhor corte da galáxia!', date: new Date().toISOString(), status: 'approved_for_display' },
    { id: 'r2', appointmentId: 'a2', customerName: 'Han Solo', rating: 4, comment: 'Muito bom, mas o café estava frio.', date: new Date().toISOString(), status: 'approved_for_display' },
  ],
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

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="bg-amber-500 text-neutral-900 py-2 px-4 text-center text-xs font-bold uppercase tracking-widest sticky top-0 z-[200]">
        Modo de Demonstração • Os dados não serão salvos
      </div>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-900"><Scissors className="animate-spin text-white" /></div>}>
        <ShopView shop={MOCK_SHOP} />
      </Suspense>
    </div>
  );
}
