import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppAuthProvider } from '@/app/components/AuthProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Qadra Oil — Fuel Quota & Billing",
  description: "Fuel-quota and post-pay billing management system",
  manifest: "/manifest.json",
  themeColor: "#1a6b4a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={inter.className}>
        <AppAuthProvider>
          {children}
        </AppAuthProvider>
      </body>
    </html>
  );
}