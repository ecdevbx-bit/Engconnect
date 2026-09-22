import AppShell from "@/components/layout/AppShell";

// Wraps every /v3/* route (admin + leaderboard) in the standard
// in-app frame so they get the same Navbar as the rest of the app.
// The (app) route group already does this for legacy v1 routes; this
// layout is the v3 equivalent.
export default function V3Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
