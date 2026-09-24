import Link from "next/link";
import { notFound } from "next/navigation";

import { LearnHeader } from "@/components/learn/LearnHeader";
import { LearnNav } from "@/components/learn/LearnNav";
import { LearnSearch } from "@/components/learn/LearnSearch";

import { getLearnAccess } from "./access";
import { publicIndex } from "./nav";

// /learn — the public lesson library (no login needed). While the admin switch
// is OFF only admins get past this layout; everyone else sees a 404.
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const { open, viewer } = await getLearnAccess();
  if (!open) notFound();

  const { tracks, items } = publicIndex(viewer.isPro);

  return (
    <div className="min-h-screen bg-background font-body text-body antialiased">
      <LearnHeader signedIn={viewer.signedIn} tracks={tracks} items={items} />
      <div className="mx-auto flex max-w-[1240px] gap-8 px-4 sm:px-6 xl:gap-12">
        <aside
          data-learn-scroll
          aria-label="Lesson index"
          className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto overscroll-contain py-6 pr-2 lg:block"
        >
          <LearnSearch items={items} />
          <div className="mt-5">
            <LearnNav tracks={tracks} />
          </div>
        </aside>
        <main id="main" className="min-w-0 flex-1 py-6 sm:py-10">
          <div className="mx-auto max-w-[760px]">{children}</div>
        </main>
      </div>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 English Connection · Free English lessons, basics to pro</span>
          <span className="flex gap-4">
            <Link href="/about" className="py-2 hover:text-primary">About</Link>
            <Link href="/pro" className="py-2 hover:text-primary">Pro</Link>
            <Link href="/privacy" className="py-2 hover:text-primary">Privacy</Link>
            <Link href="/terms" className="py-2 hover:text-primary">Terms</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
