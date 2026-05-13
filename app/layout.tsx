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
  title: "The MedCycle — Healthcare Resource Exchange",
  description: "A platform for hospitals and individuals to share medications, medical supplies, and equipment with those who need them.",
  keywords: ["medical supplies", "healthcare", "resource exchange", "medications", "medical equipment"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
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
