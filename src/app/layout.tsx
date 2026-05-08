import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Navbar from '@/components/layout/Navbar';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { UsernameProvider } from '@/context/UsernameContext';
import { AuthProvider } from '@/context/AuthContext';
import StoreProvider from '@/providers/StoreProvider';
import { ErrorBoundary } from '@/components/states/ErrorBoundary';
import Footer from '@/components/layout/Footer';
import OnboardingScreen from '@/components/onboarding/OnboardingScreen';
import { CleanupEffect } from '@/components/effects/CleanupEffect';
import { Toaster } from 'react-hot-toast';
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FF4D6A',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://letspickly.com'),
  title: {
    default: 'Pickly — Crea y comparte encuestas en segundos',
    template: '%s · Pickly',
  },
  description:
    'Pickly es la forma más simple de crear encuestas, rankings, ratings y torneos para compartir con amigos. Sin registro obligatorio, sin complicaciones.',
  applicationName: 'Pickly',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pickly',
  },
  openGraph: {
    title: 'Pickly — Crea y comparte encuestas en segundos',
    description:
      'Crea encuestas, rankings, ratings y torneos 1-vs-1. Compartí el link y votá en segundos, sin registro.',
    url: 'https://letspickly.com',
    siteName: 'Pickly',
    type: 'website',
    locale: 'es_AR',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Pickly',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pickly — Crea y comparte encuestas en segundos',
    description:
      'Encuestas, rankings, ratings y torneos. Compartí el link y votá en segundos, sin registro.',
    images: ['/icon-512.png'],
  },
  // Google Search Console verification. The token is just a random
  // ownership-proof string (not a secret, fine to commit) but we read
  // it from env so swapping or removing it doesn't require a code
  // change. Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in Vercel project
  // settings → Environment Variables, then redeploy.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

const RootLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // JSON-LD structured data for the site itself. WebSite gives Google a
  // sitelinks search box opportunity (potentialAction), Organization gives
  // it a canonical name + logo for knowledge panels and social cards.
  // Inlined as a script tag in <head> — server-rendered, so crawlers see
  // it on first paint without waiting for JS.
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://letspickly.com/#website',
        url: 'https://letspickly.com',
        name: 'Pickly',
        description:
          'Crea encuestas, rankings, ratings y torneos para compartir con amigos. Sin registro, sin complicaciones.',
        inLanguage: 'es',
        publisher: { '@id': 'https://letspickly.com/#organization' },
      },
      {
        '@type': 'Organization',
        '@id': 'https://letspickly.com/#organization',
        name: 'Pickly',
        url: 'https://letspickly.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://letspickly.com/icon-512.png',
          width: 512,
          height: 512,
        },
      },
    ],
  };

  return (
    // lang="es" matches the metadata + content. Was hardcoded to "en"
    // which was actively confusing crawlers (Google was probably
    // ranking us in the wrong locale). The app supports an EN toggle
    // but the default audience and SSR-rendered content is Spanish.
    <html lang="es" className="h-full">
      <head>
        <script
          type="application/ld+json"
          // Next.js requires this exact pattern for JSON-LD in server
          // components — stringify and inject as innerHTML.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ErrorBoundary>
          <AuthProvider>
            <UsernameProvider>
              <ThemeProvider>
                <LanguageProvider>
                  <StoreProvider>
                    <CleanupEffect />
                    <OnboardingScreen />
                    <Navbar />
                    <main className="flex-grow flex flex-col">
                      <ErrorBoundary>
                        {children}
                      </ErrorBoundary>
                    </main>
                    <Footer />
                  </StoreProvider>
                </LanguageProvider>
              </ThemeProvider>
            </UsernameProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster position="bottom-center" toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          },
        }} />
        <Analytics />
        {/*
          Cloudflare Turnstile loader. Cargado con strategy=afterInteractive
          para no bloquear el render inicial. El widget invisible se renderiza
          on-demand desde useTurnstile() — ver src/lib/turnstile.ts.
          Si NEXT_PUBLIC_TURNSTILE_SITE_KEY no está seteada, el script igual
          carga pero no se ejecuta nada (el hook degrada a token=null).
        */}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
};

export default RootLayout;
