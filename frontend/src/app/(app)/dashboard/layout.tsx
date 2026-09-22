import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Dashboard layout — the gate for every signed-in screen.
 *
 * The shared chrome (navbar + content column) is provided one level up by
 * the (app) layout's AppShell; this layout adds the auth guard. A request
 * without a valid Supabase session is bounced to /login before any
 * dashboard page renders, so the protected `/dashboard/*` routes never
 * flash for logged-out visitors. A login superseded by a newer one on
 * another device is signed out here. Public `/game/*` pages stay open.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.sub) redirect("/login");
  if (session.error === "SessionSuperseded") redirect("/auth/signout?reason=signed_in_elsewhere");
  return <>{children}</>;
}
