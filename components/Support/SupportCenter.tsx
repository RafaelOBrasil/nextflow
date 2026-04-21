'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ChevronLeft,
  User,
  ShieldCheck,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { SupportTicket, TicketMessage } from '@/lib/saas-types';

interface SupportCenterProps {
  tickets: SupportTicket[];
  loading: boolean;
  onSendMessage: (ticketId: string, content: string) => Promise<any>;
  onCreateTicket?: (data: { subject: string, description: string, priority: string, category: string, shopId?: string }) => Promise<any>;
  onFetchTicket: (ticketId: string) => Promise<any>;
  onUpdateStatus?: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
  isAdmin?: boolean;
  shops?: { id: string, name: string }[];
}

export default function SupportCenter({ 
  tickets, 
  loading, 
  onSendMessage, 
  onCreateTicket, 
  onFetchTicket,
  onUpdateStatus,
  isAdmin = false,
  shops = []
}: SupportCenterProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'support',
    shopId: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  useEffect(() => {
    if (selectedTicketId && !selectedTicket?.messages) {
      onFetchTicket(selectedTicketId);
    }
  }, [selectedTicketId, selectedTicket, onFetchTicket]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicketId || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      await onSendMessage(selectedTicketId, newMessage);
      setNewMessage('');
    } catch (err) {
      setError('Erro ao enviar mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newTicket.subject.trim() || !newTicket.description.trim() || !onCreateTicket || isSending) return;
    
    if (isAdmin && !newTicket.shopId) {
      setError('Por favor, selecione uma barbearia para este chamado.');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
        ...(isAdmin && newTicket.shopId ? { shopId: newTicket.shopId } : {})
      };

      const created = await onCreateTicket(payload);
      if (created && !created.error) {
        setIsCreating(false);
        setNewTicket({ subject: '', description: '', priority: 'medium', category: 'support', shopId: '' });
        setSelectedTicketId(created.id);
      } else {
        setError(created?.error || 'Erro ao criar chamado. Verifique os dados e tente novamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar requisição.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
      <AnimatePresence mode="wait">
        {selectedTicketId ? (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full flex-1"
          >
            {/* Ticket Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedTicketId(null)}
                  className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-neutral-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-bold text-lg">{selectedTicket?.subject}</h3>
                  <p className="text-xs text-neutral-400">
                    ID: {selectedTicket?.id} • {selectedTicket?.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && onUpdateStatus && (
                  <select 
                    value={selectedTicket?.status}
                    onChange={(e) => onUpdateStatus(selectedTicketId, e.target.value as any)}
                    className="text-xs font-bold uppercase tracking-wider bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none"
                  >
                    <option value="open">Aberto</option>
                    <option value="in_progress">Em Atendimento</option>
                    <option value="closed">Fechado</option>
                  </select>
                )}
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedTicket?.status === 'open' ? 'bg-rose-50 text-rose-600' : 
                  selectedTicket?.status === 'in_progress' ? 'bg-amber-50 text-amber-600' : 
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {selectedTicket?.status === 'open' ? 'Aberto' : 
                   selectedTicket?.status === 'in_progress' ? 'Em Atendimento' : 
                   'Fechado'}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[500px]">
              {/* Initial Description */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="space-y-1 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {selectedTicket?.shop?.name || selectedTicket?.user?.name || 'Cliente'}
                    </span>
                    <span className="text-[10px] text-neutral-400">{new Date(selectedTicket?.createdAt || '').toLocaleString()}</span>
                  </div>
                  <div className="bg-neutral-100 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed">
                    {selectedTicket?.description}
                  </div>
                </div>
              </div>

              {/* Messages */}
              {selectedTicket?.messages?.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.isAdmin ? 'bg-neutral-900' : 'bg-neutral-100'
                  }`}>
                    {msg.isAdmin ? (
                      <ShieldCheck className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div className={`space-y-1 max-w-[80%] ${msg.isAdmin ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                      <span className="font-bold text-sm">
                        {msg.isAdmin ? 'Suporte BarberFlow' : selectedTicket?.shop?.name || msg.user?.name || 'Cliente'}
                      </span>
                      <span className="text-[10px] text-neutral-400">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.isAdmin 
                        ? 'bg-neutral-900 text-white rounded-tr-none' 
                        : 'bg-neutral-100 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Area */}
            {selectedTicket?.status !== 'closed' && (
              <form onSubmit={handleSendMessage} className="p-6 border-t border-neutral-100 bg-neutral-50/50">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className="bg-neutral-900 text-white p-3 rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        ) : isCreating ? (
          <motion.div 
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setIsCreating(false)}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold">Novo Chamado</h3>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-6 max-w-2xl">
              {isAdmin && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Barbearia Alvo</label>
                  <select 
                    required
                    value={newTicket.shopId}
                    onChange={(e) => setNewTicket({...newTicket, shopId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 text-sm"
                  >
                    <option value="">Selecione uma barbearia...</option>
                    {shops.map(shop => (
                      <option key={shop.id} value={shop.id}>{shop.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Assunto</label>
                  <input 
                    type="text"
                    required
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    placeholder="Ex: Problema com agendamentos"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Categoria</label>
                  <select 
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 text-sm"
                  >
                    <option value="support">Suporte Técnico</option>
                    <option value="billing">Financeiro</option>
                    <option value="feature_request">Sugestão</option>
                    <option value="bug">Erro no Sistema</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Prioridade</label>
                <div className="flex gap-3">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTicket({...newTicket, priority: p})}
                      className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        newTicket.priority === p 
                          ? 'border-neutral-900 bg-neutral-900 text-white' 
                          : 'border-neutral-100 text-neutral-400 hover:border-neutral-200'
                      }`}
                    >
                      {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Descrição do Problema</label>
                <textarea 
                  required
                  rows={5}
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Descreva detalhadamente o que está acontecendo..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 text-sm resize-none"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={isSending}
                className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSending ? 'Criando...' : 'Abrir Chamado'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full flex-1"
          >
            <div className="p-6 md:p-8 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Meus Chamados</h3>
                <p className="text-sm text-neutral-400">Acompanhe e gerencie seus pedidos de suporte</p>
              </div>
              <button 
                onClick={() => setIsCreating(true)}
                className="bg-neutral-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-neutral-800 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" /> Novo Chamado
              </button>
            </div>

            <div className="divide-y divide-neutral-50 overflow-y-auto max-h-[600px]">
              {tickets.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-neutral-300" />
                  </div>
                  <h4 className="font-bold text-neutral-900 mb-1">Nenhum chamado encontrado</h4>
                  <p className="text-sm text-neutral-400">Você ainda não abriu nenhum chamado de suporte.</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="p-6 hover:bg-neutral-50/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        ticket.status === 'open' ? 'bg-rose-50 text-rose-500' : 
                        ticket.status === 'in_progress' ? 'bg-amber-50 text-amber-500' : 
                        'bg-emerald-50 text-emerald-500'
                      }`}>
                        {ticket.status === 'open' ? <AlertCircle className="w-6 h-6" /> : 
                         ticket.status === 'in_progress' ? <Clock className="w-6 h-6" /> : 
                         <CheckCircle2 className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">{ticket.subject}</h4>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            ticket.priority === 'high' ? 'bg-rose-100 text-rose-600' : 
                            ticket.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 
                            'bg-neutral-100 text-neutral-600'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">
                          {ticket.shop?.name ? `${ticket.shop.name} • ` : ''}
                          {new Date(ticket.createdAt).toLocaleDateString('pt-BR')} • {ticket.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-neutral-900">
                          {ticket._count?.messages || 0} mensagens
                        </p>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
                          Atualizado {new Date(ticket.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-neutral-300 rotate-180 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
