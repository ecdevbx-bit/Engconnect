import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ShowcaseV4 from "@/components/ShowcaseV4";

const SITE_URL = "https://englishconnection.in";

// Structured data (schema.org) so Google understands the brand, the site, and
// the app — improves the chance of a richer "English Connection" result.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "English Connection",
      url: SITE_URL,
      logo: `${SITE_URL}/android-chrome-512x512.png`,
      // Add your verified profiles here to strengthen the brand knowledge graph:
      // sameAs: ["https://www.youtube.com/@...", "https://www.instagram.com/..."],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "English Connection",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "MobileApplication",
      name: "English Connection",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web, Android, iOS",
      url: SITE_URL,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
  ],
};

// Home is the marketing landing page for logged-out visitors (the promoted v4
// design — the previous landing now lives at /showcase/v4). A signed-in user
// who hits `/` is sent straight to their dashboard — the landing is only ever
// shown pre-login.
export default async function Page() {
  const session = await auth();
  if (session?.user?.sub && !session.error) {
    redirect("/dashboard");
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <ShowcaseV4 />
    </>
  );
}
