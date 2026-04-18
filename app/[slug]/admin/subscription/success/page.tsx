"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

export default function SuccessPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const planId = search?.get("planId");
    const paymentId = search?.get("payment_id");
    const status = search?.get("status");
    
    console.log("SuccessPage params:", params);
    console.log("SuccessPage search:", { planId, paymentId, status });

    if (!params?.slug || !paymentId) {
      console.error("Missing slug or paymentId");
      return;
    }

    const callbackUrl = `${window.location.origin}/api/subscription/callback?slug=${params?.slug}&planId=${planId}&payment_id=${paymentId}&status=${status}`;
    console.log("Calling callback URL:", callbackUrl);
    
    fetch(callbackUrl)
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }
        return response.json();
      })
      .then(() => {
        router.push('/login');
      })
      .catch((err) => {
        console.error("Callback error:", err);
      });
  }, [params, search, router]);

  return <p>Confirmando pagamento...</p>;
}
