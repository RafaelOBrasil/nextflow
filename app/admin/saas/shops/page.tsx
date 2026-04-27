'use client';

import { useSaaSData } from '@/hooks/use-saas-data';
import { BarberShop } from '@/lib/types';
import { normalizePhone } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Store, 
  ExternalLink, 
  ShieldAlert, 
  ShieldCheck,
  Mail,
  Calendar,
  Package,
  Edit,
  ArrowRight,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditShopModal from '@/components/EditShopModal';

export default function SaaSShopsManagement() {
  const router = useRouter();
  const { shops, plans, toggleShopStatus, updateShop, loading } = useSaaSData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'trial'>('all');
  const [editingShop, setEditingShop] = useState<BarberShop | null>(null);

  if (loading) return <div>Carregando...</div>;

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         shop.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveShop = (shopId: string, updates: Partial<BarberShop>) => {
    const shop = shops.find(s => s.id === shopId);
    if (shop) {
      updateShop(shop.slug, updates);
    }
  };

  return (
    <div className="space-y-8">
      {editingShop && (
        <EditShopModal 
          shop={editingShop} 
          plans={plans}
          onClose={() => setEditingShop(null)} 
          onSave={handleSaveShop}
        />
      )}
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Buscar barbearia por nome ou slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-2xl bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-medium text-sm md:text-base"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-neutral-200 w-full md:w-auto">
            {(['all', 'active', 'blocked', 'trial'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                  statusFilter === status 
                    ? 'bg-neutral-900 text-white shadow-lg' 
                    : 'text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {status === 'all' ? 'Todos' : status === 'active' ? 'Ativos' : status === 'blocked' ? 'Bloqueados' : 'Trial'}
              </button>
            ))}
          </div>
          <button className="p-3 md:p-4 bg-white border border-neutral-200 rounded-2xl hover:bg-neutral-50 transition-all hidden md:block">
            <Filter className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.map((shop) => {
          const plan = plans.find(p => p.id === shop.planId);
          return (
            <motion.div 
              key={shop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center font-bold text-neutral-400 border border-neutral-200 shrink-0 text-xl">
                      {shop.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 text-lg leading-tight truncate max-w-[180px]">{shop.name}</h3>
                      <p className="text-xs text-neutral-400 font-mono mt-1">/{shop.slug}</p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    shop.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                    shop.status === 'blocked' ? 'bg-rose-50 text-rose-600' : 
                    shop.status === 'expired' ? 'bg-red-50 text-red-600' : 
                    'bg-amber-50 text-amber-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      shop.status === 'active' ? 'bg-emerald-500' : 
                      shop.status === 'blocked' ? 'bg-rose-500' : 
                      shop.status === 'expired' ? 'bg-red-500' : 
                      'bg-amber-500'
                    }`} />
                    {shop.status === 'active' ? 'Ativo' : shop.status === 'blocked' ? 'Bloqueado' : shop.status === 'expired' ? 'Expirado' : 'Trial'}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-neutral-600">
                    <Mail className="w-4 h-4 text-neutral-300 shrink-0" />
                    <span className="text-sm truncate">{shop.adminEmail || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-600">
                    <Package className="w-4 h-4 text-neutral-300 shrink-0" />
                    <span className="text-sm font-bold">{plan?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-600">
                    <Calendar className="w-4 h-4 text-neutral-300 shrink-0" />
                    <span className="text-sm">Criado em {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 md:px-8 py-6 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {shop.status === 'expired' && shop.phone && (
                    <a 
                      href={`https://wa.me/55${normalizePhone(shop.phone)}?text=${encodeURIComponent(`Olá ${shop.name}, sua assinatura do plano ${plan?.name || ''} venceu. Para continuar usando o sistema, por favor renove sua assinatura acessando o painel.`)}`}
                      target="_blank"
                      className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-all"
                      title="Notificar WhatsApp"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <button 
                    onClick={() => toggleShopStatus(shop.id)}
                    className={`p-2 rounded-xl transition-all ${
                      shop.status === 'blocked' || shop.status === 'expired'
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    }`}
                    title={shop.status === 'blocked' || shop.status === 'expired' ? 'Ativar' : 'Bloquear'}
                  >
                    {shop.status === 'blocked' || shop.status === 'expired' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => setEditingShop(shop)}
                    className="p-2 bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <button 
                  onClick={() => router.push(`/admin/saas/shops/${shop.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                >
                  Ver Mais <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredShops.length === 0 && (
        <div className="bg-white rounded-[2.5rem] border border-neutral-200 p-20 text-center">
          <Store className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-400 font-medium">Nenhuma barbearia encontrada com esses filtros.</p>
        </div>
      )}
    </div>
  );
}
