import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

import { MobileNav } from "./MobileNav";
import type { NavTrack, SearchItem } from "./navTypes";

// Slim glass header for the public Learn library.
export function LearnHeader({ signedIn, tracks, items }: { signedIn: boolean; tracks: NavTrack[]; items: SearchItem[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <MobileNav tracks={tracks} items={items} />
        <Link href="/" className="flex min-h-11 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Image src="/logo.svg" alt="English Connection home" width={26} height={26} className="h-[26px] w-[26px]" />
          <span className="hidden text-sm font-bold text-heading sm:inline">English Connection</span>
        </Link>
        <span className="h-5 w-px bg-border" aria-hidden />
        <Link
          href="/learn"
          className="flex min-h-11 items-center rounded-lg px-1 font-display text-sm font-extrabold text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Learn
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {signedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface-2 px-4 text-sm font-semibold text-heading hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login?next=%2Flearn"
              className="inline-flex min-h-11 items-center rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-5 text-sm font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
