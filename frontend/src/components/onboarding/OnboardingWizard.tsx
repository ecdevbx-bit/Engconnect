"use client";

// Self-contained 4-step onboarding card. No internal navigation — the host
// (FirstLoginOnboardingModal or V3AIPartner pre-session) decides what to render
// before/after via onComplete / onSkip.
//
// Phone-first (D-060): the host gives the card its height; the step body
// scrolls and the footer with one big Next button stays pinned, so Next is
// never pushed off-screen. Only the answers the server requires (language,
// status, reason) block Next — city, goal and hobbies are optional. Tapping
// a language moves on by itself.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/apiClient";
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
const TOTAL_STEPS = 4;

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

// What's still missing on a step ("" = can go on).
function missing(step: number, d: Draft): string {
  if (step === 1 && !d.nativeLang) return "Pick your language";
  if (step === 2 && !d.currentStatus) return "Pick what you do";
  if (step === 3 && !d.englishReason) return "Pick a reason";
  return "";
}

export interface OnboardingWizardProps {
  /** Called once the user has successfully submitted answers. */
  onComplete: () => void;
  /** Called when the user dismisses without finishing. */
  onSkip: () => void;
  /** Short line above the first question — surface-specific. */
  eyebrowOverride?: string;
  /** Sizing from the host (the card fills it and scrolls inside). */
  className?: string;
}

