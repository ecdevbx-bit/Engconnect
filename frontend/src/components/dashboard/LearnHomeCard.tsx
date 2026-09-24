"use client";

import Link from "next/link";
import { ArrowUpRight, GraduationCap } from "lucide-react";

import { useLearnVisible } from "@/hooks/useLearnVisible";

// Home-screen door to the Learn library (free grammar lessons). Rendered only
// while the admin switch shows it to everyone — or for admins previewing it.
export default function LearnHomeCard() {
  const visible = useLearnVisible();
  if (!visible) return null;
  return (
    <section>
      <Link
        href="/learn"
        className="c-box group flex items-center gap-4 rounded-2xl p-4 transition hover:border-primary/40 md:p-5"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <GraduationCap className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-heading">Learn</span>
          <span className="block text-sm text-muted-foreground">Grammar in pictures · Beginner → Advanced</span>
        </span>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      </Link>
    </section>
  );
}
