import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://themedcycle.com'),
  title: {
    default: "The MedCycle — Healthcare Resource Exchange",
    template: "%s | The MedCycle",
  },
  description: "A platform for hospitals and individuals to share medications, medical supplies, and equipment with those who need them.",
  keywords: ["medical supplies", "healthcare", "resource exchange", "medications", "medical equipment", "donate medicine", "medical donations"],
  authors: [{ name: "The MedCycle Team" }],
  creator: "The MedCycle",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://themedcycle.com",
    siteName: "The MedCycle",
    title: "The MedCycle — Healthcare Resource Exchange",
    description: "A platform for hospitals and individuals to share medications, medical supplies, and equipment with those who need them.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The MedCycle — Healthcare Resource Exchange",
    description: "A platform for hospitals and individuals to share medications, medical supplies, and equipment with those who need them.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/* Preconnect to Supabase — warms TCP/TLS before any JS fetch fires */}
        <link rel="preconnect" href="https://cdxgsaozgghsngqjhdjm.supabase.co" />
        <link rel="dns-prefetch" href="https://cdxgsaozgghsngqjhdjm.supabase.co" />
        <link rel="icon" type="image/svg+xml" href="/images/logo.svg?v=2" />
        <link rel="shortcut icon" href="/images/logo.svg?v=2" />
        <link rel="apple-touch-icon" href="/images/logo.svg?v=2" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
