'use client';

import { useSaaSData } from '@/hooks/use-saas-data';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Store, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Package, 
  ShieldAlert, 
  ShieldCheck, 
  ExternalLink,
  Edit,
  Clock,
  Users,
  Scissors,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import EditShopModal from '@/components/EditShopModal';
import { BarberShop } from '@/lib/types';
import { normalizePhone } from '@/lib/utils';

export default function ShopDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params?.id as string;
  const { shops, plans, toggleShopStatus, updateShop, loading } = useSaaSData();
  const [isEditing, setIsEditing] = useState(false);

  const shop = shops.find(s => s.id === shopId);
  const plan = plans.find(p => p.id === shop?.planId);
  const { logs, payments } = useSaaSData();

  if (loading) return <div className="p-10 text-center">Carregando...</div>;
  if (!shop) return <div className="p-10 text-center text-rose-500 font-bold">Barbearia não encontrada.</div>;

  const shopLogs = logs.filter(l => l.target === shop.name);
  const shopPayments = payments.filter(p => p.shopId === shop.id);

  const handleSaveShop = (id: string, updates: Partial<BarberShop>) => {
    updateShop(shop.slug, updates);
    setIsEditing(false);
  };

  const subscription = shop.subscriptions?.[0];
  const isExpired = shop.status === 'expired';

  return (
    <div className="space-y-8">
      {isEditing && (
        <EditShopModal 
          shop={shop} 
          plans={plans}
          onClose={() => setIsEditing(false)} 
          onSave={handleSaveShop}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 transition-all font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </button>
        <div className="flex items-center gap-3">
          <a 
            href={`/${shop.slug}`} 
            target="_blank" 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold hover:bg-neutral-50 transition-all"
          >
            Ver Site <ExternalLink className="w-3 h-3" />
          </a>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all shadow-lg"
          >
            Editar Dados <Edit className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-neutral-200 p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10" />
            
            <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10">
              <div className="w-24 h-24 bg-neutral-100 rounded-[2rem] flex items-center justify-center font-bold text-neutral-400 border border-neutral-200 shrink-0 text-4xl shadow-inner">
                {shop.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold tracking-tight">{shop.name}</h1>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    shop.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                    shop.status === 'blocked' ? 'bg-rose-50 text-rose-600' : 
                    shop.status === 'expired' ? 'bg-red-50 text-red-600' : 
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {shop.status === 'active' ? 'Ativo' : shop.status === 'blocked' ? 'Bloqueado' : shop.status === 'expired' ? 'Expirado' : 'Trial'}
                  </div>
                </div>
                <p className="text-neutral-400 font-mono text-sm">/{shop.slug}</p>
                <p className="text-neutral-500 mt-4 max-w-xl leading-relaxed">{shop.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Mail className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">E-mail Admin</p>
                  <p className="text-sm font-bold">{shop.adminEmail || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Phone className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Telefone</p>
                  <p className="text-sm font-bold">{shop.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 md:col-span-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Endereço</p>
                  <p className="text-sm font-bold">{shop.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
              <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-neutral-400" />
              </div>
              <p className="text-2xl font-bold">{shop.appointments?.length || 0}</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Agendamentos</p>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
              <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-neutral-400" />
              </div>
              <p className="text-2xl font-bold">{shop.barbers?.length || 0}</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Barbeiros</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xl md:text-2xl font-bold text-emerald-600">
                  {(shop.appointments || []).filter((a: any) => a.status === 'completed').reduce((sum: number, a: any) => sum + (a.service?.price || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Lucro (Concluídos)</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                </div>
                <p className="text-xl md:text-2xl font-bold text-rose-600">
                  {((shop.appointments || []).filter((a: any) => a.status === 'cancelled' || a.status === 'no_show').reduce((sum: number, a: any) => sum + (a.service?.price || 0), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Perdas (Cancelados)</p>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">Histórico de Pagamentos</h3>
              <div className="px-3 py-1 bg-neutral-50 rounded-full text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Últimos 12 meses
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-neutral-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Data</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Valor</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Método</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {shopPayments && shopPayments.length > 0 ? shopPayments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-neutral-50/50 transition-all">
                      <td className="px-8 py-4 text-sm text-neutral-600">
                        {new Date(payment.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-8 py-4 text-sm font-bold text-neutral-900">
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-4 text-sm text-neutral-500 uppercase font-bold text-[10px]">
                        {payment.method}
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          payment.status === 'succeeded' || payment.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {payment.status === 'succeeded' || payment.status === 'approved' ? 'Aprovado' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center text-neutral-400 text-sm">
                        Nenhum pagamento registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Subscription Card */}
          <div className="bg-white rounded-[2.5rem] border border-neutral-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Assinatura</h3>
            
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-neutral-900 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-5 h-5 text-neutral-400" />
                  <span className="text-sm font-bold">{plan?.name || 'N/A'}</span>
                </div>
                <p className="text-2xl font-bold">R$ {plan?.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                  {plan?.interval === 'month' ? 'Plano Mensal' : 'Plano Anual'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400 font-medium">Status</span>
                  <span className={`font-bold ${shop.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {shop.status === 'active' ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400 font-medium">Vencimento</span>
                  <span className="font-bold">
                    {plan?.price === 0 ? 'Vitalício' : subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400 font-medium">Última Renovação</span>
                  <span className="font-bold">
                    {subscription?.updatedAt ? new Date(subscription.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <button 
                  onClick={() => toggleShopStatus(shop.id)}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    shop.status === 'blocked' || shop.status === 'expired'
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  {shop.status === 'blocked' || shop.status === 'expired' ? (
                    <><ShieldCheck className="w-4 h-4" /> Ativar Barbearia</>
                  ) : (
                    <><ShieldAlert className="w-4 h-4" /> Bloquear Acesso</>
                  )}
                </button>
                {isExpired && shop.phone && (
                  <a 
                    href={`https://wa.me/55${normalizePhone(shop.phone)}?text=${encodeURIComponent(`Olá ${shop.name}, sua assinatura do plano ${plan?.name || ''} venceu. Para continuar usando o sistema, por favor renove sua assinatura acessando o painel.`)}`}
                    target="_blank"
                    className="w-full py-3 bg-green-50 text-green-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-100 transition-all"
                  >
                    Notificar WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-[2.5rem] border border-neutral-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Atividade Recente</h3>
            <div className="space-y-6">
              {shopLogs.length > 0 ? (
                shopLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      log.type === 'error' ? 'bg-rose-50 text-rose-500' :
                      log.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                      log.type === 'security' ? 'bg-purple-50 text-purple-500' :
                      'bg-blue-50 text-blue-500'
                    }`}>
                      {log.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-neutral-400">
                        {new Date(log.timestamp).toLocaleDateString('pt-BR')} às {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-neutral-400 text-xs italic">Nenhuma atividade registrada.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
