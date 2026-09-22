import type { Metadata } from "next";
import { InfoPageShell, Section, Bullets } from "@/components/legal/InfoPageShell";
import { CONTACT_NUMBERS, telLink, smsLink, whatsappLink, formatNumber } from "@/config/contact";
import FeedbackForm from "@/components/support/FeedbackForm";

export const metadata: Metadata = {
  title: "Support & Feedback",
  description: "Get help with English Connection and share your feedback — reach us by call, text, or WhatsApp.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <InfoPageShell
      title="Support & Feedback"
      updated="1 July 2026"
      intro="Need a hand, or have something to tell us? We're just a message away. Share feedback below, or reach the English Connection team by call, text, or WhatsApp — we're happy to help with your account, your Pro plan, or anything about the app."
    >
      <Section title="Share your feedback">
        <p>
          Tell us what&apos;s working and what isn&apos;t — it genuinely shapes what we build next.
          On the free Pro trial? Your Pro access is unlocked for the whole trial automatically —
          feedback is always welcome but never required.
        </p>
        <div className="mt-4">
          <FeedbackForm />
        </div>
      </Section>

      <Section title="Reach us">
        <p>Tap a number to get in touch however you like:</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CONTACT_NUMBERS.map((n) => (
            <div key={n} className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-4">
              <p className="text-base font-bold text-heading">{formatNumber(n)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={telLink(n)}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-[#0b0e14] transition-colors hover:bg-primary-1"
                >
                  Call
                </a>
                <a
                  href={smsLink(n)}
                  className="rounded-full border border-white/[0.12] px-4 py-2 text-sm font-semibold text-heading transition-colors hover:bg-surface-2"
                >
                  Text
                </a>
                <a
                  href={whatsappLink(n)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-[filter] hover:brightness-105"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Response hours">
        <p>We usually reply within a few hours, Monday to Saturday, 10 AM – 8 PM IST.</p>
      </Section>

      <Section title="Email">
        <p>
          Prefer email? Write to us at{" "}
          <a href="mailto:support@englishconnection.in" className="font-semibold text-primary hover:underline">
            support@englishconnection.in
          </a>{" "}
          and we&apos;ll get back to you.
        </p>
      </Section>

      <Section title="What we can help with">
        <Bullets
          items={[
            "Account & sign-in problems.",
            "Your Pro plan — billing, renewals, and what's included.",
            "Trouble with a game — Jumble Words, Pronunciation, or K.AI.",
            "Reporting a bug or suggesting a feature.",
          ]}
        />
      </Section>
    </InfoPageShell>
  );
}
