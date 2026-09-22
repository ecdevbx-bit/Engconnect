import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Manrope, Fira_Code } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'sonner';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { INSTALL_CAPTURE_SCRIPT } from '@/components/pwa/installCapture';

// Liquid Glass typography — Plus Jakarta Sans (display), Manrope (body),
// Fira Code (mono). Self-hosted and exposed as CSS variables.
const displayFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--ff-display',
  display: 'swap',
});
const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--ff-body',
  display: 'swap',
});
const monoFont = Fira_Code({
  subsets: ['latin'],
  variable: '--ff-mono',
  display: 'swap',
});

const SITE_URL = 'https://englishconnection.in';

export const metadata: Metadata = {
  // metadataBase makes every relative OG/canonical URL resolve to the real
  // domain — required for correct social cards and canonical tags.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'English Connection — Speak English Fearlessly',
    template: '%s · English Connection',
  },
  applicationName: 'English Connection',
  description:
    'English Connection is an AI English coach for India — practise speaking with an AI Partner, rebuild sentences in Jumble Words, and perfect your accent with the Pronunciation Agent. Build fluency with instant feedback, XP, streaks, and badges.',
  keywords: [
    'English Connection',
    'English Connection app',
    'AI English coach',
    'learn English speaking',
    'spoken English practice',
    'English speaking app India',
    'pronunciation practice',
    'English fluency',
  ],
  authors: [{ name: 'English Connection' }],
  creator: 'English Connection',
  publisher: 'Bharatrix Pvt. Ltd.',
  category: 'education',
  // Favicons (from favicon_io) — what Google and browsers show next to the
  // site. The crisp SVG icon is still auto-served from app/icon.svg; these add
  // the .ico + PNG sizes Google and legacy browsers prefer.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'English Connection',
    url: SITE_URL,
    locale: 'en_IN',
    title: 'English Connection — Speak English Fearlessly',
    description:
      'Your AI English coach for India — speak with an AI Partner, master sentences in Jumble Words, and perfect pronunciation with instant feedback.',
    images: [{ url: '/android-chrome-512x512.png', width: 512, height: 512, alt: 'English Connection' }],
  },
  twitter: {
    card: 'summary',
    title: 'English Connection — Speak English Fearlessly',
    description:
      'Your AI English coach for India — speak with an AI Partner, master sentences, and perfect pronunciation.',
    images: ['/android-chrome-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the token from Google Search
  // Console to verify the domain (the tag is omitted when the env var is unset).
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
};

// PWA: theme-color paints the installed app's window/title bar to match the
// dark app chrome (--bg). Next.js reads this `viewport` export automatically.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf2' },
    { media: '(prefers-color-scheme: dark)', color: '#18181c' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body suppressHydrationWarning>
        {/* PWA install capture. Inline and first in <body> on purpose: Chromium
            fires `beforeinstallprompt` before React hydrates, so a listener
            registered in an effect would miss it. This only stashes the event
            for InstallAppPrompt to use later. */}
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CAPTURE_SCRIPT }} />
        {/* Navigation chrome is owned by each route's layout, not the root:
            the (app) group renders the full AppShell; the marketing landing
            renders a bare Navbar; auth/onboarding flows render neither. */}
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: 'glass !rounded-xl !text-heading !text-sm font-sans',
              success: '!text-cyan',
              error: '!text-pink',
            },
          }}
        />
      </body>
    </html>
  );
}
