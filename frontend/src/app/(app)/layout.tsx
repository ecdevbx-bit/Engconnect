import AppShell from "@/components/layout/AppShell";

/**
 * Layout for every in-app screen. The shell (navbar + sidebar + content
 * column) is defined here once — pages render only into the content column.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
