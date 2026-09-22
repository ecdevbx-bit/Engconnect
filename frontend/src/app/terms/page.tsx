import type { Metadata } from "next";
import { InfoPageShell, Section, Bullets } from "@/components/legal/InfoPageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of English Connection.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPageShell
      title="Terms of Service"
      updated="22 June 2026"
      intro="These Terms of Service (the &ldquo;Terms&rdquo;) are an agreement between you and English Connection and govern your use of our website and apps (the &ldquo;Service&rdquo;). By using the Service, you agree to these Terms."
    >
      <Section title="1. Acceptance of terms">
        <p>
          By creating an account or using the Service, you confirm that you have read, understood, and agree to be
          bound by these Terms and our{" "}
          <a href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</a>. If you do
          not agree, please do not use the Service.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be able to form a binding contract to use the Service. If you are under 18, you may use the
          Service only with the involvement and consent of a parent or lawful guardian.
        </p>
      </Section>

      <Section title="3. Your account">
        <Bullets
          items={[
            "You are responsible for keeping your login credentials confidential.",
            "You are responsible for all activity that happens under your account.",
            "Notify us immediately of any unauthorised use of your account.",
          ]}
        />
      </Section>

      <Section title="4. Subscriptions & payments">
        <p>
          Some features require a paid subscription. Prices, billing cycle (e.g. monthly), and what&apos;s included
          are shown at the point of purchase. Subscriptions renew automatically unless cancelled before the renewal
          date. Except where required by law, payments are non-refundable.
        </p>
      </Section>

      <Section title="5. Acceptable use">
        <p>You agree not to:</p>
        <Bullets
          items={[
            "Misuse, disrupt, or attempt to gain unauthorised access to the Service.",
            "Copy, resell, or reverse-engineer the Service or its content.",
            "Upload unlawful, harmful, or infringing content.",
            "Use the Service to violate any applicable law.",
          ]}
        />
      </Section>

      <Section title="6. Your content">
        <p>
          You retain ownership of the content you submit (for example, audio recordings and messages). You grant us
          a limited licence to process that content solely to provide and improve the Service, as described in our
          Privacy Policy.
        </p>
      </Section>

      <Section title="7. Intellectual property">
        <p>
          The Service, including its software, design, and content (excluding your content), is owned by English
          Connection and protected by intellectual-property laws. We grant you a personal, non-exclusive,
          non-transferable right to use the Service for your own learning.
        </p>
      </Section>

      <Section title="8. Disclaimers">
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
          whether express or implied, including fitness for a particular purpose. We do not guarantee specific
          learning outcomes.
        </p>
      </Section>

      <Section title="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, English Connection will not be liable for any indirect,
          incidental, or consequential damages. Our total liability for any claim relating to the Service is limited
          to the amount you paid us in the 12 months before the claim arose.
        </p>
      </Section>

      <Section title="10. Termination">
        <p>
          You may stop using the Service and delete your account at any time. We may suspend or terminate your
          access if you breach these Terms or use the Service in a way that could harm us or other users.
        </p>
      </Section>

      <Section title="11. Governing law">
        <p>
          These Terms are governed by the laws of India, and any disputes will be subject to the jurisdiction of the
          courts of India.
        </p>
      </Section>

      <Section title="12. Changes & contact">
        <p>
          We may update these Terms from time to time; we will update the &ldquo;Last updated&rdquo; date and, where
          appropriate, notify you in the app. Questions? Email{" "}
          <a href="mailto:hello@englishconnection.in" className="font-semibold text-primary hover:underline">
            hello@englishconnection.in
          </a>
          .
        </p>
      </Section>

      <Section title="Note">
        <p className="text-sm text-muted-foreground">
          This page is a plain-language template provided for transparency. Please have it reviewed by qualified
          legal counsel and tailored to your business before relying on it.
        </p>
      </Section>
    </InfoPageShell>
  );
}
