"use client";

// Landing point for every auth email link (sign-up confirmation, password
// recovery, email change). Handles all three shapes Supabase can send:
//   ?token_hash=…&type=…      our branded templates (needs custom SMTP)
//   #access_token=…&type=…    Supabase's DEFAULT templates (free-tier SMTP) —
//                             tokens are in the URL fragment, which only the
//                             browser can read, hence a client page
//   ?code=…                   PKCE
// Then records the login (single-session rule, D-009) and routes on.

import type { EmailOtpType, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabaseBrowser } from "@/lib/supabase/browser";

const TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

export default function AuthConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const q = url.searchParams;
      // Strip tokens from the address bar straight away.
      window.history.replaceState(null, "", url.pathname);

      if (q.get("error_description") || hash.get("error_description")) {
        router.replace("/login?error=link_expired");
        return;
      }

      const type = (q.get("type") ?? hash.get("type") ?? "") as EmailOtpType;
      let session: Session | null = null;
      try {
        const tokenHash = q.get("token_hash");
        const access = hash.get("access_token");
        const refresh = hash.get("refresh_token");
        const code = q.get("code");
        if (tokenHash && TYPES.includes(type)) {
          session = (await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).data.session;
        } else if (access && refresh) {
          session = (await supabase.auth.setSession({ access_token: access, refresh_token: refresh })).data.session;
        } else if (code) {
          session = (await supabase.auth.exchangeCodeForSession(code)).data.session;
        }
      } catch {
        session = null;
      }

      if (!session) {
        router.replace("/login?error=link_expired");
        return;
      }

      setMessage(type === "recovery" ? "Link verified — let's set a new password…" : "Email confirmed — welcome!");
      // This login becomes the account's only valid one; also applies the
      // /pro link if the visit started there (cookie rides along).
      await fetch("/api/session/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});

      router.replace(type === "recovery" ? "/reset-password" : "/dashboard?welcome=1");
      router.refresh();
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <p className="text-sm text-muted-foreground" role="status">
        {message}
      </p>
    </div>
  );
}
