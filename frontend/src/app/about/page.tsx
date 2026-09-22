import type { Metadata } from "next";
import { InfoPageShell, Section, Bullets } from "@/components/legal/InfoPageShell";

export const metadata: Metadata = {
  title: "About",
  description: "English Connection is an AI English coach built for India's ambitious learners.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPageShell
      title="About English Connection"
      intro="English Connection is an AI English coach built for India's ambitious learners — a place to actually speak, practise, and improve every day, without the cost or schedule of a private tutor."
    >
      <Section title="Our mission">
        <p>
          Hundreds of millions of people in India can read and write English but freeze when it&apos;s
          time to speak. We&apos;re here to change that — to give every learner a patient, always-available
          coach that helps them speak with confidence.
        </p>
      </Section>

      <Section title="What we built">
        <p>Three connected ways to practise, all powered by AI feedback:</p>
        <Bullets
          items={[
            <><strong className="text-heading">AI Partner</strong> — a natural, judgement-free conversation that adapts to your level and gives instant, specific feedback.</>,
            <><strong className="text-heading">Jumble Words</strong> — rebuild real sentences to internalise grammar and word order, with smart hints when you&apos;re stuck.</>,
            <><strong className="text-heading">Pronunciation Agent</strong> — speak a sentence and see exactly which words to polish, with the correct pronunciation on tap.</>,
          ]}
        />
      </Section>

      <Section title="Who it's for">
        <p>
          Students, working professionals, homemakers, and anyone preparing for interviews, study abroad,
          or simply a more confident day at work. If you want to speak better English, English Connection
          meets you where you are.
        </p>
      </Section>

      <Section title="Why it works">
        <Bullets
          items={[
            "You speak from day one — practice, not passive lessons.",
            "Feedback is specific: what you did well and exactly what to fix.",
            "XP, levels, streaks, and badges keep you coming back daily.",
            "Your mistakes become tomorrow's warm-up, so they don't sneak in twice.",
          ]}
        />
      </Section>

      <Section title="Get in touch">
        <p>
          Questions, feedback, or partnership ideas? Write to us at{" "}
          <a href="mailto:hello@englishconnection.in" className="font-semibold text-primary hover:underline">
            hello@englishconnection.in
          </a>
          .
        </p>
      </Section>
    </InfoPageShell>
  );
}
