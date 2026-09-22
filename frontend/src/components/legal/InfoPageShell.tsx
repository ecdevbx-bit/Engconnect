import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

// InfoPageShell — the shared frame for the static Company pages (About,
// Updates, Privacy, Terms). Dark theme matching the rest of the site: a slim
// top bar (back + logo), a readable max-w prose column, and a minimal footer.
export function InfoPageShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#18181c] font-body text-body antialiased">
      <nav className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#18181c]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-body transition-colors hover:text-heading"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="English Connection logo" width={24} height={24} className="h-6 w-6" />
            <span className="text-sm font-bold text-heading">English Connection</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">{title}</h1>
        {updated && <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>}
        {intro && <p className="mt-5 text-lg leading-relaxed text-body">{intro}</p>}
        <div className="mt-10 space-y-10">{children}</div>
      </main>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 English Connection · Built for India&apos;s ambitious learners</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-primary">About</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Section — a titled block with comfortably-spaced body text.
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-heading">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-body">{children}</div>
    </section>
  );
}

// Bullets — a simple checklist-free unordered list for the pages.
export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
