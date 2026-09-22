'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountRequest } from "@/lib/session";
import { supabaseBrowser } from "@/lib/supabase/browser";

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md c-box rounded-xl bg-surface-1/60 px-8 py-8">
        <h1 className="text-2xl font-extrabold text-heading">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

// /forgot-password — request a reset link (rate-limited server-side).
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await accountRequest("reset", { email });
    setBusy(false);
    setMsg({ ok: res.ok, text: res.message || (res.ok ? "Check your inbox." : "Something went wrong.") });
  }

  return (
    <Card title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {msg && <p role="status" className={msg.ok ? "text-xs text-[#22c55e]" : "text-xs text-[#ff6c95]"}>{msg.text}</p>}
        <Button type="submit" className="w-full" disabled={busy || !email}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
      </p>
    </Card>
  );
}

// /reset-password — reached from the email link via /auth/confirm, which has
// already signed the learner in with a recovery session.
export function ResetPasswordForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
      setError("Use at least 8 characters, with a letter and a number.");
      return;
    }
    if (pw !== pw2) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (err) {
      setError(/session/i.test(err.message) ? "This reset link has expired. Request a new one." : err.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card title="Choose a new password" subtitle="You'll stay signed in on this device.">
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw2">Repeat password</Label>
          <Input id="pw2" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-xs text-[#ff6c95]">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !pw || !pw2}>
          {busy ? "Saving…" : "Save password"}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link href="/forgot-password" className="font-semibold text-primary hover:underline">Need a new link?</Link>
      </p>
    </Card>
  );
}
