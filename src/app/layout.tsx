import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import StoreProvider from '@/providers/StoreProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Pickly - Social Voting Made Simple",
  description: "Create and participate in fun polls with your friends",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <StoreProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="py-4 text-center text-sm text-slate-500">
              © {new Date().getFullYear()} Pickly. All rights reserved.
            </footer>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
