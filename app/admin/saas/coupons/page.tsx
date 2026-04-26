'use client';

import { useState } from 'react';
import { useCoupons, Coupon } from '@/hooks/use-coupons';
import { 
  Plus, 
  Ticket, 
  Trash2,
  X,
  Check,
  Calendar,
  Percent,
  DollarSign,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export default function SaaSReportsCoupons() {
  const router = useRouter();
  const { coupons, loading, addCoupon, updateCoupon, deleteCoupon } = useCoupons();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    maxUses: null,
    expiresAt: null,
    active: true
  });

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  const handleOpenModal = (coupon?: Coupon) => {
    setError('');
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData(coupon);
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        maxUses: null,
        expiresAt: null,
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSave = async () => {
    if (!formData.code || formData.discountValue === undefined) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    let result;
    if (editingCoupon) {
      result = await updateCoupon({ ...editingCoupon, ...formData } as Coupon);
    } else {
      result = await addCoupon({
        code: formData.code,
        discountType: formData.discountType || 'percentage',
        discountValue: formData.discountValue || 0,
        maxUses: formData.maxUses || null,
        expiresAt: formData.expiresAt || null,
        active: formData.active !== undefined ? formData.active : true
      });
    }

    if (result.success) {
      setToast({ message: 'Cupom salvo com sucesso!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      handleCloseModal();
    } else {
      setError(result.error || 'Erro ao salvar cupom.');
    }
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;
    setIsDeleting(true);
    const result = await deleteCoupon(couponToDelete.id);
    setIsDeleting(false);
    
    if (result.success) {
      setToast({ message: 'Cupom excluído com sucesso!', type: 'success' });
      setCouponToDelete(null);
    } else {
      setToast({ message: result.error || 'Erro ao excluir o cupom.', type: 'error' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Cupons de Desconto</h2>
            <p className="text-sm md:text-base text-neutral-500">Gerencie promoções e descontos para novos assinantes.</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-neutral-900 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-2xl text-sm md:text-base font-bold hover:bg-neutral-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" /> Novo Cupom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon, i) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white rounded-[2rem] border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${!coupon.active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                <Ticket className="w-6 h-6" />
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${coupon.active ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}>
                {coupon.active ? 'Ativo' : 'Inativo'}
              </div>
            </div>

            <h3 className="text-xl font-bold mb-1 tracking-tighter">{coupon.code}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-bold text-neutral-900">
                {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `R$ ${coupon.discountValue}`}
              </span>
              <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">de desconto</span>
            </div>

            <div className="space-y-3 pt-4 border-t border-neutral-50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-bold uppercase tracking-widest">Usos</span>
                <span className="font-bold text-neutral-700">{coupon.usedCount} / {coupon.maxUses || '∞'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-bold uppercase tracking-widest">Expira em</span>
                <span className="font-bold text-neutral-700">
                  {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('pt-BR') : 'Nunca'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => handleOpenModal(coupon)}
                className="flex-1 bg-neutral-50 text-neutral-600 py-2 rounded-xl text-xs font-bold hover:bg-neutral-100 transition-all"
              >
                Editar
              </button>
              <button 
                onClick={() => setCouponToDelete(coupon)}
                className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {coupons.length === 0 && (
        <div className="bg-white rounded-[2.5rem] border border-neutral-200 p-20 text-center">
          <Ticket className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-400 font-medium">Nenhum cupom criado ainda.</p>
        </div>
      )}

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
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {error && (
                  <div className="bg-rose-50 text-rose-500 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Código do Cupom</label>
                  <input 
                    type="text" 
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                    placeholder="EX: BARBER30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Tipo de Desconto</label>
                    <select 
                      value={formData.discountType || 'percentage'}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                    >
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Valor do Desconto</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                        {formData.discountType === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                      </div>
                      <input 
                        type="number" 
                        value={formData.discountValue || 0}
                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Limite de Usos</label>
                    <input 
                      type="number" 
                      value={formData.maxUses === null ? '' : formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                      placeholder="Ilimitado"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Data de Expiração</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input 
                        type="date" 
                        value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-900 transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                  <input 
                    type="checkbox" 
                    checked={formData.active !== undefined ? formData.active : true}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="font-bold text-neutral-700">Cupom Ativo</span>
                </label>
              </div>

              <div className="p-6 bg-neutral-50/50 border-t border-neutral-100 flex justify-end gap-3">
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
                  Salvar Cupom
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {couponToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !isDeleting && setCouponToDelete(null)}
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
              <h3 className="text-2xl font-bold mb-2">Excluir Cupom</h3>
              <p className="text-neutral-500 mb-8">
                Tem certeza que deseja excluir o cupom <span className="font-bold text-neutral-900">{couponToDelete.code}</span>? 
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setCouponToDelete(null)}
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
