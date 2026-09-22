"use client";

import { LifeBuoy, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import SupportForm from "./SupportForm";

// Navbar "Something wrong?" button → dropdown panel with the support form.
// Works the same on phone and desktop (the panel sizes to the screen), and
// sits in the navbar so it never covers the AI Partner mic bar on mobile.
export default function SupportMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Something wrong? Contact support"
          title="Something wrong? Tell us"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/[0.08] bg-surface-2/60 px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-heading"
        >
          <LifeBuoy className="h-4 w-4" />
          <span className="hidden lg:inline">Help</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-bold text-heading">Something wrong?</p>
            <p className="text-xs text-muted-foreground">Tell us and we&apos;ll fix it — the team is notified by email.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 text-muted-foreground hover:text-heading">
            <X className="h-4 w-4" />
          </button>
        </div>
        <SupportForm compact onDone={() => setOpen(false)} />
        <p className="mt-3 border-t border-white/[0.06] pt-2 text-[11px] text-muted-foreground">
          Prefer WhatsApp or a call?{" "}
          <Link href="/support" onClick={() => setOpen(false)} className="font-semibold text-primary hover:underline">
            All support options
          </Link>
        </p>
      </PopoverContent>
    </Popover>
  );
}
