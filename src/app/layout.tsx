import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import StoreProvider from '@/providers/StoreProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FF4D6A',
};

export const metadata: Metadata = {
  title: "Polls - Create and Share Polls",
  description: "Create and share polls with your community. Social voting made fun and easy.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Polls",
  },
  openGraph: {
    title: "Polls - Create and Share Polls",
    description: "Create and share polls with your community. Social voting made fun and easy.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polls - Create and Share Polls",
    description: "Create and share polls with your community. Social voting made fun and easy.",
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
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <StoreProvider>
                  <Navbar />
                  <main className="flex-grow flex flex-col pt-0 lg:pt-20">
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </main>
                  <Footer />
                </StoreProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
};

export default RootLayout;
