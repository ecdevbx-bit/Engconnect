import ProFeatureCards from "@/components/premium/ProFeatureCards";
import PremiumHeader from "@/components/premium/PremiumHeader";

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <PremiumHeader />

      <ProFeatureCards />
    </main>
  );
}
