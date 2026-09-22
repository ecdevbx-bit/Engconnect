"use client";

// Self-contained 5-step v3 onboarding card. No internal navigation —
// the host (FirstLoginOnboardingModal or V3AIPartner pre-session)
// decides what to render before/after via onComplete / onSkip.
//
// Renders as a card with progress bar at the top, step content in
// the middle, and a footer with Back / Skip / Next-or-Finish. Fits
// naturally inside a modal overlay or inline in a page.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { useLangCarouselEnabled } from "@/lib/featureFlags";
import { ApiError } from "@/lib/apiClient";
import LanguageCarousel from "./LanguageCarousel";
import {
  v3SubmitOnboarding,
  NATIVE_LANG_OPTIONS,
  STATUS_OPTIONS,
  REASON_OPTIONS,
  HOBBY_SUGGESTIONS,
  type OnboardingPayload,
  type OnboardingNativeLang,
  type OnboardingStatus,
  type OnboardingReason,
} from "@/lib/v3Onboarding";

const STORAGE_KEY = "ec.v3.onboarding.draft";
const TOTAL_STEPS = 5;

interface Draft {
  nativeLang: OnboardingNativeLang | "";
  location: string;
  currentStatus: OnboardingStatus | "";
  englishReason: OnboardingReason | "";
  goals: string;
  hobbies: string[];
}

const EMPTY_DRAFT: Draft = {
  nativeLang: "",
  location: "",
  currentStatus: "",
  englishReason: "",
  goals: "",
  hobbies: [],
};

function loadDraft(): Draft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return { ...EMPTY_DRAFT, ...parsed, hobbies: parsed.hobbies ?? [] };
  } catch {
    return EMPTY_DRAFT;
  }
}

export interface OnboardingWizardProps {
  /** Called once the user has successfully submitted answers. */
  onComplete: () => void;
  /** Called when the user dismisses without finishing. */
  onSkip: () => void;
  /** Short copy shown above the title — surface-specific hint. */
  eyebrowOverride?: string;
}

