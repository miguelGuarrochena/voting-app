import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL('https://letspicky.com'),
  title: {
    default: 'Pickly — Crea y comparte encuestas en segundos',
    template: '%s · Pickly',
  },
  description:
    'Pickly es la forma más simple de crear encuestas, rankings, ratings y torneos para compartir con amigos. Sin registro obligatorio, sin complicaciones.',
  applicationName: 'Pickly',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico',
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
    url: 'https://letspicky.com',
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
};

const RootLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <html lang="en" className="h-full">
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
      </body>
    </html>
  );
};

export default RootLayout;
