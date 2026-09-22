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
      {/* Ambient smoky gradient backdrop — soft bluish blobs fill the page
          behind the content so it never reads as flat/empty. Vivid on light,
          subtle on dark. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-48 h-[560px] w-[560px] rounded-full bg-[#7db4ff]/70 blur-[140px] dark:bg-[#f97316]/26" />
        <div className="absolute right-[-12%] top-10 h-[600px] w-[600px] rounded-full bg-[#a9c6ff]/60 blur-[150px] dark:bg-[#f59e0b]/20" />
        <div className="absolute bottom-[-15%] left-1/4 h-[560px] w-[560px] rounded-full bg-[#9ed6ff]/60 blur-[150px] dark:bg-[#fb923c]/16" />
      </div>
      <Navbar />
      <main>
        {/* Extra bottom padding on small screens so the fixed BottomNav bar
            never covers page content. */}
        <div className="mx-auto w-full max-w-[1400px] px-3 pt-4 pb-28 md:px-6 md:pb-8 lg:px-8 lg:py-10">
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
