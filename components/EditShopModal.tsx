'use client';

import { useState } from 'react';
import { BarberShop, Plan } from '@/lib/types';
import { X } from 'lucide-react';

interface EditShopModalProps {
  shop: BarberShop;
  plans: Plan[];
  onClose: () => void;
  onSave: (shopId: string, updates: Partial<BarberShop>) => void;
}

export default function EditShopModal({ shop, plans, onClose, onSave }: EditShopModalProps) {
  const [formData, setFormData] = useState<Partial<BarberShop>>({
    name: shop.name,
    description: shop.description,
    address: shop.address,
    phone: shop.phone,
    status: shop.status,
    planId: shop.planId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(shop.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Editar Barbearia: {shop.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            >
              <option value="active">Ativo</option>
              <option value="blocked">Bloqueado</option>
              <option value="trial">Trial</option>
              <option value="expired">Expirado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Plano (Manual)</label>
            <select
              value={formData.planId || ''}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            >
              <option value="">Sem Plano</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">Alterar o plano manualmente não gera cobrança automática.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Telefone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Endereço</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all mt-4"
          >
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
}
