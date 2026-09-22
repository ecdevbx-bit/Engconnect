import type { Metadata } from "next";
import { InfoPageShell, Section, Bullets } from "@/components/legal/InfoPageShell";
import { CONTACT_NUMBERS, telLink, formatNumber } from "@/config/contact";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How English Connection collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPageShell
      title="Privacy Policy"
      updated="22 June 2026"
      intro="This Privacy Policy explains what personal data English Connection collects, why we collect it, how we use and protect it, and the choices and rights you have. It is written to align with India's Digital Personal Data Protection Act, 2023 (DPDP Act)."
    >
      <Section title="1. Who we are">
        <p>
          English Connection (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is the data fiduciary responsible for your
          personal data when you use our website and apps (the &ldquo;Service&rdquo;). For any privacy
          question or request, contact our Grievance Officer at{" "}
          <a href="mailto:privacy@englishconnection.in" className="font-semibold text-primary hover:underline">
            privacy@englishconnection.in
          </a>
          . You can also reach us by call, text, or WhatsApp at{" "}
          {CONTACT_NUMBERS.map((n, i) => (
            <span key={n}>
              {i > 0 && " or "}
              <a href={telLink(n)} className="font-semibold text-primary hover:underline">
                {formatNumber(n)}
              </a>
            </span>
          ))}
          .
        </p>
      </Section>

      <Section title="2. Information we collect">
        <Bullets
          items={[
            <><strong className="text-heading">Account details</strong> — name, email address, and password (stored hashed) when you sign up.</>,
            <><strong className="text-heading">Learning data</strong> — your lessons, scores, XP, levels, streaks, badges, and progress.</>,
            <><strong className="text-heading">Audio</strong> — voice recordings you submit for pronunciation feedback, processed to score your speech.</>,
            <><strong className="text-heading">Usage & device data</strong> — app interactions, device type, and basic analytics to improve the Service.</>,
          ]}
        />
      </Section>

      <Section title="3. How we use your data">
        <Bullets
          items={[
            "To provide the Service — run lessons, score attempts, and track your progress.",
            "To personalise your experience and recommend what to practise next.",
            "To maintain security, prevent abuse, and troubleshoot issues.",
            "To communicate with you about your account and important updates.",
          ]}
        />
      </Section>

      <Section title="4. Consent & legal basis">
        <p>
          We process your personal data based on the consent you give when you sign up and use the Service,
          or where processing is necessary for certain legitimate uses permitted under the DPDP Act. You can
          withdraw your consent at any time (see &ldquo;Your rights&rdquo; below); withdrawing consent does not
          affect processing already carried out.
        </p>
      </Section>

      <Section title="5. Sharing & disclosure">
        <p>
          We do not sell your personal data. We share it only with trusted service providers (data processors)
          who help us run the Service — for example, cloud hosting and speech processing — under contracts that
          require them to protect your data and use it only on our instructions. We may also disclose data where
          required by law.
        </p>
      </Section>

      <Section title="6. Cookies & analytics">
        <p>
          We use essential cookies to keep you signed in and limited analytics to understand how the Service is
          used. You can control cookies through your browser settings.
        </p>
      </Section>

      <Section title="7. Data retention">
        <p>
          We keep your personal data for as long as your account is active or as needed to provide the Service.
          When it is no longer required, we delete or anonymise it, unless we must retain it to comply with a
          legal obligation.
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          We use reasonable technical and organisational safeguards — including encryption in transit and access
          controls — to protect your data. No method of transmission or storage is completely secure, but we work
          continuously to protect your information.
        </p>
      </Section>

      <Section title="9. Your rights">
        <p>Under the DPDP Act, you have the right to:</p>
        <Bullets
          items={[
            "Access a summary of the personal data we process about you.",
            "Request correction, completion, or erasure of your personal data.",
            "Withdraw consent at any time.",
            "Nominate another person to exercise your rights in case of death or incapacity.",
            "Raise a grievance with us, and escalate to the Data Protection Board of India.",
          ]}
        />
        <p>
          To exercise any of these, email{" "}
          <a href="mailto:privacy@englishconnection.in" className="font-semibold text-primary hover:underline">
            privacy@englishconnection.in
          </a>
          .
        </p>
      </Section>

      <Section title="10. Children">
        <p>
          For users under 18, we process personal data only with verifiable consent from a parent or lawful
          guardian, as required by the DPDP Act.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this policy from time to time. When we make material changes, we will update the
          &ldquo;Last updated&rdquo; date above and, where appropriate, notify you in the app.
        </p>
      </Section>

      <Section title="Note">
        <p className="text-sm text-muted-foreground">
          This page is a plain-language template provided for transparency. Please have it reviewed by qualified
          legal counsel and tailored to your final data practices before relying on it.
        </p>
      </Section>
    </InfoPageShell>
  );
}
