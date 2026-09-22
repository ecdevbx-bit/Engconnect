import type { Metadata } from "next";
import { InfoPageShell, Section, Bullets } from "@/components/legal/InfoPageShell";
import SupportForm from "@/components/support/SupportForm";

export const metadata: Metadata = {
  title: "Help & Support",
  description: "Something wrong with English Connection? Tell us here — the team gets your report by email and replies to you.",
  alternates: { canonical: "/support" },
};

// One support channel: the "Something wrong?" form (also in the navbar Help
// dropdown) → support ticket + email to the team via Resend (DECISIONS D-029).
export default function SupportPage() {
  return (
    <InfoPageShell
      title="Help & Support"
      updated="22 September 2026"
      intro="Something not working, or an idea to share? Pick what it's about, tell us in a few words, and the English Connection team gets it by email straight away. We'll reply to your email."
    >
      <Section title="Tell us what's up">
        <p>
          You can also open this from the <strong>Help</strong> button at the top of any screen in the app. For ideas and
          feedback, choose <strong>Suggestion / feedback</strong>.
        </p>
        <div className="mt-4 max-w-xl">
          <SupportForm />
        </div>
      </Section>

      <Section title="Response hours">
        <p>We usually reply within a few hours, Monday to Saturday, 10 AM – 8 PM IST.</p>
      </Section>

      <Section title="What we can help with">
        <Bullets
          items={[
            "Account & sign-in problems.",
            "Your Pro plan — what's included, renewals and payments.",
            "Trouble with a game — Jumble Words, Pronunciation or K.AI.",
            "Microphone or audio not working.",
            "Reporting a bug or suggesting a feature.",
          ]}
        />
      </Section>
    </InfoPageShell>
  );
}
