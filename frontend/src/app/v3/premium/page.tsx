import { Suspense } from "react";

import ProFeatureCards from "@/components/premium/ProFeatureCards";
import PremiumHeader from "@/components/premium/PremiumHeader";
import { PaymentStatusCard } from "@/components/premium/ProCheckout";

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <PremiumHeader />

      {/* Back from YouPI checkout: /v3/premium?payment=<order id> (D-061). */}
      <Suspense fallback={null}>
        <PaymentStatusCard />
      </Suspense>

      <ProFeatureCards />
    </main>
  );
}