export default function OnboardingWizard({
  onComplete,
  onSkip,
  eyebrowOverride,
  className,
}: OnboardingWizardProps) {
  const { data: session, update: updateSession } = useSession();
  const accessToken = session?.user?.accessToken ?? null;
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "";

  const [step, setStep] = useState(1);
  // Only mounted on the client after the session loads, so the saved draft
  // can be read during the first render.
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when Next is tapped on an unfinished step, so the hint shows only then.
  const [nudge, setNudge] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const autoNext = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* private mode / quota — ignore */
    }
  }, [draft]);

  useEffect(() => () => {
    if (autoNext.current) clearTimeout(autoNext.current);
  }, []);

  const goTo = useCallback((s: number) => {
    setNudge(false);
    setError(null);
    setStep(Math.max(1, Math.min(TOTAL_STEPS, s)));
    bodyRef.current?.scrollTo({ top: 0 });
  }, []);

  const submit = useCallback(async () => {
    if (!accessToken) {
      setError("You're not signed in.");
      return;
    }
    const firstMissing = [1, 2, 3].find((s) => missing(s, draft));
    if (firstMissing) {
      goTo(firstMissing);
      setNudge(true);
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
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  }, [accessToken, draft, updateSession, onComplete, goTo]);

  const next = useCallback(() => {
    if (missing(step, draft)) {
      setNudge(true);
      return;
    }
    if (step < TOTAL_STEPS) goTo(step + 1);
    else void submit();
  }, [step, draft, goTo, submit]);

  const hint = nudge ? missing(step, draft) : "";

  return (
    <div className={cn("c-box flex w-full flex-col overflow-hidden", className)}>
      {/* Top bar: back, progress, skip */}
      <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
        <button
          type="button"
          onClick={() => goTo(step - 1)}
          disabled={step === 1 || submitting}
          aria-label="Back"
          className="-ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg text-muted-foreground transition hover:bg-surface-2/60 hover:text-heading disabled:invisible"
        >
          ←
        </button>
        <div
          className="flex flex-1 gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
          aria-label={`Step ${step} of ${TOTAL_STEPS}`}
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < step ? "bg-gradient-to-r from-[#f59e0b] to-[#f97316]" : "bg-surface-3",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          disabled={submitting}
          className="-mr-2 h-10 shrink-0 rounded-full px-3 text-[13px] font-semibold text-muted-foreground transition hover:text-heading"
        >
          Skip
        </button>
      </div>

      {/* Step body — the only part that scrolls */}
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-3 sm:px-6">
        {step === 1 && (
          <>
            <Title eyebrow={eyebrowOverride ?? (firstName ? `Hi ${firstName} 👋` : "Welcome 👋")}>
              Your native language?
            </Title>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {NATIVE_LANG_OPTIONS.map((opt) => (
                <Tile
                  key={opt.id}
                  selected={draft.nativeLang === opt.id}
                  onClick={() => {
                    setDraft((d) => ({ ...d, nativeLang: opt.id }));
                    setNudge(false);
                    // One tap answers this step — move on after the tap shows.
                    if (autoNext.current) clearTimeout(autoNext.current);
                    autoNext.current = setTimeout(() => goTo(2), 220);
                  }}
                  className="flex-col py-4"
                >
                  <span className="text-[26px] leading-none">{opt.native}</span>
                  <span className="text-[14px] font-semibold">{opt.label}</span>
                </Tile>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Title>What do you do?</Title>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {STATUS_OPTIONS.map((opt) => (
                <Tile
                  key={opt.id}
                  selected={draft.currentStatus === opt.id}
                  onClick={() => {
                    setDraft((d) => ({ ...d, currentStatus: opt.id }));
                    setNudge(false);
                  }}
                >
                  <span className="text-[18px]">{opt.emoji}</span>
                  <span className="text-[14px] font-semibold">{opt.label}</span>
                </Tile>
              ))}
            </div>
            <Field label="City" optional>
              <input
                type="text"
                value={draft.location}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && next()}
                placeholder="Mumbai"
                maxLength={80}
                autoComplete="address-level2"
                enterKeyHint="next"
                className={INPUT}
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Title>Why are you learning English?</Title>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {REASON_OPTIONS.map((opt) => (
                <Tile
                  key={opt.id}
                  selected={draft.englishReason === opt.id}
                  onClick={() => {
                    setDraft((d) => ({ ...d, englishReason: opt.id }));
                    setNudge(false);
                  }}
                >
                  <span className="text-[18px]">{opt.emoji}</span>
                  <span className="text-[14px] font-semibold">{opt.label}</span>
                </Tile>
              ))}
            </div>
            <Field label="Your goal" optional>
              <input
                type="text"
                value={draft.goals}
                onChange={(e) => setDraft((d) => ({ ...d, goals: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && next()}
                placeholder="Speak confidently in interviews"
                maxLength={280}
                enterKeyHint="next"
                className={INPUT}
              />
            </Field>
          </>
        )}

        {step === 4 && (
          <StepHobbies hobbies={draft.hobbies} onChange={(v) => setDraft((d) => ({ ...d, hobbies: v }))} />
        )}
      </div>

      {/* Pinned footer */}
      <div className="shrink-0 border-t border-border px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        {(hint || error) && (
          <p role="alert" className="mb-2 text-center text-[13px] font-semibold text-destructive">
            {error || hint}
          </p>
        )}
        <button
          type="button"
          onClick={next}
          disabled={submitting}
          className={cn(
            "h-12 w-full rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[15px] font-bold text-[#0b0e14] shadow-[0_6px_18px_rgba(249,115,22,0.25)] transition active:scale-[0.98] disabled:opacity-60 sm:ml-auto sm:block sm:w-48",
            missing(step, draft) && "opacity-60",
          )}
        >
          {step < TOTAL_STEPS ? "Next" : submitting ? "Saving…" : "Start learning"}
        </button>
      </div>
    </div>
  );
}

const INPUT =
  "mt-2 h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-[16px] text-heading outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-1 focus:ring-primary/20";

function Title({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return (
    <div>
      {eyebrow && <p className="text-[13px] font-semibold text-primary">{eyebrow}</p>}
      <h2 className="mt-1 text-[22px] font-bold leading-tight text-heading sm:text-[26px]">{children}</h2>
    </div>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="mt-6 block">
      <span className="text-[14px] font-semibold text-heading">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

function Tile({
  selected,
  onClick,
  className,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-[52px] items-center gap-2 rounded-xl border px-3 text-left text-heading transition active:scale-[0.98]",
        selected
          ? "border-primary/70 bg-primary/15 ring-1 ring-primary/40"
          : "border-border bg-surface-2/50 hover:border-primary/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

function StepHobbies({ hobbies, onChange }: { hobbies: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const full = hobbies.length >= 10;

  const toggle = (h: string) => {
    if (hobbies.includes(h)) onChange(hobbies.filter((x) => x !== h));
    else if (!full) onChange([...hobbies, h]);
  };

  const addCustom = () => {
    const t = custom.trim();
    if (t && !full && !hobbies.some((h) => h.toLowerCase() === t.toLowerCase())) onChange([...hobbies, t]);
    setCustom("");
  };

  const extra = hobbies.filter((h) => !HOBBY_SUGGESTIONS.includes(h));

  return (
    <>
      <Title>What do you enjoy?</Title>
      <p className="mt-1 text-[13px] text-muted-foreground">K.AI picks topics from these. Optional.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {[...HOBBY_SUGGESTIONS, ...extra].map((h) => {
          const selected = hobbies.includes(h);
          return (
            <button
              key={h}
              type="button"
              onClick={() => toggle(h)}
              aria-pressed={selected}
              className={cn(
                "h-10 rounded-full border px-4 text-[14px] font-semibold transition",
                selected
                  ? "border-primary/70 bg-primary/15 text-heading"
                  : "border-border bg-surface-2/50 text-muted-foreground hover:text-heading",
              )}
            >
              {selected ? "✓ " : ""}
              {h}
            </button>
          );
        })}
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
          placeholder="Something else"
          aria-label="Add your own"
          maxLength={40}
          enterKeyHint="done"
          className={cn(INPUT, "mt-0 flex-1")}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim() || full}
          className="h-12 rounded-xl border border-border px-4 text-[14px] font-semibold text-heading transition hover:bg-surface-2/70 disabled:opacity-30"
        >
          Add
        </button>
      </div>
    </>
  );
}
