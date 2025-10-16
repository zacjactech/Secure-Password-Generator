import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CryptoProvider } from "@/context/CryptoContext";
import AppHeader from "@/components/AppHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure Password Vault",
  description: "Privacy-first vault with client-side encryption",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors`}
      >
        <CryptoProvider>
          <AppHeader />
          <main className="p-4 max-w-5xl mx-auto">{children}</main>
        </CryptoProvider>
      </body>
    </html>
  );
}
