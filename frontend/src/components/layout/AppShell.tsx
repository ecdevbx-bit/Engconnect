import AppExtras from "./AppExtras";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import FirstLoginOnboardingModal from "@/components/onboarding/FirstLoginOnboardingModal";

/**
 * AppShell — the outer frame for in-app screens.
 * Defined once; every in-app route renders into the centered content column.
 * AppExtras adds the in-app-only layer (tours, celebrations, Pro prompts).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppExtras>
    <div className="min-h-screen">
      <Navbar />
      <main>
        {/* Extra bottom padding on small screens so the fixed BottomNav bar
            never covers page content. */}
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 pb-32 md:px-6 md:pt-8 md:pb-12 lg:px-8">
          {children}
        </div>
      </main>
      {/* App-style bottom nav on small screens (authenticated users only). */}
      <BottomNav />
      {/* v3 first-login prompt — no-op for v1/Firebase users. */}
      <FirstLoginOnboardingModal />
    </div>
    </AppExtras>
  );
}
