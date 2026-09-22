"use client";

import { useCallback, useState } from "react";
import { useSession } from "@/lib/session";
import { Loader2, Send, Check } from "lucide-react";

import { v3SubmitFeedback } from "@/lib/v3Trial";
import { CONTACT_NUMBERS, formatNumber, whatsappLink } from "@/config/contact";

// Text-only feedback form. Open to any signed-in user. Feedback no longer gates
// Pro — approved trialists already have unrestricted Pro for their whole trial
// window — so this just collects feedback and thanks the user.
export default function FeedbackForm() {
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken ?? "";
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const t = text.trim();
    if (!t) {
      setError("Please write a little something first.");
      return;
    }
    if (!accessToken) {
      setError("Please sign in to send feedback.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await v3SubmitFeedback(accessToken, t);
      setDone(true);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [accessToken, text]);

  const wa = CONTACT_NUMBERS[0];

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <p className="flex items-center gap-2 text-base font-bold text-heading">
          <Check className="h-5 w-5 text-emerald-500" /> Thanks for the feedback! 🙌
        </p>
        <p className="mt-1.5 text-sm text-body">
          We read every note — it genuinely helps us make English Connection better.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-3 text-sm font-semibold text-primary hover:underline"
        >
          Write another
        </button>
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="What's working, what's not, what you'd love to see next…"
        className="w-full resize-y rounded-2xl border border-white/[0.12] bg-surface-2/40 px-4 py-3 text-sm text-heading outline-none focus:border-primary"
      />
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      <div className="mt-3">
        <button
          onClick={submit}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3f9d2c] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send feedback
        </button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Want to share more detailed feedback? Message us on WhatsApp:{" "}
        <a
          href={whatsappLink(wa)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          {formatNumber(wa)}
        </a>
        .
      </p>
    </div>
  );
}
