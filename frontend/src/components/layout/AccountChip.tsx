"use client";

import Link from "next/link";
// next/image requires every external host in next.config.js's
// images.remotePatterns. Avatars can come from DiceBear (and later,
// any user-uploaded host), so we use a plain <img> consistently across
// avatar surfaces. See Profile / Leaderboard / MyBadges for the same
// pattern.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useSession, signOut as nextAuthSignOut } from "@/lib/session";

import { emitToast } from "@/lib/toast";
import { fromSessionUser, type DisplayUser } from "@/lib/displayUser";
import { Button } from "@/components/ui/button";
import AccountDropdown from "./AccountDropdown";

/**
 * AccountChip — the right-side cluster used in every top nav (Navbar
 * inside AppShell, LandingNav on the marketing landing page). Knows about
 * both auth providers and renders one of three states:
 *
 *  - loading: skeleton avatar
 *  - signed in: avatar button + dropdown
 *  - signed out: Log in + Sign up buttons
 *
 * Keep the visual styling close to neutral so it slots into any header.
 */
export default function AccountChip({ size = "md" }: { size?: "sm" | "md" }) {
  const session = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Anchor for the dropdown, which is portaled to <body> (so it escapes the
  // navbar's backdrop-filter stacking context and is never hidden behind cards).
  const anchorRef = useRef<HTMLDivElement>(null);

  const user: DisplayUser | null = fromSessionUser(session.data?.user);
  const loading = session.status === "loading";
  const isAuthenticated = !!user?.uid && user.emailVerified === true;

  async function handleSignOut() {
    setOpen(false);
    try {
      await nextAuthSignOut({ redirect: false });
      emitToast({ type: "success", title: "Signed out", body: "You have been signed out successfully." });
      router.push("/");
    } catch {
      emitToast({ type: "error", title: "Sign out failed", body: "Please try again." });
    }
  }

  const initials = user?.displayName
    ? user.displayName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  if (loading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-surface-2" />;
  }

  if (!isAuthenticated || !user) {
    const btnSize = size === "sm" ? "sm" : "default";
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size={btnSize}>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild size={btnSize}>
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={anchorRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-surface-2/60 py-1 pl-1 pr-1 transition-colors hover:bg-surface-2 md:pr-3"
      >
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="Avatar" width={36} height={36} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-xs font-bold text-[#0b0e14]">
              {initials}
            </span>
          )}
        </span>
        <span className="hidden items-center gap-2 md:flex">
          <span className="max-w-[110px] truncate text-sm font-semibold text-heading leading-tight">
            {(user.displayName?.split(" ")[0] || "User")}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </button>

      {open && (
        <AccountDropdown
          user={user}
          initials={initials}
          anchorRef={anchorRef}
          onClose={() => setOpen(false)}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
