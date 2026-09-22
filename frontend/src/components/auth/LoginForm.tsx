'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { googleSignIn } from "../../lib/v3Auth";
import { emitToast } from "../../lib/toast";
import { accountRequest, signInWithPassword } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_4124_6913)">
      <path d="M16 16V28C21.3333 28 25.3333 24 28 16M16 16V4L4 8V16M16 0L32 8C32 40 0 40 0 8" fill="#b79fff" />
    </g>
    <defs>
      <clipPath id="clip0_4124_6913">
        <rect width="32" height="32" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// Google "G" mark. Inlined (no remote asset) so it renders under the strict
// CSP and never flashes a broken image.
const GoogleMark = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
  </svg>
);

// Messages for ?reason= / ?error= set by the auth routes.
const NOTICES: Record<string, string> = {
  signed_in_elsewhere: "You were signed out because your account was opened on another device.",
  oauth: "Google sign-in didn't complete. Please try again.",
  link_expired: "That email link has expired or was already used. Request a new one below.",
  link_invalid: "That email link isn't valid. Request a new one below.",
};

type Mode = "signin" | "signup";

// Sign-in / sign-up card: Google, or email + password (Supabase Auth, D-008).
// /login renders mode "signin", /signup renders mode "signup".
export default function LoginForm({ mode: initialMode = "signin" }: { mode?: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const notice = NOTICES[params?.get("reason") ?? ""] ?? NOTICES[params?.get("error") ?? ""] ?? null;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // After sign-up (or an unconfirmed sign-in): "check your inbox" state.
  const [sentTo, setSentTo] = useState<string | null>(null);
  // Is Google enabled in Supabase Auth? (public settings endpoint). null = unknown.
  const [googleOn, setGoogleOn] = useState<boolean | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((r) => r.json())
      .then((s: { external?: { google?: boolean } }) => setGoogleOn(s.external?.google === true))
      .catch(() => setGoogleOn(null));
  }, []);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await googleSignIn("/dashboard");
    } catch {
      emitToast({ type: "error", title: "Sign in failed", body: "We couldn't start Google sign-in. Please try again." });
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const res = await signInWithPassword(email, password);
        if (res.ok) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }
        if (res.code === "UNCONFIRMED") setSentTo(email.trim().toLowerCase());
        setError(res.message);
      } else {
        const res = await accountRequest("signup", { email, password, name });
        if (res.ok) setSentTo(email.trim().toLowerCase());
        else setError(res.message || "Sign-up failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (!sentTo) return;
    setBusy(true);
    const res = await accountRequest("resend", { email: sentTo });
    setBusy(false);
    emitToast({ type: res.ok ? "success" : "error", title: res.ok ? "Email sent" : "Couldn't send", body: res.message });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl c-box rounded-xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Panel */}
        <div className="md:w-[55%] bg-gradient-to-br from-[#b79fff]/10 to-[#ab8eff]/5 flex flex-col justify-center items-center relative overflow-hidden rounded-b-xl md:rounded-b-none">
          <Image src="/loginImg.svg" alt="Login Illustration" loading="eager" width={320} height={320} className="w-140 h-auto" />
        </div>

        {/* Right Panel */}
        <div className="md:w-[45%] bg-surface-1/60 px-8 py-8 sm:px-10 flex flex-col justify-center relative">
          <h2 className="text-3xl font-extrabold text-heading mb-1">
            {mode === "signin" ? "Welcome back! 👋" : "Create your account ✨"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {mode === "signin" ? "Sign in to pick up right where you left off." : "Start practising English in under a minute."}
          </p>

          {notice && (
            <div role="status" className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-heading">
              {notice}
            </div>
          )}

          {sentTo ? (
            <div className="rounded-xl border border-white/10 bg-surface-2/40 p-5 text-sm">
              <p className="font-bold text-heading">Check your inbox 📬</p>
              <p className="mt-2 text-muted-foreground">
                We sent a confirmation link to <span className="font-semibold text-heading">{sentTo}</span>. Open it on
                this device to finish signing in. It can take a minute — check spam too.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleResend} disabled={busy}>
                  Resend email
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setSentTo(null); setMode("signin"); }}>
                  Back to sign in
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button type="button" onClick={handleGoogle} disabled={googleLoading || googleOn === false} size="lg" variant="outline" className="w-full gap-3">
                <GoogleMark />
                {googleLoading ? "Redirecting…" : "Continue with Google"}
              </Button>
              {googleOn === false && (
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Google sign-in is being set up — please use email for now.
                </p>
              )}

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-white/10" />
                or use email
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" && (
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {mode === "signup" && (
                    <p className="text-[11px] text-muted-foreground">At least 8 characters, with a letter and a number.</p>
                  )}
                </div>

                {error && (
                  <p role="alert" className="text-xs text-[#ff6c95]">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={busy || !email || !password}>
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {mode === "signin" ? "New to English Connection? " : "Already have an account? "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => { setError(null); setMode(mode === "signin" ? "signup" : "signin"); }}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}

          <div className="mt-6 flex items-center gap-3 c-box rounded-xl px-4 py-3">
            <ShieldIcon />
            <p className="text-xs text-muted-foreground italic leading-snug">
              Your data is safe with us. We never share your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