export default function OnboardingWizard({
  onComplete,
  onSkip,
  eyebrowOverride,
}: OnboardingWizardProps) {
  const { data: session, update: updateSession } = useSession();
  const accessToken = session?.user?.accessToken ?? null;
  const firstName =
    (session?.user?.name?.trim().split(/\s+/)[0]) || "there";

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* private mode / quota — ignore */
    }
  }, [draft]);

  const stepValid = useMemo(() => isStepValid(step, draft), [step, draft]);

  const next = useCallback(() => {
    if (!stepValid) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }, [stepValid]);

  const back = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const submit = useCallback(async () => {
    if (!accessToken) {
      setError("You're not signed in.");
      return;
    }
    if (!isStepValid(5, draft)) {
      setError("Please complete all steps before finishing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: OnboardingPayload = {
        nativeLang: draft.nativeLang as OnboardingNativeLang,
        location: draft.location.trim(),
        currentStatus: draft.currentStatus as OnboardingStatus,
        englishReason: draft.englishReason as OnboardingReason,
        goals: draft.goals.trim(),
        hobbies: draft.hobbies,
      };
      const updated = await v3SubmitOnboarding(accessToken, payload);
      await updateSession({
        user: {
          nativeLang: updated.nativeLang,
          currentStatus: updated.currentStatus,
          onboardingCompleted: true,
        },
      });
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
      onComplete();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      setError(msg);
      setSubmitting(false);
    }
  }, [accessToken, draft, updateSession, onComplete]);

  return (
    <div className="c-box flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl">
      {/* Progress bar pinned to the card top */}
      <div className="flex items-center gap-2 px-6 pt-6 sm:px-8 sm:pt-7">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const idx = i + 1;
          const done = idx < step;
          const active = idx === step;
          return (
            <div
              key={idx}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                done
                  ? "bg-gradient-to-r from-[#f59e0b] to-[#f97316]"
                  : active
                    ? "bg-gradient-to-r from-[#b79fff]/80 to-[#ab8eff]/80"
                    : "bg-surface-3"
              )}
            />
          );
        })}
      </div>

      {/* Step body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
        {step === 1 && (
          <StepLanguage
            firstName={firstName}
            eyebrowOverride={eyebrowOverride}
            value={draft.nativeLang}
            onChange={(v) => setDraft((d) => ({ ...d, nativeLang: v }))}
          />
        )}
        {step === 2 && (
          <StepAboutYou
            location={draft.location}
            status={draft.currentStatus}
            onLocation={(v) => setDraft((d) => ({ ...d, location: v }))}
            onStatus={(v) => setDraft((d) => ({ ...d, currentStatus: v }))}
          />
        )}
        {step === 3 && (
          <StepWhy
            reason={draft.englishReason}
            goals={draft.goals}
            onReason={(v) => setDraft((d) => ({ ...d, englishReason: v }))}
            onGoals={(v) => setDraft((d) => ({ ...d, goals: v }))}
          />
        )}
        {step === 4 && (
          <StepHobbies
            hobbies={draft.hobbies}
            onChange={(v) => setDraft((d) => ({ ...d, hobbies: v }))}
          />
        )}
        {step === 5 && <StepReview draft={draft} />}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-6 py-4 sm:px-8">
        <button
          type="button"
          onClick={back}
          disabled={step === 1 || submitting}
          className="rounded-full border border-white/[0.08] px-4 py-2 text-[12.5px] font-semibold text-muted-foreground transition hover:bg-surface-2/60 hover:text-heading disabled:cursor-not-allowed disabled:opacity-30"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            disabled={submitting}
            className="text-[12.5px] font-semibold text-muted-foreground transition hover:text-heading"
          >
            Maybe later
          </button>
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={next}
              disabled={!stepValid}
              className="rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316] px-5 py-2 text-[12.5px] font-bold text-[#0b0e14] shadow-[0_6px_18px_rgba(249,115,22,0.25)] transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316] px-5 py-2 text-[12.5px] font-bold text-[#0b0e14] shadow-[0_8px_22px_rgba(249,115,22,0.35)] transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving…" : "✨ Finish"}
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-center text-[12px] text-destructive sm:px-8">
          {error}
        </div>
      )}
    </div>
  );
}

function isStepValid(step: number, d: Draft): boolean {
  switch (step) {
    case 1:
      return d.nativeLang !== "";
    case 2:
      return d.location.trim().length > 0 && d.currentStatus !== "";
    case 3:
      return d.englishReason !== "" && d.goals.trim().length > 0;
    case 4:
      return d.hobbies.length > 0;
    case 5:
      return (
        isStepValid(1, d) && isStepValid(2, d) && isStepValid(3, d) && isStepValid(4, d)
      );
    default:
      return false;
  }
}

function StepHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-[22px] font-bold text-gradient sm:text-[26px]">{title}</h2>
      {subtitle && (
        <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

function StepLanguage({
  firstName,
  eyebrowOverride,
  value,
  onChange,
}: {
  firstName: string;
  eyebrowOverride?: string;
  value: OnboardingNativeLang | "";
  onChange: (v: OnboardingNativeLang) => void;
}) {
  const carousel = useLangCarouselEnabled();
  return (
    <section>
      <StepHeader
        eyebrow={eyebrowOverride ?? `Hi ${firstName} · Step 1`}
        title="What's your native language?"
        subtitle="K.AI uses this to throw in a familiar phrase when you're stuck — and to help with translations."
      />
      {carousel ? (
        <div className="mt-4">
          <LanguageCarousel value={value} onChange={onChange} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {NATIVE_LANG_OPTIONS.map((opt) => {
            const selected = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                aria-pressed={selected}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-4 text-center transition",
                  selected
                    ? "border-primary/60 bg-primary/10 shadow-[0_8px_22px_rgba(249,115,22,0.18)]"
                    : "border-white/[0.06] bg-surface-2/40 hover:border-white/[0.12] hover:bg-surface-2/70"
                )}
              >
                <span className="text-[28px] leading-none">{opt.native}</span>
                <span className="text-[12.5px] font-semibold text-heading">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StepAboutYou({
  location,
  status,
  onLocation,
  onStatus,
}: {
  location: string;
  status: OnboardingStatus | "";
  onLocation: (v: string) => void;
  onStatus: (v: OnboardingStatus) => void;
}) {
  return (
    <section>
      <StepHeader
        eyebrow="Step 2"
        title="Tell us about you"
        subtitle="A little context goes a long way. K.AI remembers and uses these in conversation."
      />
      <div className="mt-6 space-y-6">
        <div>
          <label className="text-[13px] font-semibold text-heading">
            Where do you live?
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => onLocation(e.target.value)}
            placeholder="e.g. Mumbai"
            maxLength={80}
            className="mt-2 h-11 w-full rounded-xl border border-white/[0.08] bg-surface-2 px-4 text-[14px] text-heading outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-heading">
            What are you up to right now?
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {STATUS_OPTIONS.map((opt) => {
              const selected = status === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onStatus(opt.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition",
                    selected
                      ? "border-primary/60 bg-primary/10 text-heading"
                      : "border-white/[0.06] bg-surface-2/40 text-muted-foreground hover:border-white/[0.12] hover:text-heading"
                  )}
                >
                  <span className="text-[17px]">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepWhy({
  reason,
  goals,
  onReason,
  onGoals,
}: {
  reason: OnboardingReason | "";
  goals: string;
  onReason: (v: OnboardingReason) => void;
  onGoals: (v: string) => void;
}) {
  return (
    <section>
      <StepHeader
        eyebrow="Step 3"
        title="Why are you here?"
        subtitle="Knowing your reason helps K.AI steer conversations the right way."
      />
      <div className="mt-6 space-y-6">
        <div>
          <label className="text-[13px] font-semibold text-heading">
            Pick the closest reason
          </label>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {REASON_OPTIONS.map((opt) => {
              const selected = reason === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onReason(opt.id)}
                  aria-pressed={selected}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                    selected
                      ? "border-primary/60 bg-primary/10"
                      : "border-white/[0.06] bg-surface-2/40 hover:border-white/[0.12]"
                  )}
                >
                  <span className="text-[20px]">{opt.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-heading">{opt.label}</span>
                    <span className="block text-[12px] leading-5 text-muted-foreground">{opt.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-heading">
            What&apos;s one thing you&apos;d love to be able to do?
          </label>
          <textarea
            value={goals}
            onChange={(e) => onGoals(e.target.value)}
            placeholder="e.g. Speak confidently in interviews"
            maxLength={280}
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-surface-2 px-4 py-3 text-[14px] leading-6 text-heading outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            {goals.length}/280
          </p>
        </div>
      </div>
    </section>
  );
}

function StepHobbies({
  hobbies,
  onChange,
}: {
  hobbies: string[];
  onChange: (v: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  const toggle = (h: string) => {
    if (hobbies.includes(h)) {
      onChange(hobbies.filter((x) => x !== h));
    } else {
      if (hobbies.length >= 10) return;
      onChange([...hobbies, h]);
    }
  };

  const addCustom = () => {
    const t = custom.trim();
    if (!t || hobbies.length >= 10) {
      setCustom("");
      return;
    }
    if (!hobbies.find((h) => h.toLowerCase() === t.toLowerCase())) {
      onChange([...hobbies, t]);
    }
    setCustom("");
  };

  return (
    <section>
      <StepHeader
        eyebrow="Step 4"
        title="What do you enjoy?"
        subtitle="K.AI will lean on these for conversation topics. Pick a few — or add your own."
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {HOBBY_SUGGESTIONS.map((h) => {
          const selected = hobbies.includes(h);
          return (
            <button
              key={h}
              type="button"
              onClick={() => toggle(h)}
              aria-pressed={selected}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition",
                selected
                  ? "border-primary/60 bg-primary/15 text-heading"
                  : "border-white/[0.06] bg-surface-2/40 text-muted-foreground hover:border-white/[0.12] hover:text-heading"
              )}
            >
              {selected ? "✓ " : ""}
              {h}
            </button>
          );
        })}
        {hobbies
          .filter((h) => !HOBBY_SUGGESTIONS.includes(h))
          .map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => toggle(h)}
              className="rounded-full border border-primary/60 bg-primary/15 px-3.5 py-1.5 text-[12.5px] font-semibold text-heading"
            >
              ✓ {h}
            </button>
          ))}
      </div>

      <div className="mt-5 flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add your own (press Enter)"
          maxLength={40}
          className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-surface-2 px-4 text-[13.5px] text-heading outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim() || hobbies.length >= 10}
          className="rounded-xl border border-white/[0.08] px-3.5 text-[12.5px] font-semibold text-heading transition hover:bg-surface-2/70 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Add
        </button>
      </div>
      <p className="mt-2 text-[11.5px] text-muted-foreground">
        {hobbies.length}/10 picked
      </p>
    </section>
  );
}

function StepReview({ draft }: { draft: Draft }) {
  const statusLabel = STATUS_OPTIONS.find((s) => s.id === draft.currentStatus)?.label ?? "—";
  const reasonLabel = REASON_OPTIONS.find((s) => s.id === draft.englishReason)?.label ?? "—";

  return (
    <section>
      <StepHeader
        eyebrow="Step 5"
        title="Looks good?"
        subtitle="Quick check before we hand you over to K.AI."
      />
      <dl className="mt-6 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-surface-2/40">
        <Row label="Native language" value={draft.nativeLang || "—"} />
        <Row label="Lives in" value={draft.location || "—"} />
        <Row label="Currently" value={statusLabel} />
        <Row label="Reason" value={reasonLabel} />
        <Row label="Goal" value={draft.goals || "—"} />
        <Row label="Hobbies" value={draft.hobbies.join(", ") || "—"} />
      </dl>
      <p className="mt-3 text-[11.5px] text-muted-foreground">
        You can edit any of these later from your profile.
      </p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <dt className="w-32 shrink-0 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="flex-1 text-[13.5px] text-heading">{value}</dd>
    </div>
  );
}
