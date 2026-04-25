'use client';

import { useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Clock } from 'lucide-react';

export default function SubscriptionPendingPage() {
  const params = useParams();
  const search = useSearchParams();
  const slug = (params?.slug as string) || '';
  const router = useRouter();

  useEffect(() => {
    const planId = search?.get("planId");
    const paymentId = search?.get("payment_id");
    const status = search?.get("status");
    
    if (slug && paymentId) {
      const callbackUrl = `${window.location.origin}/api/subscription/callback?slug=${slug}&planId=${planId}&payment_id=${paymentId}&status=${status}`;
      fetch(callbackUrl).catch(console.error);
    }
  }, [slug, search]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-4xl border border-neutral-200 shadow-xl text-center max-w-md w-full">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="text-amber-600 w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Pagamento Pendente</h1>
        <p className="text-neutral-500 mb-8">
          Estamos aguardando a confirmação do seu pagamento. Assim que for aprovado, seu plano será atualizado automaticamente.
        </p>
        <button 
          onClick={() => router.push(`/${slug}/admin`)}
          className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all"
        >
          Voltar para o Painel
        </button>
      </div>
    </div>
  );
}
