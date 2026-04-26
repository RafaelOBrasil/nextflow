'use client';

import { useState, useEffect } from 'react';
import { usePlans } from '@/hooks/use-plans';
import { Plan } from '@/lib/types';
import { 
  Plus, 
  Package, 
  Check, 
  Edit3, 
  Trash2,
  X,
  Crown,
  Percent,
  Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export default function SaaSPlansManagement() {
  const router = useRouter();
  const { plans, loading, addPlan, updatePlan, deletePlan, allFeatures } = usePlans();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<Partial<Plan>>({
    name: '',
    price: 0,
    interval: 'month',
    features: [],
    maxAppointments: null,
    isPopular: false,
    discount: 0,
    monthlyPlanId: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-calculate price based on discount for annual plans
  useEffect(() => {
    if (formData.interval === 'year' && formData.monthlyPlanId && formData.discount !== undefined) {
      const monthlyPlan = plans.find(p => p.id === formData.monthlyPlanId);
      if (monthlyPlan) {
        const baseAnnualPrice = monthlyPlan.price * 12;
        const discountedPrice = baseAnnualPrice * (1 - formData.discount / 100);
        setFormData(prev => ({ ...prev, price: Number(discountedPrice.toFixed(2)) }));
      }
    }
  }, [formData.discount, formData.monthlyPlanId, formData.interval, plans]);

  if (!mounted || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-neutral-500 font-medium">Carregando planos...</p>
      </div>
    </div>
  );

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData(plan);
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price: 0,
        interval: 'month',
        features: [],
        maxAppointments: null,
        isPopular: false
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    if (formData.interval === 'year' && !formData.monthlyPlanId) {
      setToast({ message: 'Planos anuais devem estar vinculados a um plano mensal.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      if (editingPlan) {
        await updatePlan({ ...editingPlan, ...formData } as Plan);
        setToast({ message: 'Plano atualizado com sucesso!', type: 'success' });
      } else {
        await addPlan({
          name: formData.name,
          price: formData.price || 0,
          interval: formData.interval || 'month',
          features: formData.features || [],
          maxAppointments: formData.maxAppointments || null,
          isPopular: formData.isPopular || false,
          discount: formData.discount,
          monthlyPlanId: formData.monthlyPlanId
        });
        setToast({ message: 'Plano criado com sucesso!', type: 'success' });
      }
      setTimeout(() => setToast(null), 3000);
      handleCloseModal();
    } catch (error) {
      setToast({ message: 'Erro ao salvar o plano.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async () => {
    console.log('handleDelete called for plan:', planToDelete);
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deletePlan(planToDelete.id);
      console.log('deletePlan result:', result);
      setIsDeleting(false);
      
      if (result && result.success) {
        setToast({ message: 'Plano excluído com sucesso!', type: 'success' });
        setPlanToDelete(null);
      } else {
        setToast({ message: result?.error || 'Erro ao excluir o plano.', type: 'error' });
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      setToast({ message: 'Erro inesperado ao excluir o plano.', type: 'error' });
      setIsDeleting(false);
    }
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFeature = (featureKey: string) => {
    const currentFeatures = formData.features || [];
    if (currentFeatures.includes(featureKey)) {
      setFormData({ ...formData, features: currentFeatures.filter(f => f !== featureKey) });
    } else {
      setFormData({ ...formData, features: [...currentFeatures, featureKey] });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Planos e Assinaturas</h2>
          <p className="text-sm md:text-base text-neutral-500">Gerencie os planos disponíveis para as barbearias.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => router.push('/admin/saas/coupons')}
            className="bg-white border border-neutral-200 text-neutral-900 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl text-sm md:text-base font-bold hover:bg-neutral-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto"
          >
            <Ticket className="w-5 h-5" /> Cupons
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-neutral-900 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-2xl text-sm md:text-base font-bold hover:bg-neutral-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" /> Novo Plano
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white rounded-[2.5rem] border-2 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group relative ${plan.isPopular ? 'border-amber-500' : 'border-neutral-200'}`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-b-xl text-xs font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" /> Mais Popular
              </div>
            )}
            <div className="p-8 border-b border-neutral-50 mt-4">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                  <Package className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <span className="text-neutral-400 text-sm font-bold uppercase tracking-wider">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
              </div>
            </div>

            <div className="p-8 flex-1 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm font-bold text-neutral-600">
                  <Package className="w-4 h-4 text-neutral-300" />
                  {plan.maxAppointments === null ? 'Agendamentos Ilimitados' : `Até ${plan.maxAppointments} agendamentos`}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Recursos Inclusos</p>
                {allFeatures.filter(f => plan.features.includes(f.key)).map((feature) => (
                  <div key={feature.id} className="flex items-center gap-3 text-sm text-neutral-500">
                    <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    {feature.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-neutral-50/50 border-t border-neutral-100 flex gap-3">
              <button 
                onClick={() => handleOpenModal(plan)}
                className="flex-1 bg-white border border-neutral-200 py-3 rounded-xl text-sm font-bold hover:bg-neutral-50 hover:border-neutral-900 transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Editar
              </button>
              <button 
                onClick={() => setPlanToDelete(plan)}
                className="p-3 bg-white border border-neutral-200 rounded-xl text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-neutral-100 p-6 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Nome do Plano</label>
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                      placeholder="Ex: Plano Profissional"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Preço (R$)</label>
                      <input 
                        type="number" 
                        value={formData.price || 0}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        className={`w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold ${formData.interval === 'year' && formData.monthlyPlanId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        step="0.01"
                        readOnly={formData.interval === 'year' && !!formData.monthlyPlanId}
                      />
                      {formData.interval === 'year' && formData.monthlyPlanId && (
                        <p className="text-[10px] text-neutral-400 mt-1 italic">Calculado automaticamente com base no desconto.</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Intervalo</label>
                      <select 
                        value={formData.interval || 'month'}
                        onChange={(e) => setFormData({ ...formData, interval: e.target.value as 'month' | 'year' })}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                      >
                        <option value="month">Mensal</option>
                        <option value="year">Anual</option>
                      </select>
                    </div>
                  </div>
                  {formData.interval === 'year' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 col-span-1 md:col-span-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Desconto (%)</label>
                        <input 
                          type="number" 
                          value={formData.discount || 0}
                          onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Plano Mensal Correspondente</label>
                        <select 
                          value={formData.monthlyPlanId || ''}
                          onChange={(e) => setFormData({ ...formData, monthlyPlanId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                        >
                          <option value="">Selecione um plano mensal</option>
                          {plans.filter(p => p.interval === 'month').map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Limite de Agendamentos</label>
                    <input 
                      type="number" 
                      value={formData.maxAppointments === null ? '' : formData.maxAppointments}
                      onChange={(e) => setFormData({ ...formData, maxAppointments: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                      placeholder="Deixe em branco para ilimitado"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-center pt-2 md:pt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.isPopular || false}
                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                        className="w-5 h-5 rounded border-neutral-300 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="font-bold text-neutral-700 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" /> Destacar como Popular
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-100">
                  <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Funcionalidades do Plano</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allFeatures.map((feature) => {
                      const isSelected = formData.features?.includes(feature.key);
                      return (
                        <div 
                          key={feature.id}
                          onClick={() => toggleFeature(feature.key)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected ? 'border-emerald-500 bg-emerald-50/50' : 'border-neutral-100 hover:border-neutral-200'
                          }`}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-transparent'
                          }`}>
                            <Check className="w-3 h-3" />
                          </div>
                          <div>
                            <h4 className={`font-bold text-sm ${isSelected ? 'text-emerald-900' : 'text-neutral-700'}`}>
                              {feature.name}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-1">{feature.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 rounded-b-[2rem] flex justify-end gap-3">
                <button 
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-xl font-bold text-neutral-600 hover:bg-neutral-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg"
                >
                  Salvar Plano
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {planToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !isDeleting && setPlanToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Excluir Plano</h3>
              <p className="text-neutral-500 mb-8">
                Tem certeza que deseja excluir o plano <span className="font-bold text-neutral-900">{planToDelete.name}</span>? 
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPlanToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-neutral-600 hover:bg-neutral-100 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-white font-bold ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
